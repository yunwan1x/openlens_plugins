import { KubeConfig, CoreV1Api } from "@kubernetes/client-node";
import { Renderer } from "@k8slens/extensions";
const {
  Catalog: { CatalogEntityRegistry },
} = Renderer;

import zlib from "zlib";
import yaml from "js-yaml";
import archiver from "archiver";
import fs from "fs";
import JSONL from "@saiansh2525/jsonlines";
import { ipcRenderer } from "electron";
import path from "path";
//导出所有helm
export async function exportAllHelm() {
  console.log("export_all_helm");

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

  const entries = new CatalogEntityRegistry().entities;

  console.log(entries);
  const keys = entries.keys();
  let key = null;
  while ((key = keys.next())) {
    console.log("key=",key)
    if (!key) {
      break;
    }
    if (!key.value) {
      break;
    }
    const cluster_key = key.value;
    const entity = entries.get(cluster_key);
    if(!entity){
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
        null,
        null,
        "owner=helm,status=deployed",9999
      );

      for (let i = 0, s = secrets.body.items.length; i < s; i++) {
        const secret = secrets.body.items[i];

        //获取保存helm数据的secret对象
        if (secret.metadata.name.startsWith("sh.helm.release.")) {
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

          await deal_with_release_str(
            release_str,
            secret.metadata.name.split(".")[4],
            secret.metadata.namespace,
            files + "/",
            cluster_name
          );
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  alert("Export Completed");
}

//按行分解
async function deal_with_release_str(
  release_str?: string,
  release_name?: string,
  namespace?: string,
  savepath?: string,
  cluster_name?: string
) {
  const code = JSONL.parse(release_str); // 根据换行或者回车进行识别
  code.forEach(async (item, index) => {
    const jsonObject = item as object;
    const name = jsonObject["name"];

    const status = jsonObject["info"]["status"];
    if (status == "deployed") {
      //状态是已部署的
      await deal_with_release_json(
        jsonObject,
        release_name,
        namespace,
        savepath,
        cluster_name
      );
    }
  });
}
//按行打包成 tgz
async function deal_with_release_json(
  jsonObject?: object,
  release_name?: string,
  namespace?: string,
  savepath?: string,
  cluster_name?: string
) {
  const chartJson = jsonObject["chart"]; //chart数据

  //处理chart中各文件

  //包名
  const chart_name = chartJson["metadata"]["name"];
  //版本
  const chart_version = chartJson["metadata"]["version"];

  //用户自定义values
  const user_provided_values_yaml = yaml.dump(jsonObject["config"]);
  console.log(user_provided_values_yaml);
  fs.mkdirSync(savepath + path.sep + cluster_name + path.sep + namespace, {
    recursive: true,
  });
  fs.writeFileSync(
    savepath +
      path.sep +
      cluster_name +
      path.sep +
      namespace +
      path.sep +
      chart_name +
      "-" +
      chart_version +
      "-user-provided-values.yaml",
    user_provided_values_yaml
  );

  //处理Chart.yaml和values.yaml
  const chart_yaml = yaml.dump(chartJson["metadata"]);
  console.log(chart_yaml);
  const values_yaml = yaml.dump(chartJson["values"]);
  console.log(values_yaml);

  const output = fs.createWriteStream(
    savepath +
      path.sep +
      cluster_name +
      path.sep +
      namespace +
      path.sep +
      chart_name +
      "-" +
      chart_version +
      ".tgz"
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
