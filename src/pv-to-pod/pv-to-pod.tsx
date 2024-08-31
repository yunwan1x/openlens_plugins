import { Renderer } from "@k8slens/extensions";
import React from "react";
import { Link } from "react-router-dom";
import { observable } from "mobx";
import { observer } from "mobx-react";

const {
  K8sApi: { podsApi, pvcApi },
} = Renderer;

@observer
export class PvToPod extends React.Component<
  Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.PersistentVolume>
> {
  @observable private pods: Renderer.K8sApi.Pod[];
  @observable private cs: any[];

  async componentWillReceiveProps(
    nextProps: Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.PersistentVolume>
  ) {
    await this.dealPods(nextProps);
  }
  async componentDidMount() {
    await this.dealPods(this.props);
  }
  stopPropagation(evt: Event | React.SyntheticEvent) {
    evt.stopPropagation();
  }
  async dealPods(
    props: Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.PersistentVolume>
  ) {
    const { object: pv } = props;
    this.pods = [];
    this.cs = [];

    if (pv) {
      const claimRefName = pv.getClaimRefName();
      if (claimRefName && claimRefName != "") {
        const pods = await podsApi.list({ namespace: pv.getNs() });
        this.pods = pods.filter((pod) => {
          return (
            pod.getVolumes().filter((volume) => {
              if (
                volume.persistentVolumeClaim &&
                volume.persistentVolumeClaim.claimName == claimRefName
              ) {
                return true;
              }
              return false;
            }).length > 0
          );
        });
        if (this.pods && this.pods.length > 0) {
          this.cs.push(
            <Renderer.Component.DrawerTitle>
              Pods
            </Renderer.Component.DrawerTitle>
          );
          this.pods.forEach((pod) => {
            this.cs.push(
              <div className="flex gaps align-center" key={pod.getId()}>
                <a
                  onClick={(evt) => {
                    evt.stopPropagation();
                    evt.preventDefault();
                    this.gotoPodDetail(pod);
                  }}
                >
                  {pod.getName()}
                </a>
              </div>
            );
          });
        }
        this.setState({});
      }
    }
  }
  gotoPodDetail(pod: Renderer.K8sApi.Pod) {
    Renderer.Navigation.navigate(
      Renderer.Navigation.getDetailsUrl(
        podsApi.formatUrlForNotListing({
          name: pod.getName(),
          namespace: pod.getNs(),
        })
      )
    );
  }
  render() {
    return <>{this.cs}</>;
  }
}
