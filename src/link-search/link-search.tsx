import { Renderer } from "@k8slens/extensions";
import React from "react";
import { makeObservable, computed, observable, runInAction } from "mobx";
import { observer } from "mobx-react";

const {
  Component: { Button },
  K8sApi: { podsApi, serviceApi, ingressApi },
} = Renderer;

import * as go from "gojs";
import { ReactDiagram } from "gojs-react";
import { v4 as uuidv4 } from "uuid";

import "./link-search.scss";

//SWR镜像列表(自己的镜像)
@observer
export class LinkSearchPage extends React.Component<{
  extension: Renderer.LensExtension;
}> {
  @observable private nodeDataArray: object[];
  @observable private linkDataArray: object[];
  @observable private search: string;
  async componentDidMount() {
    if (!this.search || this.search == "") {
      this.search =
        localStorage.getItem("link-search-input-cache") || undefined;
    }
    if (this.search && this.search != "") {
      this.searchIngresses();
    }
  }
  initDiagram() {
    const $ = go.GraphObject.make;
    const diagram = $(go.Diagram, {
      "undoManager.isEnabled": true, // enable undo & redo
      "clickCreatingTool.archetypeNodeData": {
        text: "new node",
        color: "lightblue",
      },
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
          Renderer.Navigation.navigate("/pods");
          Renderer.Navigation.showDetails(
            podsApi.formatUrlForNotListing({
              name: part.data.name,
              namespace: part.data.ns,
            }),
            true
          );
        }
        if (part.data.type == "service") {
          Renderer.Navigation.navigate("/services");
          Renderer.Navigation.showDetails(
            serviceApi.formatUrlForNotListing({
              name: part.data.name,
              namespace: part.data.ns,
            }),
            true
          );
        }

        if (part.data.type == "ingress") {
          Renderer.Navigation.navigate("/ingresses");
          console.log(
            ingressApi.formatUrlForNotListing({
              name: part.data.name,
              namespace: part.data.ns,
            })
          );
          Renderer.Navigation.showDetails(
            ingressApi.formatUrlForNotListing({
              name: part.data.name,
              namespace: part.data.ns,
            }),
            true
          );
        }
      }
    });

    return diagram;
  }

  handleModelChange(changes) {
    console.log("GoJS model changed!");
  }

  //搜索ingress
  async searchIngresses() {
    console.log(this.search);
    localStorage.setItem("link-search-input-cache", this.search);
    if (
      this.search.startsWith("http://") ||
      this.search.startsWith("https://")
    ) {
      const url = new URL(this.search);

      const host = url.hostname;

      const ingressObjectList: Renderer.K8sApi.Ingress[] = [];
      const ingressList = await ingressApi.list();
      for (let i = 0; i < ingressList.length; i++) {
        const ingress = ingressList[i];
        if (this.search.startsWith("https://")) {
          if (!ingress.spec.tls || ingress.spec.tls.length == 0) {
            continue;
          }
        }
        if (this.search.startsWith("http://")) {
          if (ingress.spec.tls && ingress.spec.tls.length > 0) {
            continue;
          }
        }
        if (ingress.spec.rules) {
          for (let j = 0; j < ingress.spec.rules.length; j++) {
            const rule = ingress.spec.rules[j];

            if (rule.host == host) {
              ingressObjectList.push(ingress);
              break;
            }
          }
        }
      }
      //展示ingress
      await this.renderIngresses(ingressObjectList, url);
    } else {
      //不正确URL
      alert("Not the corrent url!");
    }
  }

  toEnd(s: string) {
    const str = s || "";
    if (str.endsWith("/")) {
      return str;
    } else {
      return str + "/";
    }
  }
  //展示ingress
  async renderIngresses(
    ingressObjectList: Renderer.K8sApi.Ingress[],
    url: URL
  ) {
    const nodeDataArray = [];
    const linkDataArray = [];
    const serviceObjectList = {}; //用于service节点去重
    for (
      let index = 0, slen = ingressObjectList.length;
      index < slen;
      index++
    ) {
      const ingressObject = ingressObjectList[index];

      /*
      nodeDataArray.push({
        key: ingressObject.getId(),
        text:
          "Ingress\n" + ingressObject.getNs() + "." + ingressObject.getName(),
        color: "lightblue",
        type: "ingress",
        ns: ingressObject.getNs(),
        name: ingressObject.getName(),
      });
      */

      const ingressServiceList: Renderer.K8sApi.Service[] = [];

      const rules = ingressObject.getRules();

      for (let i = 0, s = rules.length; i < s; i++) {
        const rule = rules[i];
        if (rule.http && rule.http.paths) {
          for (let j = 0, l = rule.http.paths.length; j < l; j++) {
            const path = rule.http.paths[j];
            if (path.backend && path.backend["service"]) {
              if (path.pathType == "Exact") {
                if (url.pathname != path.path) {
                  continue;
                }
              }
              if (path.pathType == "Prefix") {
                if (
                  !this.toEnd(url.pathname).startsWith(this.toEnd(path.path))
                ) {
                  continue;
                }
              }
              if (path.pathType == "ImplementationSpecific") {
                if (
                  ingressObject
                    .getAnnotations()
                    .includes("kubernetes.io/ingress.class=nginx")
                ) {
                  if (
                    !this.toEnd(url.pathname).startsWith(this.toEnd(path.path))
                  ) {
                    if (!url.pathname.match(path.path)) {
                      continue;
                    }
                  }
                }
              }
              let serviceObject: Renderer.K8sApi.Service = null;
              try {
                serviceObject = await Renderer.K8sApi.serviceApi.get({
                  name: path.backend["service"].name,
                  namespace: ingressObject.getNs(),
                });
              } catch (e) {
                console.log(e);
              }

              if (serviceObject) {
                nodeDataArray.push({
                  key:
                    "service." +
                    ingressObject.getNs() +
                    "." +
                    path.backend["service"].name,
                  text:
                    "Service\n" +
                    ingressObject.getNs() +
                    "." +
                    path.backend["service"].name,
                  color: "lightgreen",
                  type: "service",
                  ns: ingressObject.getNs(),
                  name: path.backend["service"].name,
                });

                linkDataArray.push({
                  key: uuidv4(),
                  from: ingressObject.getId(),
                  to:
                    "service." +
                    ingressObject.getNs() +
                    "." +
                    path.backend["service"].name,

                  text:
                    this.toEnd(path.path) +
                    "\n" +
                    path.backend["service"]["port"]["number"],
                });

                ingressServiceList.push(serviceObject);
                serviceObjectList[
                  ingressObject.getNs() + "." + path.backend["service"].name
                ] = serviceObject;
              } else {
                nodeDataArray.push({
                  key:
                    "service." +
                    ingressObject.getNs() +
                    "." +
                    path.backend["service"].name,
                  text:
                    "Service\n" +
                    ingressObject.getNs() +
                    "." +
                    path.backend["service"].name +
                    "\n(not exists)",
                  color: "red",
                  type: "service",
                  ns: ingressObject.getNs(),
                  name: path.backend["service"].name,
                });

                linkDataArray.push({
                  key: uuidv4(),
                  from: ingressObject.getId(),
                  to:
                    "service." +
                    ingressObject.getNs() +
                    "." +
                    path.backend["service"].name,

                  text:
                    this.toEnd(path.path) +
                    "\n" +
                    path.backend["service"]["port"]["number"],
                });
                ingressServiceList.push(null);
              }

              break;
            }
          }
        }
      }

      if (ingressServiceList && ingressServiceList.length > 0) {
        nodeDataArray.push({
          key: ingressObject.getId(),
          text:
            "Ingress\n" + ingressObject.getNs() + "." + ingressObject.getName(),
          color: "lightblue",
          type: "ingress",
          ns: ingressObject.getNs(),
          name: ingressObject.getName(),
        });
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

      for (let ii = 0, ss = pods.length; ii < ss; ii++) {
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
            "service." + serviceObject.getNs() + "." + serviceObject.getName(),
          to: pods[ii].getId(),
          text: servicePorts,
        });
      }
    }

    this.nodeDataArray = nodeDataArray;
    this.linkDataArray = linkDataArray;
    // force rerender hack
    this.setState({});
  }

  render() {
    return (
      <div className="link-search-container">
        <p>
          <table className="link-search-header">
            <tr>
              <td>URL:</td>
              <td>
                <input
                  className="link-search-input"
                  type="text"
                  placeholder="Search"
                  value={this.search}
                  onChange={(e) => {
                    this.search = e.target.value.trim();
                    this.setState({});
                  }}
                />
              </td>
              <td>
                <Button
                  onClick={() => {
                    //搜索ingress
                    this.searchIngresses();
                  }}
                >
                  Search
                </Button>
              </td>
            </tr>
          </table>
        </p>
        <ReactDiagram
          initDiagram={this.initDiagram}
          divClassName="link-search-diagram-component"
          nodeDataArray={this.nodeDataArray}
          linkDataArray={this.linkDataArray}
          onModelChange={this.handleModelChange}
        />
      </div>
    );
  }
}

export function LinkSearchIcon(props: Renderer.Component.IconProps) {
  return (
    <Renderer.Component.Icon
      {...props}
      material="security"
      tooltip="LinkSearch"
    />
  );
}
