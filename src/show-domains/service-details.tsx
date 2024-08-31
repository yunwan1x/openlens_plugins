import { Renderer } from "@k8slens/extensions";
import React from "react";
import { observable } from "mobx";
import { observer } from "mobx-react";
//服务展示域名
@observer
export class ServiceDetails extends React.Component<
  Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.Service>
> {
  @observable private clusterdomain: string;

  async componentDidMount() {
    const cm = await Renderer.K8sApi.configMapApi.get({
      name: "coredns",
      namespace: "kube-system",
    });
    const Corefile = cm.data["Corefile"];

    const Corefiles = Corefile.split(/[(\r\n)\r\n]+/); // 根据换行或者回车进行识别
    console.log(Corefiles)
    Corefiles.forEach((item, index) => {
      // 删除空项
      if (item && item!="") {
        if (item.trim().startsWith("kubernetes ")) {
          this.clusterdomain = item.trim().split(" ")[1];
        }
      }
    });
    // force rerender hack
    this.setState({});
  }

  render() {
    const name = this.props.object.getName();
    const ns = this.props.object.getNs();
    return (
      <div>
        <Renderer.Component.DrawerTitle>Domains</Renderer.Component.DrawerTitle>
        <Renderer.Component.DrawerItem name="whole domain">
          {name}.{ns}.svc.{this.clusterdomain}
        </Renderer.Component.DrawerItem>
        <Renderer.Component.DrawerItem name="simple domain">
          {name}.{ns}
        </Renderer.Component.DrawerItem>
        <Renderer.Component.DrawerItem name="domain in the same namespace">
          {name}
        </Renderer.Component.DrawerItem>
      </div>
    );
  }
}
