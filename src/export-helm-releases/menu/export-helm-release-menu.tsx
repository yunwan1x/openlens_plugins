/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import React from "react";
import { Renderer, Common } from "@k8slens/extensions";
import zlib from "zlib";
import yaml from "js-yaml";
import archiver from "archiver";
import fs from "fs";
import JSONL from "@saiansh2525/jsonlines";
import { ipcRenderer } from "electron";

const {
  Component: {
    MenuItem,
    Icon,
  },
} = Renderer;

export class ExportHelmReleaseMenu extends React.Component<any> {
  async exportHelmRelease(helmrelease?: any) {
    //弹框选择下载目录
    const result = await ipcRenderer.invoke(
      "open-directory-dialog",
      "openDirectory"
    );
    //取消选择
    if (result.canceled) {
      return;
    }
    if (!result.filePaths) {
      return;
    }
    if (result.filePaths.length == 0) {
      return;
    }
    const files = result.filePaths[0];
    console.log(files);

    console.log(helmrelease);

    //查询helm release对应的secret
    const secrets = await Renderer.K8sApi.secretsApi.list(
      {
        namespace: helmrelease.getNs(),
      },
      {
        labelSelector: [
          "name=" + helmrelease.getName(),
          "owner=helm",
          "status=deployed",
        ],
      }
    );
    console.log(secrets);

    for (let i = 0, s = secrets.length; i < s; i++) {
      const secret = secrets[i];
      const secret_name = secret.getName();
      //获取保存helm数据的secret对象
      if (secret_name.startsWith("sh.helm.release.")) {
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

        await this.deal_with_release_str(
          release_str,
          helmrelease.getName(),
          helmrelease.getNs(),
          files + "/"
        );
      }
    }

    alert("Export Completed");
  }
  //按行分解
  async deal_with_release_str(
    release_str?: string,
    release_name?: string,
    namespace?: string,
    savepath?: string
  ) {
    const code = JSONL.parse(release_str); // 根据换行或者回车进行识别
    code.forEach(async (item, index) => {
      const jsonObject = item as object;
      const name = jsonObject["name"];

      const status = jsonObject["info"]["status"];
      if (status == "deployed") {
        //状态是已部署的
        await this.deal_with_release_json(
          jsonObject,
          release_name,
          namespace,
          savepath
        );
      }
    });
  }
  //按行打包成 tgz
  async deal_with_release_json(
    jsonObject?: object,
    release_name?: string,
    namespace?: string,
    savepath?: string
  ) {
    const chartJson = jsonObject["chart"]; //chart数据


    

    //处理chart中各文件

    //包名
    const chart_name = chartJson["metadata"]["name"];
    //版本
    const chart_version = chartJson["metadata"]["version"];

    //用户自定义values
    const user_provided_values_yaml = yaml.dump(jsonObject["config"]);
    console.log(user_provided_values_yaml)
    fs.writeFileSync(savepath +
      "/" +
      chart_name +
      "-" +
      chart_version +
      "-user-provided-values.yaml", user_provided_values_yaml);


    //处理Chart.yaml和values.yaml
    const chart_yaml = yaml.dump(chartJson["metadata"]);
    console.log(chart_yaml);
    const values_yaml = yaml.dump(chartJson["values"]);
    console.log(values_yaml);

    const output = fs.createWriteStream(
      savepath + "/" + chart_name + "-" + chart_version + ".tgz"
    );
    const archive = archiver("tar", {
      gzip: true,
      gzipOptions: {
        level: 1,
      },
    });
    output.on("close", function () {
      console.log(archive.pointer() + " total bytes");
      console.log(
        "archiver has been finalized and the output file descriptor has closed."
      );
    });

    archive.on("error", function (err) {
      throw err;
    });

    archive.pipe(output);

    archive
      .append(chart_yaml, { name: chart_name + "/Chart.yaml" })
      .append(values_yaml, { name: chart_name + "/values.yaml" });

    for (let i = 0, s = chartJson["templates"].length; i < s; i++) {
      const template = chartJson["templates"][i];
      //模板文件路径
      const template_name = template["name"];
      //模板文件base64加密后
      const template_data = template["data"];

      const template_data_raw = Buffer.from(template_data, "base64").toString(
        "utf-8"
      );

      archive.append(template_data_raw, {
        name: chart_name + "/" + template_name,
      });
    }

    archive.finalize();
    
  }

  render() {
    const { object, toolbar } = this.props;

    return (
      <MenuItem
        onClick={() => {
          this.exportHelmRelease(object);
        }}
      >
        <Icon
          material="cloud_download"
          interactive={toolbar}
          tooltip={toolbar && "Export"}
        />
        <span className="title">Export</span>
      </MenuItem>
    );
  }
}
