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

import "./ingress-chart.scss";

import { v4 as uuidv4 } from "uuid";

@observer
export class IngressChart extends React.Component<
  Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.Ingress>
> {
  @observable private nodeDataArray: object[];
  @observable private linkDataArray: object[];
  async componentWillReceiveProps(
    nextProps: Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.Ingress>
  ) {
    await this.dealChartData(nextProps);
  }
  async dealChartData(
    props: Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.Ingress>
  ) {
    const nodeDataArray = [
      {
        key: props.object.getId(),
        text: "Ingress\n" + props.object.getNs() + "." + props.object.getName(),
        color: "lightblue",
        type: "ingress",
        ns: props.object.getNs(),
        name: props.object.getName(),
      },
    ];
    const linkDataArray = [];
    const rules = props.object.getRules();
    const serviceObjectList = {}; //用于service节点去重
    for (let i = 0, s = rules.length; i < s; i++) {
      const rule = rules[i];
      if (rule.http && rule.http.paths) {
        for (let j = 0, l = rule.http.paths.length; j < l; j++) {
          const path = rule.http.paths[j];
          if (path.backend && path.backend["service"]) {
            let serviceObject: Renderer.K8sApi.Service = null;
            try {
              serviceObject = await Renderer.K8sApi.serviceApi.get({
                name: path.backend["service"].name,
                namespace: props.object.getNs(),
              });
            } catch (e) {
              console.log(e);
            }

            if (serviceObject) {
              nodeDataArray.push({
                key:
                  "service." +
                  props.object.getNs() +
                  "." +
                  path.backend["service"].name,
                text:
                  "Service\n" +
                  props.object.getNs() +
                  "." +
                  path.backend["service"].name,
                color: "lightgreen",
                type: "service",
                ns: props.object.getNs(),
                name: path.backend["service"].name,
              });

              linkDataArray.push({
                key: uuidv4(),
                from: props.object.getId(),
                to:
                  "service." +
                  props.object.getNs() +
                  "." +
                  path.backend["service"].name,

                text:
                  path.path + "\n" + path.backend["service"]["port"]["number"],
              });

              serviceObjectList[
                props.object.getNs() + "." + path.backend["service"].name
              ] = serviceObject;
            } else {
              nodeDataArray.push({
                key:
                  "service." +
                  props.object.getNs() +
                  "." +
                  path.backend["service"].name,
                text:
                  "Service\n" +
                  props.object.getNs() +
                  "." +
                  path.backend["service"].name+"\n(not exists)",
                color: "red",
                type: "service",
                ns: props.object.getNs(),
                name: path.backend["service"].name,
              });

              linkDataArray.push({
                key: uuidv4(),
                from: props.object.getId(),
                to:
                  "service." +
                  props.object.getNs() +
                  "." +
                  path.backend["service"].name,

                text:
                  path.path + "\n" + path.backend["service"]["port"]["number"],
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
      if(!selectors || selectors==""){
        continue
      }
      const pods = await podsApi.list(
        {
          namespace: serviceObject.getNs(),
        },
        {
          labelSelector: selectors.join(","),
        }
      );
      //console.log(serviceObject);
      //console.log(pods);

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
    console.log(this.nodeDataArray);
    console.log(this.linkDataArray);

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
          Ingress Chart
        </Renderer.Component.DrawerTitle>
        <ReactDiagram
          initDiagram={this.initDiagram}
          divClassName="ingress-chart-diagram-component"
          nodeDataArray={this.nodeDataArray}
          linkDataArray={this.linkDataArray}
          onModelChange={this.handleModelChange}
        />
      </div>
    );
  }
}
