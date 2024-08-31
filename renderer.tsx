/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { Renderer } from "@k8slens/extensions";
const {
  Component: { Button },
} = Renderer;
import React from "react";
import { computed } from "mobx";

//webhooks
//import { ValidatingWebhookConfigurationPage, ValidatingWebhookConfigurationIcon } from "./src/webhooks/ValidatingWebhookConfiguration";
//import { MutatingWebhookConfigurationPage, MutatingWebhookConfigurationIcon } from "./src/webhooks/MutatingWebhookConfiguration";

//pod和node的邮件菜单
import { NodeMenu } from "./src/pod-shell-menu/node-menu";
import { PodAttachMenu } from "./src/pod-shell-menu/attach-menu";
import { PodShellMenu } from "./src/pod-shell-menu/shell-menu";
import { PodLogsMenu } from "./src/pod-shell-menu/logs-menu";
//显示tls证书明细和过期时间
//secret明细(展示证书有效期)
import { SecretDetails } from "./src/tls/secret-details";
//ingress明细(展示证书有效期)
import { IngressDetails } from "./src/tls/ingress-details";

//展示service域名
import { ServiceDetails } from "./src/show-domains/service-details";
//展示pod域名
import { PodDomainDetails } from "./src/show-domains/pod-domain-details";

//multi logs相关
import { DeploymentMultiPodLogsMenu } from "./src/multi-logs/menu/deployment-menu";
import { StatefulSetMultiPodLogsMenu } from "./src/multi-logs/menu/statefulset-menu";
import { DaemonSetMultiPodLogsMenu } from "./src/multi-logs/menu/daemonset-menu";

import { sternPreferenceStore } from "./src/multi-logs/preference/stern-preference/stern-preference-store";
import {
  MultiPodLogsSternPreference,
  MultiPodLogsSternPreferenceHint,
} from "./src/multi-logs/preference/stern-preference/stern-preference";

type Deployment = Renderer.K8sApi.Deployment;
type StatefulSet = Renderer.K8sApi.StatefulSet;
type DaemonSet = Renderer.K8sApi.DaemonSet;

//APIService 对象管理
import { APIServicePage, APIServiceIcon } from "./src/apiservices/APIService";
//导出原始helm
import { ExportHelmReleaseMenu } from "./src/export-helm-releases/menu/export-helm-release-menu";

//强制删除pod
import { PodDeleteForceMenu } from "./src/pod-delete-force/pod-delete-force-menu";

//华为云cce swr 登录设置
import {
  CCELoginPreference,
  CCELoginPreferenceHint,
} from "./src/huawei-cce-swr/preference/preference";
//华为cce swr镜像列表
import {
  HuaweiCCESwrSelfImages,
  HuaweiCCESwrImagesIcon,
} from "./src/huawei-cce-swr/images";

//cce登录账号设置
import { cceLoginPreferencesStore } from "./src/huawei-cce-swr/preference/preference-store";

//NetworkPolicy
import { NetworkPolicyComponent } from "./src/network-policy-viewer/network-policy-component";

//Ingress Chart
import { IngressChart } from "./src/ingress-chart/ingress-chart";

//链路搜索页面
import { LinkSearchIcon, LinkSearchPage } from "./src/link-search/link-search";


//webhooks Chart
import { MutatingWebhookConfigurationChart } from "./src/webhooks-charts/MutatingWebhookConfigurationChart";
import { ValidatingWebhookConfigurationChart } from "./src/webhooks-charts/ValidatingWebhookConfigurationChart";

//ingress检查页面
import {
  IngressCheckIcon,
  IngressCheckPage,
} from "./src/ingress-check/ingress-check";

//helm检查页面
import {
  HelmCheckIcon,
  HelmCheckPage,
} from "./src/helm-check/helm-check";

//ComponentStatus 对象管理
import {
  ComponentStatusPage,
  ComponentStatusIcon,
} from "./src/metrics-objects/ComponentStatus";
//PodMetrics 对象管理
import {
  PodMetricsPage,
  PodMetricsIcon,
} from "./src/metrics-objects/PodMetrics";
//NodeMetrics 对象管理
import {
  NodeMetricsPage,
  NodeMetricsIcon,
} from "./src/metrics-objects/NodeMetrics";

//导出所有helm按钮
import { ExportAllHelmButton } from "./src/export-helm-releases/export-all-helm-button";

//Pv到Pod的关联性
import { PvToPod } from "./src/pv-to-pod/pv-to-pod";

//Istio对象
import { Gateway as IstioGateway } from "./src/istio-objects/Gateway";
import { VirtualService as IstioVirtualService } from "./src/istio-objects/VirtualService";
//Istio Chart
//Istio gateway chart
import { IstioGatewayChart } from "./src/istio-charts/istio-gateway-chart/istio-gateway-chart";
//Istio virtualservice chart
import { IstioVirtualServiceChart } from "./src/istio-charts/istio-virtualservice-chart/istio-virtualservice-chart";

//Gateway API objects
import { HTTPRoute } from "./src/gateway.api/objects/httproute";
//httproute chart
import { HTTPRouteChart } from "./src/gateway.api/httproute-chart/httproute-chart";

//MutatingWebhookConfiguration objects
import { MutatingWebhookConfiguration } from "./src/webhooks-objects/MutatingWebhookConfiguration";
//ValidatingWebhookConfiguration objects
import { ValidatingWebhookConfiguration } from "./src/webhooks-objects/ValidatingWebhookConfiguration";
export default class IntegrationExtension extends Renderer.LensExtension {
  //webhooks 页面登记
  clusterPages = [
    /*{
    id: "validatingWebhookConfiguration",
    components: {
      Page: () => <ValidatingWebhookConfigurationPage extension={this} />,
      MenuIcon: ValidatingWebhookConfigurationIcon,
    }
  }, {
    id: "mutatingWebhookConfiguration",
    components: {
      Page: () => <MutatingWebhookConfigurationPage extension={this} />,
      MenuIcon: MutatingWebhookConfigurationIcon,
    }
  },*/ {
      //APIService资源管理
      id: "apiservice",
      components: {
        Page: () => <APIServicePage extension={this} />,
        MenuIcon: APIServiceIcon,
      },
    },
    {
      //SWR镜像查询
      id: "huawei-swr-self-images",
      components: {
        Page: () => <HuaweiCCESwrSelfImages extension={this} />,
        MenuIcon: HuaweiCCESwrImagesIcon,
      },
    },
    {
      //数据链路搜索
      id: "link-search",
      components: {
        Page: () => <LinkSearchPage extension={this} />,
        MenuIcon: LinkSearchIcon,
      },
    },
    {
      //ingress检查
      id: "ingress-check",
      components: {
        Page: () => <IngressCheckPage extension={this} />,
        MenuIcon: IngressCheckIcon,
      },
    },
    {
      //helm检查
      id: "helm-check",
      components: {
        Page: () => <HelmCheckPage extension={this} />,
        MenuIcon: HelmCheckIcon,
      },
    },
    {
      //ComponentStatus
      id: "ComponentStatus",
      components: {
        Page: () => <ComponentStatusPage extension={this} />,
        MenuIcon: ComponentStatusIcon,
      },
    },
    {
      //PodMetrics
      id: "PodMetrics",
      components: {
        Page: () => <PodMetricsPage extension={this} />,
        MenuIcon: PodMetricsIcon,
      },
    },
    {
      //NodeMetrics
      id: "NodeMetrics",
      components: {
        Page: () => <NodeMetricsPage extension={this} />,
        MenuIcon: NodeMetricsIcon,
      },
    },
  ];
  //webhooks 菜单登记
  clusterPageMenus = [
    //新版有了不需要加了
    /*
    {
      id: "webhooks",
      title: "WebHooks",
      components: {
        Icon: MutatingWebhookConfigurationIcon,
      },
    },
    
    {
      parentId: "webhooks",
      target: { pageId: "mutatingWebhookConfiguration" },
      title: "MutatingWebhookConfiguration",
      components: {
        Icon: MutatingWebhookConfigurationIcon,
      }
    },
    {
      parentId: "webhooks",
      target: { pageId: "validatingWebhookConfiguration" },
      title: "ValidatingWebhookConfiguration",
      components: {
        Icon: ValidatingWebhookConfigurationIcon,
      }
    },*/

    // {
    //   id: "cceswr",
    //   title: "Huawei CCE SWR",
    //   components: {
    //     Icon: HuaweiCCESwrImagesIcon,
    //   },
    // },
    // {
    //   id: "huawei-swr-self-images",
    //   parentId: "cceswr",
    //   target: { pageId: "huawei-swr-self-images" },
    //   title: "Self Images",
    //   components: {
    //     Icon: HuaweiCCESwrImagesIcon,
    //   },
    // },
    {
      id: "apiservices",
      title: "APIServices",
      components: {
        Icon: APIServiceIcon,
      },
    },
    {
      id: "apiservice",
      parentId: "apiservices",
      target: { pageId: "apiservice" },
      title: "APIService",
      components: {
        Icon: APIServiceIcon,
      },
    },
    {
      id: "Metrics",
      title: "Metrics",
      components: {
        Icon: ComponentStatusIcon,
      },
    },
    {
      id: "ComponentStatus",
      parentId: "Metrics",
      target: { pageId: "ComponentStatus" },
      title: "ComponentStatus",
      components: {
        Icon: ComponentStatusIcon,
      },
    },
    {
      id: "PodMetrics",
      parentId: "Metrics",
      target: { pageId: "PodMetrics" },
      title: "PodMetrics",
      components: {
        Icon: PodMetricsIcon,
      },
    },
    {
      id: "NodeMetrics",
      parentId: "Metrics",
      target: { pageId: "NodeMetrics" },
      title: "NodeMetrics",
      components: {
        Icon: NodeMetricsIcon,
      },
    },
    {
      id: "link-search-root",
      title: "Link Search",
      components: {
        Icon: LinkSearchIcon,
      },
    },
    {
      id: "link-search",
      parentId: "link-search-root",
      target: { pageId: "link-search" },
      title: "Link Search",
      components: {
        Icon: LinkSearchIcon,
      },
    },
    {
      id: "ingress-check-root",
      title: "Ingress check",
      components: {
        Icon: IngressCheckIcon,
      },
    },
    {
      id: "ingress-check",
      parentId: "ingress-check-root",
      target: { pageId: "ingress-check" },
      title: "Ingress check",
      components: {
        Icon: IngressCheckIcon,
      },
    },
    {
      id: "helm-check-root",
      title: "Helm check",
      components: {
        Icon: HelmCheckIcon,
      },
    },
    {
      id: "helm-check",
      parentId: "helm-check-root",
      target: { pageId: "helm-check" },
      title: "Helm check",
      components: {
        Icon: HelmCheckIcon,
      },
    },
  ];

  //登记邮件菜单
  kubeObjectMenuItems = [
    {
      kind: "Node",
      apiVersions: ["v1"],
      components: {
        MenuItem: (
          props: Renderer.Component.KubeObjectMenuProps<Renderer.K8sApi.Node>
        ) => <NodeMenu {...props} />,
      },
    },
    {
      kind: "Pod",
      apiVersions: ["v1"],
      components: {
        MenuItem: (
          props: Renderer.Component.KubeObjectMenuProps<Renderer.K8sApi.Pod>
        ) => <PodAttachMenu {...props} />,
      },
    },
    {
      kind: "Pod",
      apiVersions: ["v1"],
      components: {
        MenuItem: (
          props: Renderer.Component.KubeObjectMenuProps<Renderer.K8sApi.Pod>
        ) => <PodShellMenu {...props} />,
      },
    },
    {
      kind: "Pod",
      apiVersions: ["v1"],
      components: {
        MenuItem: (
          props: Renderer.Component.KubeObjectMenuProps<Renderer.K8sApi.Pod>
        ) => <PodLogsMenu {...props} />,
      },
    },
    {
      kind: "Pod",
      apiVersions: ["v1"],
      components: {
        MenuItem: (
          props: Renderer.Component.KubeObjectMenuProps<Renderer.K8sApi.Pod>
        ) => <PodFileManagerMenu {...props} />,
      },
    },

    {
      kind: "Deployment",
      apiVersions: ["apps/v1"],
      components: {
        MenuItem: (
          props: Renderer.Component.KubeObjectMenuProps<Deployment>
        ) => <DeploymentMultiPodLogsMenu {...props} />,
      },
    },
    //multi pod logs相关菜单
    {
      kind: "StatefulSet",
      apiVersions: ["apps/v1"],
      components: {
        MenuItem: (
          props: Renderer.Component.KubeObjectMenuProps<StatefulSet>
        ) => <StatefulSetMultiPodLogsMenu {...props} />,
      },
    },
    {
      kind: "DaemonSet",
      apiVersions: ["apps/v1"],
      components: {
        MenuItem: (
          props: Renderer.Component.KubeObjectMenuProps<DaemonSet>
        ) => <DaemonSetMultiPodLogsMenu {...props} />,
      },
    },

    {
      kind: "Pod",
      apiVersions: ["v1"],
      components: {
        MenuItem: (
          props: Renderer.Component.KubeObjectMenuProps<Renderer.K8sApi.Pod>
        ) => <PodDeleteForceMenu {...props} />,
      },
    },
  ];
  kubeObjectDetailItems = [
    {
      kind: "Secret",
      apiVersions: ["v1"],
      priority: 10,
      components: {
        Details: (
          props: Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.Secret>
        ) => <SecretDetails {...props} />,
      },
    },
    {
      kind: "Ingress",
      apiVersions: ["networking.k8s.io/v1", "extensions/v1beta1"],
      priority: 11,
      components: {
        Details: (
          props: Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.Ingress>
        ) => <IngressDetails {...props} />,
      },
    },
    {
      kind: "Ingress",
      apiVersions: ["networking.k8s.io/v1", "extensions/v1beta1"],
      priority: 12,
      components: {
        Details: (
          props: Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.Ingress>
        ) => <IngressChart {...props} />,
      },
    },
    {
      kind: "Service",
      apiVersions: ["v1"],
      priority: 13,
      components: {
        Details: (
          props: Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.Service>
        ) => <ServiceDetails {...props} />,
      },
    },
    {
      kind: "Pod",
      apiVersions: ["v1"],
      priority: 14,
      components: {
        Details: (
          props: Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.Pod>
        ) => <PodDomainDetails {...props} />,
      },
    },
    {
      kind: "NetworkPolicy",
      apiVersions: ["networking.k8s.io/v1"],
      priority: 15,
      components: {
        Details: (
          props: Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.NetworkPolicy>
        ) => <NetworkPolicyComponent {...props} />,
      },
    },
    {
      kind: "PersistentVolume",
      apiVersions: ["v1"],
      priority: 16,
      components: {
        Details: (
          props: Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.PersistentVolume>
        ) => <PvToPod {...props} />,
      },
    },
    {
      kind: "Gateway",
      apiVersions: ["networking.istio.io/v1alpha3"],
      priority: 17,
      components: {
        Details: (
          props: Renderer.Component.KubeObjectDetailsProps<IstioGateway>
        ) => <IstioGatewayChart {...props} />,
      },
    },
    {
      kind: "VirtualService",
      apiVersions: ["networking.istio.io/v1alpha3"],
      priority: 18,
      components: {
        Details: (
          props: Renderer.Component.KubeObjectDetailsProps<IstioVirtualService>
        ) => <IstioVirtualServiceChart {...props} />,
      },
    },
    {
      kind: "HTTPRoute",
      apiVersions: [
        "gateway.networking.k8s.io/v1beta1",
        "gateway.networking.k8s.io/v1",
      ],
      priority: 19,
      components: {
        Details: (
          props: Renderer.Component.KubeObjectDetailsProps<HTTPRoute>
        ) => <HTTPRouteChart {...props} />,
      },
    },
    {
      kind: "MutatingWebhookConfiguration",
      apiVersions: [
        "admissionregistration.k8s.io/v1",
      ],
      priority: 20,
      components: {
        Details: (
          props: Renderer.Component.KubeObjectDetailsProps<MutatingWebhookConfiguration>
        ) => <MutatingWebhookConfigurationChart {...props} />,
      },
    },
    {
      kind: "ValidatingWebhookConfiguration",
      apiVersions: [
        "admissionregistration.k8s.io/v1",
      ],
      priority: 20,
      components: {
        Details: (
          props: Renderer.Component.KubeObjectDetailsProps<ValidatingWebhookConfiguration>
        ) => <ValidatingWebhookConfigurationChart {...props} />,
      },
    },
  ];

  //multi pod logs设置
  // Array of objects for extension preferences
  appPreferences = [
    {
      id: "MultiPodLogs",
      title: "MultiPodLogs",
      components: {
        Input: () => <MultiPodLogsSternPreference />,
        Hint: () => <MultiPodLogsSternPreferenceHint />,
      },
    },
    {
      id: "CCELoginSettings",
      title: "CCE Login Settings",
      components: {
        Input: () => <CCELoginPreference />,
        Hint: () => <CCELoginPreferenceHint />,
      },
    },
  ];

  // Enabling extension calls onActivate()
  onActivate() {
    console.log("lens-multi-pod-logs renderer | activating...");
    sternPreferenceStore.loadExtension(this);
    console.log("lens-multi-pod-logs renderer | activated");

    console.log("huawei-cce-swr renderer | activating...");
    cceLoginPreferencesStore.loadExtension(this);
    console.log("huawei-cce-swr renderer | activated");
  }

  // Disabling extension calls onDeactivate()
  onDeactivate() {
    console.log("lens-multi-pod-logs renderer | de-activated");
  }

  //添加文件管理弹框页面
  clusterFrameComponents = [
    {
      id: "PodFileManagerDialog",
      Component: () => (
        <PodFileManagerDialog
          isDialogOpen={computed(() => dialogState.isOpen.get())}
        ></PodFileManagerDialog>
      ),
      shouldRender: computed(() => true),
    },
    {
      id: "PodFileViewDialog",
      Component: () => (
        <PodFileViewDialog
          isDialogOpen={computed(() => viewFileDialogState.isOpen.get())}
        ></PodFileViewDialog>
      ),
      shouldRender: computed(() => true),
    },
  ];

  // helmReleaseMenuItems = [
  //   {
  //     components: {
  //       MenuItem: (props: Renderer.Component.HelmReleaseMenuItemProps) => (
  //         <ExportHelmReleaseMenu {...props} />
  //       ),
  //     },
  //   },
  // ];

  // topBarItems = [
  //   {
  //     //导出所有helm按钮
  //     components: {
  //       Item: () => <ExportAllHelmButton />,
  //     },
  //   },
  // ];
}

//pod文件管理器菜单
import {
  PodFileManagerMenu,
  dialogState,
} from "./src/pod-file-manager/pod-file-manager-menu";
import {
  PodFileManagerDialog,
  viewFileDialogState,
} from "./src/pod-file-manager/pod-file-manager-dialog";
import { PodFileViewDialog } from "./src/pod-file-manager/pod-file-view-dialog";
export function PodFileManagerIcon(props: Renderer.Component.IconProps) {
  return (
    <Renderer.Component.Icon
      {...props}
      material="folder"
      tooltip="PodFileManager"
    />
  );
}
