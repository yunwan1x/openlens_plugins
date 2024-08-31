import { Renderer } from "@k8slens/extensions";
import React from "react";
import { observable } from "mobx";
import { observer } from "mobx-react";
//Pod展示域名
@observer
export class PodDomainDetails extends React.Component<
  Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.Pod>
> {
  @observable private clusterdomain: string;
  @observable private pod_st_name: string;
  async componentDidMount() {
    const cm = await Renderer.K8sApi.configMapApi.get({
      name: "coredns",
      namespace: "kube-system",
    });
    const Corefile = cm.data["Corefile"];

    const Corefiles = Corefile.split(/[(\r\n)\r\n]+/); // 根据换行或者回车进行识别
    console.log(Corefiles);
    Corefiles.forEach((item, index) => {
      // 删除空项
      if (item && item != "") {
        if (item.trim().startsWith("kubernetes ")) {
          this.clusterdomain = item.trim().split(" ")[1];
        }
      }
    });
    const name = this.props.object.getName();
    const owner = this.props.object.getOwnerRefs()[0];
    const controller = owner.kind;

    //检查是否headless
    this.pod_st_name = "";
    if (controller == "StatefulSet") {
      const st = await Renderer.K8sApi.statefulSetApi.get({
        name: owner.name,
        namespace: owner.namespace,
      });

      if (st.spec.serviceName && st.spec.serviceName != "") {
        const headless_service = await Renderer.K8sApi.serviceApi.get({
          name: st.spec.serviceName,
          namespace: owner.namespace,
        });
        if (headless_service.getClusterIp() == "None") {
          this.pod_st_name = name + "." + st.spec.serviceName;
        }
      }
    }

    // force rerender hack
    this.setState({});
  }

  render() {
    const ns = this.props.object.getNs();
    let ip = "";
    if (this.props.object.getIPs().length > 0) {
      ip = this.props.object.getIPs()[0].replaceAll(".", "-");
    }
	
	if( this.props.object.getOwnerRefs().length >0) {
    const owner = this.props.object.getOwnerRefs()[0];
	
    const controller = owner.kind;

    if (controller == "StatefulSet" && this.pod_st_name != "") {
      return (
        <div>
          <Renderer.Component.DrawerTitle>
            Domains (Headless)
          </Renderer.Component.DrawerTitle>
          <Renderer.Component.DrawerItem name="whole domain">
            {this.pod_st_name}.{ns}.svc.{this.clusterdomain}
          </Renderer.Component.DrawerItem>
          <Renderer.Component.DrawerItem name="simple domain">
            {this.pod_st_name}.{ns}.svc
          </Renderer.Component.DrawerItem>
        </div>
      );
    }
	}

    if (ip != "") {
      return (
        <div>
          <Renderer.Component.DrawerTitle>
            Domains
          </Renderer.Component.DrawerTitle>
          <Renderer.Component.DrawerItem name="whole domain">
            {ip}.{ns}.pod.{this.clusterdomain}
          </Renderer.Component.DrawerItem>
          <Renderer.Component.DrawerItem name="simple domain">
            {ip}.{ns}.pod
          </Renderer.Component.DrawerItem>
        </div>
      );
    } else {
      return <div />;
    }
  }
}
