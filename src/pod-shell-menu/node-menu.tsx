/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import React from "react";
import { Common, Renderer } from "@k8slens/extensions";

type Node = Renderer.K8sApi.Node;

const {
  Component: {
    terminalStore,
    createTerminalTab,
    ConfirmDialog,
    MenuItem,
    Icon,
  },
  Navigation,
  Catalog: {
    CatalogEntityRegistry
  }
} = Renderer;
const {
  App,
} = Common;

export function NodeMenu(props: Renderer.Component.KubeObjectMenuProps<Node>) {
  const { object: node, toolbar } = props;

  if (!node) {
    return null;
  }

  const nodeName = node.getName();
  const kubectlPath = App.Preferences.getKubectlPath() || "kubectl";
  const kubeconfigPath = new CatalogEntityRegistry().activeEntity.spec.kubeconfigPath;

  const sendToTerminal = (command: string) => {
    terminalStore.sendCommand(command, {
      enter: true,
      newTab: true,
    });
    Navigation.hideDetails();
  };

  const shell = () => {
    /*
    createTerminalTab({
      title: `Node: ${nodeName}`,
      node: nodeName,
    });
    Navigation.hideDetails();
  */
    //sendToTerminal(`${kubectlPath} --kubeconfig  ${kubeconfigPath} node/${nodeName}   -it --image=alpine:latest --image-pull-policy=IfNotPresent `);
    ConfirmDialog.open({
      ok: () => sendToTerminal(`${kubectlPath}  debug   --kubeconfig  ${kubeconfigPath}    node/${nodeName}  node/${nodeName}   -it --image=alpine:latest --image-pull-policy=IfNotPresent `),
      labelOk: `Node Shell`,
      message: (
        <p>
          {"Are you sure you want to node shell of "}
          <b>{nodeName}</b>
          ?
        </p>
      ),
    });
  };

  const cordon = () => {
    sendToTerminal(`${kubectlPath} cordon --kubeconfig  ${kubeconfigPath}  ${nodeName}`);
  };

  const unCordon = () => {
    sendToTerminal(`${kubectlPath}  uncordon --kubeconfig ${kubeconfigPath}  ${nodeName}`);
  };

  const drain = () => {
    const command = `${kubectlPath}  drain ${nodeName} --kubeconfig  ${kubeconfigPath}  --delete-local-data --ignore-daemonsets --force`;

    ConfirmDialog.open({
      ok: () => sendToTerminal(command),
      labelOk: `Drain Node`,
      message: (
        <p>
          {"Are you sure you want to drain "}
          <b>{nodeName}</b>
          ?
        </p>
      ),
    });
  };

  return (
    <>
      <MenuItem onClick={shell}>
        <Icon
          svg="ssh"
          interactive={toolbar}
          tooltip={toolbar && "Node shell"}
        />
        <span className="title">Shell</span>
      </MenuItem>
      {
        node.isUnschedulable()
          ? (
            <MenuItem onClick={unCordon}>
              <Icon
                material="play_circle_filled"
                tooltip={toolbar && "Uncordon"}
                interactive={toolbar}
              />
              <span className="title">Uncordon</span>
            </MenuItem>
          )
          : (
            <MenuItem onClick={cordon}>
              <Icon
                material="pause_circle_filled"
                tooltip={toolbar && "Cordon"}
                interactive={toolbar}
              />
              <span className="title">Cordon</span>
            </MenuItem>
          )
      }
      <MenuItem onClick={drain}>
        <Icon
          material="delete_sweep"
          tooltip={toolbar && "Drain"}
          interactive={toolbar}
        />
        <span className="title">Drain</span>
      </MenuItem>
    </>
  );
}
