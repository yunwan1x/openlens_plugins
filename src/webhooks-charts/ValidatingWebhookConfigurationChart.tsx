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

import "./ValidatingWebhookConfigurationChart.css";

import { v4 as uuidv4 } from "uuid";

import {
  ValidatingWebhookConfiguration,
  ValidatingWebhookConfigurationApi,
} from "../webhooks-objects/ValidatingWebhookConfiguration";

@observer
export class ValidatingWebhookConfigurationChart extends React.Component<
  Renderer.Component.KubeObjectDetailsProps<ValidatingWebhookConfiguration>
> {
  @observable private nodeDataArray: object[];
  @observable private linkDataArray: object[];

  async componentWillReceiveProps(
    nextProps: Renderer.Component.KubeObjectDetailsProps<ValidatingWebhookConfiguration>
  ) {
    //展示图表
    await this.dealChartData(nextProps);
  }
  async dealChartData(
    props: Renderer.Component.KubeObjectDetailsProps<ValidatingWebhookConfiguration>
  ) {
    const nodeDataArray: any[] = [
      {
        key: props.object.getId(),
        text: "ValidatingWebhookConfiguration\n" + props.object.getName(),
        color: "lightblue",
        type: "ValidatingWebhookConfiguration",
        ns: "",
        name: props.object.getName(),
      },
    ];
    const linkDataArray: any[] = [];
    const serviceObjectList = {}; //用于service节点去重

    const webhooks: any[] = props.object["webhooks"] || [];

    for (let i = 0, s = webhooks.length; i < s; i++) {
      const webhook = webhooks[i];

      if (
        webhook["clientConfig"] &&
        webhook["clientConfig"]["service"] &&
        webhook["clientConfig"]["service"]["name"] &&
        webhook["clientConfig"]["service"]["namespace"]
      ) {
        const toServiceObject = await Renderer.K8sApi.serviceApi.get({
          namespace: webhook["clientConfig"]["service"]["namespace"],
          name: webhook["clientConfig"]["service"]["name"],
        });
        if (toServiceObject) {
          serviceObjectList[toServiceObject.getId()] = toServiceObject;

          nodeDataArray.push({
            key:
              "service." +
              toServiceObject.getNs() +
              "." +
              toServiceObject.getName(),
            text:
              "Service\n" +
              toServiceObject.getNs() +
              "." +
              toServiceObject.getName(),
            color: "lightgreen",
            type: "service",
            ns: toServiceObject.getNs(),
            name: toServiceObject.getName(),
          });

          linkDataArray.push({
            key: uuidv4(),
            from: props.object.getId(),
            to:
              "service." +
              toServiceObject.getNs() +
              "." +
              toServiceObject.getName(),

            text:
              webhook["name"] +
              ":" +
              webhook["clientConfig"]["service"]["path"],
          });
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
          divClassName="MutatingWebhookConfigurationChart-diagram-component"
          nodeDataArray={this.nodeDataArray}
          linkDataArray={this.linkDataArray}
          onModelChange={this.handleModelChange}
        />
      </div>
    );
  }
}
