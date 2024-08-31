import { Renderer } from "@k8slens/extensions";
import React from "react";
import { makeObservable, computed, observable, runInAction } from "mobx";
import { observer } from "mobx-react";
import { parse as golangTemplateParse } from "@ctrl/golang-template";
const {
  Component: { Button },
} = Renderer;
import "./helm-check.scss";

import { KubeConfig, CoreV1Api } from "@kubernetes/client-node";
const {
  Catalog: { CatalogEntityRegistry },
} = Renderer;

import zlib from "zlib";
import yaml from "js-yaml";
import archiver from "archiver";
import fs from "fs";
import JSONL from "@saiansh2525/jsonlines";

//检查错误ingress配置
@observer
export class HelmCheckPage extends React.Component<{
  extension: Renderer.LensExtension;
}> {
  @observable private resultList: object[] = [];
  @observable private checking = false;
  render() {
    return (
      <div className="helm-check-container">
        <p>
          <Button
            disabled={this.checking}
            onClick={() => {
              //检查ingress
              this.checkAllHelms();
            }}
          >
            Check Helms {this.checking ? "(Checking...)" : ""}
          </Button>
          <table className="helm-check-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Namespace</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {this.resultList.map((item) => {
                return (
                  <tr>
                    <td>{item["name"]}</td>
                    <td>{item["namespace"]}</td>
                    <td>{item["error"]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </p>
      </div>
    );
  }

  //检查helm错误
  async checkAllHelms() {
    this.checking = true;
    // force rerender hack
    this.setState({});

    const resultList: object[] = [];
    const entries = new CatalogEntityRegistry().entities;

    const keys = entries.keys();
    let key: any;
    while ((key = keys.next())) {
      console.log("key=", key);
      if (!key) {
        break;
      }
      if (!key.value) {
        break;
      }
      const cluster_key = key.value;
      const entity = entries.get(cluster_key);
      if (!entity) {
        continue;
      }
      if (entity && entity.kind != "KubernetesCluster") {
        continue;
      }
      const cluster_name = entity.getName();
      const kubeconfigPath = entity.spec.kubeconfigPath;
      console.log(kubeconfigPath);

      try {
        const kc = new KubeConfig();
        kc.loadFromFile(kubeconfigPath);

        const k8sApi = kc.makeApiClient(CoreV1Api);

        const secrets = await k8sApi.listSecretForAllNamespaces(
          false,
          "",
          "",
          "owner=helm,status=deployed",
          9999
        );

        for (let i = 0, s = secrets.body.items.length; i < s; i++) {
          const secret = secrets.body.items[i];

          //获取保存helm数据的secret对象
          if (
            secret.metadata &&
            secret.metadata.name &&
            secret.metadata.name.startsWith("sh.helm.release.")
          ) {
            if (!secret.data) {
              continue;
            }
            //获取secret里被base64加密的数据
            const release_data_base64 = secret.data.release;
            const release_data = Buffer.from(
              release_data_base64,
              "base64"
            ).toString("utf-8");
            console.log(release_data);

            const release_str = zlib
              .gunzipSync(Buffer.from(release_data, "base64"))
              .toString("utf-8");
            console.log(release_str);

            const code = JSONL.parse(release_str); // 根据换行或者回车进行识别
            code.forEach((item, index) => {
              const jsonObject = item as object;

              const status = jsonObject["info"]["status"];
              if (status == "deployed") {
                //状态是已部署的
                const chartJson = jsonObject["chart"]; //chart数据
                //包名
                const chart_name = chartJson["metadata"]["name"];
                const values: object = jsonObject["config"];
                for (
                  let ii = 0, ss = chartJson["templates"].length;
                  ii < ss;
                  ii++
                ) {
                  const template = chartJson["templates"][ii];
                  //模板文件base64加密后
                  const template_data = template["data"];

                  const template_data_raw = Buffer.from(
                    template_data,
                    "base64"
                  ).toString("utf-8");

                  console.log(template_data_raw);

                  if (
                    template_data_raw.includes("Ingress") &&
                    template_data_raw.includes("extensions/v1beta1")
                  ) {
                    const namespace: string =
                      secret.metadata && secret.metadata.namespace
                        ? secret.metadata.namespace
                        : "";
                    resultList.push({
                      name: chart_name,
                      namespace: namespace,
                      error:
                        "helm " +
                        namespace +
                        "." +
                        chart_name +
                        " ingress version is extensions/v1beta1",
                    });
                  }
                }
              }
            });
          }
        }
      } catch (e) {
        console.log(e);
      }
    }
    const obj: { [key: string]: boolean } = {};
    this.resultList = resultList.reduce<object[]>((item, next) => {
      if (!obj[next["namespace"] + "." + next["name"]]) {
        item.push(next);
        obj[next["namespace"] + "." + next["name"]] = true;
      }
      return item;
    }, []);
    this.checking = false;
    // force rerender hack
    this.setState({});
  }
}

export function HelmCheckIcon(props: Renderer.Component.IconProps) {
  return (
    <Renderer.Component.Icon
      {...props}
      material="security"
      tooltip="HelmCheck"
    />
  );
}
