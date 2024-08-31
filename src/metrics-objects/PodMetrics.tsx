import React from "react";

import { Renderer, Common } from "@k8slens/extensions";
import { makeObservable, computed, observable, runInAction } from "mobx";
import { observer } from "mobx-react";
const { Util, App } = Common;
const {
  Component: { Button },
} = Renderer;
const {
  Catalog: { CatalogEntityRegistry },
} = Renderer;
import { execFile } from "child_process";
import "./PodMetrics.scss";

import {to_cpu_h,to_memory_g} from "../metrics-objects/common"

@observer
export class PodMetricsPage extends React.Component<{
  extension: Renderer.LensExtension;
}> {
  @observable private resultList: object[] = [];
  timer: NodeJS.Timeout;
  @observable private loading = false;

  load() {
    this.loading = true;
    this.setState({});
    const kubeconfigPath = new CatalogEntityRegistry().activeEntity.spec
      .kubeconfigPath;
    const kubectlPath = App.Preferences.getKubectlPath() || "kubectl";
    execFile(
      kubectlPath,
      [
        "--kubeconfig",
        kubeconfigPath,
        "get",
        "--raw",
        "/apis/metrics.k8s.io/v1beta1/pods",
      ],
      {},
      (error, stdout, stderr) => {
        //console.log(stdout);
        this.resultList = JSON.parse(stdout)["items"].sort(function (a, b) {
          //callback
          if (
            a["metadata"]["name"]
              .toString()
              .localeCompare(b["metadata"]["name"].toString())
          ) {
            // a b 分别是Arr中的 56 21
            return 1; //返回正数 ，b排列在a之前
          } else {
            return -1; //返回负数 ，a排列在b之前
          }
        });
        //console.log(this.resultList);
        this.loading = false;
        this.setState({});
      }
    );
  }

  async componentDidMount() {
    this.load();
  }

  render() {
    return (
      <div className="PodMetrics-container">
        <p>
          <Button
            disabled={this.loading}
            onClick={() => {
              this.load();
            }}
          >
            refresh {this.loading ? "(Loading...)" : ""}
          </Button>
        </p>
        <p>
          <table className="PodMetrics-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>NameSpace</th>
                <th>Container</th>
                <th>Cpu(c)</th>
                <th>Mem(g)</th>
              </tr>
            </thead>
            <tbody>
              {this.resultList.map((item) => {
                return item["containers"].map((container) => {
                  return (
                    <tr>
                      <td>{item["metadata"]["name"]}</td>
                      <td>{item["metadata"]["namespace"]}</td>
                      <td>{container["name"]}</td>
                      <td>{to_cpu_h(container["usage"]["cpu"])}</td>
                      <td>{to_memory_g(container["usage"]["memory"])}</td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </p>
      </div>
    );
  }
}

export function PodMetricsIcon(props: Renderer.Component.IconProps) {
  return (
    <Renderer.Component.Icon
      {...props}
      material="security"
      tooltip="PodMetrics"
    />
  );
}
