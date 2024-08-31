import React from "react";
import { Renderer, Common } from "@k8slens/extensions";

type Pod = Renderer.K8sApi.Pod;

const {
  Component: { MenuItem, Icon, SubMenu, StatusBrick },
  Catalog: { CatalogEntityRegistry },
} = Renderer;
const { Util, App } = Common;
import { computed, observable, runInAction } from "mobx";
import { observer } from "mobx-react";
import { execFile, exec } from "child_process";
import path from "path";

export const dialogState = observable.object({
  //是否打开文件管理弹出
  isOpen: observable.box(false),
  //当前所在ns
  namespace: observable.box(""),
  //当前所在pod
  pod: observable.box(""),
  //当前所在pod的容器
  container: observable.box(""),
  //所在容器的初始目录
  init_path: observable.box(""),
});

export class PodFileManagerMenu extends React.Component<
  Renderer.Component.KubeObjectMenuProps<Pod>
> {
  async showPodFiles(container?: string) {
    const { object: pod } = this.props;
    const kubeconfigPath = new CatalogEntityRegistry().activeEntity.spec
      .kubeconfigPath;
    //console.log(App.Preferences.getKubectlPath())
    const kubectlPath = App.Preferences.getKubectlPath() || "kubectl";

    //console.log(dialogState)
    //打开弹窗
    //容器
    dialogState.container.set(container);
    //ns
    dialogState.namespace.set(pod.metadata.namespace);
    //pod
    dialogState.pod.set(pod.metadata.name);
    //初始路径
    dialogState.init_path.set("/")
    //console.log(dialogState)
    //获取当前目录
    const pwd = await new Promise((resolve) =>
      execFile(
        kubectlPath,
        [
          "--kubeconfig",
          kubeconfigPath,
          "exec",
          "-n",
          dialogState.namespace.get(),
          "-c",
          dialogState.container.get(),
          dialogState.pod.get(),
          "--",
          "sh",
          "-c",
          "pwd",
        ],
        {},
        (error, stdout, stderr) => {
          resolve(stdout);
        }
      )
    );
    dialogState.init_path.set(pwd+"");

    //打开文件管理弹窗
    dialogState.isOpen.set(true);
  }
  render() {
    const { object, toolbar } = this.props;
    const containers = object.getRunningContainers();

    if (!containers.length) return null;

    return (
      <MenuItem
        onClick={Util.prevDefault(() => this.showPodFiles(containers[0].name))}
      >
        <Icon
          material="folder"
          interactive={toolbar}
          tooltip={toolbar && "Pod Files"}
        />
        <span className="title">Pod Files</span>
        {containers.length > 1 && (
          <>
            <Icon className="arrow" material="keyboard_arrow_right" />
            <SubMenu>
              {containers.map((container) => {
                const { name } = container;

                return (
                  <MenuItem
                    key={name}
                    onClick={Util.prevDefault(() => this.showPodFiles(name))}
                    className="flex align-center"
                  >
                    <StatusBrick />
                    <span>{name}</span>
                  </MenuItem>
                );
              })}
            </SubMenu>
          </>
        )}
      </MenuItem>
    );
  }
}
