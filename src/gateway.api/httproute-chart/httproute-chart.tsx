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

import "./httproute-chart.scss";

import { v4 as uuidv4 } from "uuid";

import {
  HTTPRouteParentRef,
  HTTPRouteBackendRef,
  HTTPRouteRule,
  HTTPRoute,
} from "../objects/httproute";
@observer
export class HTTPRouteChart extends React.Component<
  Renderer.Component.KubeObjectDetailsProps<HTTPRoute>
> {
  @observable private nodeDataArray: object[];
  @observable private linkDataArray: object[];

  async componentWillReceiveProps(
    nextProps: Renderer.Component.KubeObjectDetailsProps<HTTPRoute>
  ) {
    console.log("componentWillReceiveProps");
    //展示图表
    await this.dealChartData(nextProps);
  }
  async dealChartData(
    props: Renderer.Component.KubeObjectDetailsProps<HTTPRoute>
  ) {
    //HTTPRoute ns
    const httpRouteNs = props.object.getNs();

    const nodeDataArray: any[] = [
      {
        key: "HTTPRoute." + httpRouteNs + "." + props.object.getId(),
        text:
          "HTTPRoute\n" + props.object.getNs() + "." + props.object.getName(),
        color: "lightblue",
        type: "HTTPRoute",
        ns: props.object.getNs(),
        name: props.object.getName(),
      },
    ];
    const linkDataArray: any[] = [];
    const serviceObjectList = {}; //用于service节点去重

    //搜寻对应service
    const rules: HTTPRouteRule[] = props.object.spec["rules"] || [];
    for (let ii = 0, ss = rules.length; ii < ss; ii++) {
      const rule = rules[ii];
      if (rule.backendRefs && rule.backendRefs.length > 0) {
        for (let iii = 0, sss = rule.backendRefs.length; iii < sss; iii++) {
          const backendref = rule.backendRefs[iii];

          if (backendref.kind == "Service") {
            let item;
            try {
              item = await Renderer.K8sApi.serviceApi.get({
                namespace: backendref.namespace || httpRouteNs,
                name: backendref.name || "",
              });
            } catch (e) {}
            if (item) {
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
                from: "HTTPRoute." + httpRouteNs + "." + props.object.getId(),
                to: "service." + item.getNs() + "." + item.getName(),

                text:
                  (props.object.spec["hostnames"] || []).join(",") +
                  ":" +
                  (backendref.port ? backendref.port : "0"),
              });
            }
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

    //查找对应gateway
    const parentRefs: HTTPRouteParentRef[] = props.object.spec["parentRefs"] || [];
    parentRefs.forEach((item) => {
      if (item.kind == "Gateway") {
        nodeDataArray.push({
          key: "gateway." + (item.namespace||httpRouteNs )+ "." + (item.name||""),
          text: "Gateway\n" + (item.namespace||httpRouteNs ) + "." + (item.name||""),
          color: "lightblue",
          type: "gateway",
          ns: (item.namespace||httpRouteNs ),
          name: (item.name||""),
        });

        linkDataArray.push({
          key: uuidv4(),
          from: "gateway." + (item.namespace||httpRouteNs )+ "." + (item.name||""),
          to:"HTTPRoute." + httpRouteNs + "." + props.object.getId(),

          
        });
      }
    });

    this.linkDataArray = linkDataArray;
    this.nodeDataArray = nodeDataArray;

    // force rerender hack
    this.setState({});
  }
  async componentDidMount() {
    //展示图表
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
          Gateway api HTTPRoute Chart
        </Renderer.Component.DrawerTitle>
        <ReactDiagram
          initDiagram={this.initDiagram}
          divClassName="httproute-chart-diagram-component"
          nodeDataArray={this.nodeDataArray}
          linkDataArray={this.linkDataArray}
          onModelChange={this.handleModelChange}
        />
      </div>
    );
  }
}
