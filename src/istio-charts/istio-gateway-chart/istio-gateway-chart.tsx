import { Renderer } from "@k8slens/extensions";
import React from "react";
import * as yaml from "js-yaml";
import { observable } from "mobx";
import { observer } from "mobx-react";

const {
  K8sApi: { podsApi, namespacesApi, serviceApi },
} = Renderer;

import * as go from "gojs";
import { ReactDiagram } from "gojs-react";

import "./istio-gateway-chart.scss";

import { v4 as uuidv4 } from "uuid";

import { Gateway } from "../../istio-objects/Gateway";

import {
  VirtualService,
  VirtualServiceApi,
} from "../../istio-objects/VirtualService";
@observer
export class IstioGatewayChart extends React.Component<
  Renderer.Component.KubeObjectDetailsProps<Gateway>
> {
  @observable private nodeDataArray: object[];
  @observable private linkDataArray: object[];
  @observable private clusterdomain: string;
  //获取ClusterDomain
  async getClusterDomain() {
    if (this.clusterdomain && this.clusterdomain != "") {
      return;
    }
    const cm = await Renderer.K8sApi.configMapApi.get({
      name: "coredns",
      namespace: "kube-system",
    });
    const Corefile = cm ? cm.data["Corefile"] : "";

    const Corefiles = Corefile ? Corefile.split(/[(\r\n)\r\n]+/) : []; // 根据换行或者回车进行识别
    console.log(Corefiles);
    Corefiles.forEach((item, index) => {
      // 删除空项
      if (item && item != "") {
        if (item.trim().startsWith("kubernetes ")) {
          this.clusterdomain = item.trim().split(" ")[1];
        }
      }
    });
  }
  async componentWillReceiveProps(
    nextProps: Renderer.Component.KubeObjectDetailsProps<Gateway>
  ) {
    //展示图表
    await this.dealChartData(nextProps);
  }
  async dealChartData(
    props: Renderer.Component.KubeObjectDetailsProps<Gateway>
  ) {
    const nodeDataArray: any[] = [
      {
        key: props.object.getId(),
        text: "Gateway\n" + props.object.getNs() + "." + props.object.getName(),
        color: "lightblue",
        type: "Gateway",
        ns: props.object.getNs(),
        name: props.object.getName(),
      },
    ];
    const linkDataArray: any[] = [];
    const serviceObjectList = {}; //用于service节点去重
    //gateway名称
    const gatewayName = props.object.getName();
    const gatewayNs = props.object.getNs();

    //virtualServiceApi
    const virtualServiceApi = new VirtualServiceApi({
      objectConstructor: VirtualService,
    });

    //查询对应的 virtualService
    let virtualServiceList: VirtualService[] = [];
    if (gatewayNs == "istio-system") {
      //istio-system对应全局
      virtualServiceList = (await virtualServiceApi.list()).filter((item) => {
        return item.gateways.includes(gatewayName);
      });
    } else {
      //否则取同一个namespace的
      virtualServiceList = (
        await virtualServiceApi.list({ namespace: gatewayNs })
      ).filter((item) => {
        return item.gateways.includes(gatewayName);
      });
    }
    //展示vistualService节点
    for (let i = 0, s = virtualServiceList.length; i < s; i++) {
      const virtualService = virtualServiceList[i];
      nodeDataArray.push({
        key:
          "virtualservice." +
          virtualService.getNs() +
          "." +
          virtualService.getId(),
        text:
          "VirtualService\n" +
          virtualService.getNs() +
          "." +
          virtualService.getName(),
        color: "lightblue",
        type: "virtualservice",
        ns: virtualService.getNs(),
        name: virtualService.getName(),
      });

      linkDataArray.push({
        key: uuidv4(),
        from: props.object.getId(),
        to:
          "virtualservice." +
          virtualService.getNs() +
          "." +
          virtualService.getId(),

        text: virtualService.hosts.join(","),
      });

      //搜寻对应service
      const https = virtualService.http;
      for (let ii = 0, ss = https.length; ii < ss; ii++) {
        const http = https[ii];
        if (http.route && http.route.length > 0) {
          for (let iii = 0, sss = http.route.length; iii < sss; iii++) {
            const route = http.route[iii];
            const host = route.destination.host;
            const port = route.destination.port;

            const toServiceObjectList = await Renderer.K8sApi.serviceApi.list({
              namespace: virtualService.getNs(),
            });
            toServiceObjectList.forEach((item) => {
              if (
                item.getName() == host ||
                item.getName() + "." + item.getNs() == host ||
                item.getName() +
                  "." +
                  item.getNs() +
                  ".svc." +
                  this.clusterdomain ==
                  host
              ) {
                serviceObjectList[item.getId()] = item;

                nodeDataArray.push({
                  key: "service." + item.getNs() + "." + item.getName(),
                  text: "Service\n" + item.getNs() + "." + item.getName(),
                  color: "lightgreen",
                  type: "service",
                  ns: item.getNs(),
                  name: item.getName(),
                });

                linkDataArray.push({
                  key: uuidv4(),
                  from:
                    "virtualservice." +
                    virtualService.getNs() +
                    "." +
                    virtualService.getId(),
                  to: "service." + item.getNs() + "." + item.getName(),

                  text: host + ":" + port.number.toString(),
                });
              }
            });
          }
        }
      }
    }

    for (const key in serviceObjectList) {
      const serviceObject = serviceObjectList[key];

      let servicePorts = "";
      for (
        let iii = 0, sss = serviceObject.getPorts().length;
        iii < sss;
        iii++
      ) {
        servicePorts +=
          serviceObject.getPorts()[iii].port +
          "->" +
          serviceObject.getPorts()[iii].targetPort +
          "\n";
      }
      const selectors = serviceObject.getSelector();
      const pods: Renderer.K8sApi.Pod[] =
        (await podsApi.list(
          {
            namespace: serviceObject.getNs(),
          },
          {
            labelSelector: selectors.join(","),
          }
        )) || [];

      for (let ii = 0, ss = pods.length; ii < ss; ii++) {
        if (
          nodeDataArray.filter((item) => item["key"] == pods[ii].getId())
            .length == 0
        ) {
          nodeDataArray.push({
            key: pods[ii].getId(),
            text: "Pod\n" + pods[ii].getNs() + "." + pods[ii].getName(),
            color: "lightyellow",
            type: "pod",
            ns: pods[ii].getNs(),
            name: pods[ii].getName(),
          });

          linkDataArray.push({
            key: uuidv4(),
            from:
              "service." +
              serviceObject.getNs() +
              "." +
              serviceObject.getName(),
            to: pods[ii].getId(),
            text: servicePorts,
          });
        }
      }
    }
    this.linkDataArray = linkDataArray;
    this.nodeDataArray = nodeDataArray;

    // force rerender hack
    this.setState({});
  }
  async componentDidMount() {
    //获取ClusterDomain
    await this.getClusterDomain();
    await this.dealChartData(this.props);
  }
  initDiagram() {
    const $ = go.GraphObject.make;
    const diagram = $(go.Diagram, {
      layout: $(go.ForceDirectedLayout),
      model: $(go.GraphLinksModel, {
        linkKeyProperty: "key", // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
      }),
    });

    // define a simple Node template
    diagram.nodeTemplate = $(
      go.Node,
      "Auto", // the Shape will go around the TextBlock
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(
        go.Point.stringify
      ),
      $(
        go.Shape,
        "RoundedRectangle",
        { name: "SHAPE", fill: "white", strokeWidth: 0 },
        // Shape.fill is bound to Node.data.color
        new go.Binding("fill", "color")
      ),
      $(
        go.TextBlock,
        { margin: 8, editable: false }, // some room around the text
        new go.Binding("text").makeTwoWay()
      )
    );

    // replace the default Link template in the linkTemplateMap
    diagram.linkTemplate = $(
      go.Link, // the whole link panel
      $(
        go.Shape, // the link shape
        { stroke: "black" }
      ),
      $(
        go.Shape, // the arrowhead
        { toArrow: "standard", stroke: null }
      ),
      $(
        go.Panel,
        "Auto",
        $(
          go.Shape, // the label background, which becomes transparent around the edges
          {
            fill: $(go.Brush, "Radial", {
              0: "rgb(240, 240, 240)",
              0.3: "rgb(240, 240, 240)",
              1: "rgba(240, 240, 240, 0)",
            }),
            stroke: null,
          }
        ),
        $(
          go.TextBlock, // the label text
          {
            textAlign: "center",
            font: "10pt helvetica, arial, sans-serif",
            stroke: "#555555",
            margin: 4,
          },
          new go.Binding("text", "text")
        )
      )
    );
    //双击打开节点明细
    diagram.addDiagramListener("ObjectDoubleClicked", function (e) {
      const part = e.subject.part;
      if (!(part instanceof go.Link)) {
        if (part.data.type == "pod") {
          Renderer.Navigation.navigate(
            Renderer.Navigation.getDetailsUrl(
              podsApi.formatUrlForNotListing({
                name: part.data.name,
                namespace: part.data.ns,
              })
            )
          );
        }
        if (part.data.type == "service") {
          Renderer.Navigation.navigate(
            Renderer.Navigation.getDetailsUrl(
              serviceApi.formatUrlForNotListing({
                name: part.data.name,
                namespace: part.data.ns,
              })
            )
          );
        }
      }
    });

    return diagram;
  }

  handleModelChange(changes) {
    console.log("GoJS model changed!");
  }

  render() {
    return (
      <div>
        <Renderer.Component.DrawerTitle>
          Istio Gateway Chart
        </Renderer.Component.DrawerTitle>
        <ReactDiagram
          initDiagram={this.initDiagram}
          divClassName="istio-gateway-chart-diagram-component"
          nodeDataArray={this.nodeDataArray}
          linkDataArray={this.linkDataArray}
          onModelChange={this.handleModelChange}
        />
      </div>
    );
  }
}
