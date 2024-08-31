import React from "react";
import { Renderer, Common } from "@k8slens/extensions";

type Pod = Renderer.K8sApi.Pod;

const {
  Component: { MenuItem, Icon, SubMenu, StatusBrick, ConfirmDialog },
  Catalog: { CatalogEntityRegistry },
} = Renderer;
const { Util, App } = Common;
import { computed, observable, runInAction } from "mobx";
import { observer } from "mobx-react";
import { execFile, exec } from "child_process";
import path from "path";

export class PodDeleteForceMenu extends React.Component<
  Renderer.Component.KubeObjectMenuProps<Pod>
> {
  deleteForceImpl(pod: Pod) {
    const kubeconfigPath = new CatalogEntityRegistry().activeEntity.spec
      .kubeconfigPath;
    //console.log(App.Preferences.getKubectlPath());
    const kubectlPath = App.Preferences.getKubectlPath() || "kubectl";
    console.log(kubectlPath,kubeconfigPath,pod.getNs(),pod.getName())
    execFile(
      kubectlPath,
      [
        "--kubeconfig",
        kubeconfigPath,
        "delete",
        "pod",
        "-n",
        pod.getNs(),
        pod.getName(),
        "--force",
        "--grace-period=0",
      ],
      {},
      (error, stdout, stderr) => {
        console.log(error)
        if (error) {
          console.log(stderr);
          alert(stderr);
        } else {
          alert("Deleted");
        }
      }
    );
  }
  deleteForce(pod: Pod) {
    ConfirmDialog.open({
      ok: () => this.deleteForceImpl(pod),
      labelOk: `Delete Pod ` + pod.getName(),
      message: (
        <p>
          {"Are you sure you want to delete pod "}
          <b>{pod.getName()}</b>?
        </p>
      ),
    });
  }
  render() {
    const { object, toolbar } = this.props;

    return (
      <MenuItem
        onClick={Util.prevDefault(() => {
          this.deleteForce(object);
        })}
      >
        <Icon
          material="delete"
          interactive={toolbar}
          tooltip={toolbar && "Delete Pod Force"}
        />
        <span className="title">Delete Pod Force</span>
      </MenuItem>
    );
  }
}
