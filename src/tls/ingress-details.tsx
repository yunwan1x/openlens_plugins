import { Renderer } from "@k8slens/extensions";
import React from "react";
import tls, { PeerCertificate } from "tls";
import net from "net";
import { observable } from "mobx";
import { observer } from "mobx-react";

@observer
export class IngressDetails extends React.Component<
  Renderer.Component.KubeObjectDetailsProps<Renderer.K8sApi.Ingress>
> {
  formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const color = now > date ? "red" : "";

    const diffInMs = date.getTime() - now.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

    return (
      <span color={color}>
        {dateString} <i>(Valid: {diffInDays} days)</i>
      </span>
    );
  }

  formatSAN(subjectaltname: string) {
    return subjectaltname?.split(/, /).map((s) => (
      <React.Fragment>
        {s}
        <br />
      </React.Fragment>
    ));
  }
  @observable private certificates: any[];
  async componentDidMount() {
    const certificates: any[] = [];
    if (this.props.object.spec.tls && this.props.object.spec.tls.length > 0) {
      for (let i = 0, s = this.props.object.spec.tls.length; i < s; i++) {
        if (!this.props.object.spec.tls[i].secretName) {
          continue;
        }
        //console.log(this.props.object.spec.tls[i].secretName)
        //console.log(this.props.object.getNs())
        let secret = null;
        try {
          secret = await Renderer.K8sApi.secretsApi.get({
            name: this.props.object.spec.tls[i].secretName,
            namespace: this.props.object.getNs(),
          });
        } catch (e) {
          console.error(e);
        }
        if (!secret) {
          certificates.push(
            <>
              <Renderer.Component.DrawerTitle>
                Certificate Info
              </Renderer.Component.DrawerTitle>
              <span style={{ "color": "red" }}>
                Secret {this.props.object.spec.tls[i].secretName} not Exists
              </span>
            </>
          );
          continue;
        }
        //console.log(secret)
        const secretKeys = secret.getKeys();

        for (const key of secretKeys) {
          const certificateString = Buffer.from(
            secret.data[key],
            "base64"
          ).toString("ascii");

          if (!certificateString.startsWith("-----BEGIN CERTIFICATE-----"))
            continue;

          try {
            const secureContext = tls.createSecureContext({
              cert: certificateString,
            });

            const secureSocket = new tls.TLSSocket(new net.Socket(), {
              secureContext,
            });
            const cert: PeerCertificate =
              secureSocket.getCertificate() as PeerCertificate;

            certificates.push(
              <div>
                <Renderer.Component.DrawerTitle>
                  Certificate Info - {key}
                </Renderer.Component.DrawerTitle>
                <Renderer.Component.DrawerItem name="CN">
                  {cert.subject.CN}
                </Renderer.Component.DrawerItem>
                <Renderer.Component.DrawerItem name="SAN">
                  {this.formatSAN(cert.subjectaltname)}
                </Renderer.Component.DrawerItem>
                <Renderer.Component.DrawerItem name="Issuer">
                  {cert.issuer.CN}
                </Renderer.Component.DrawerItem>
                <Renderer.Component.DrawerItem name="Not before">
                  {cert.valid_from}
                </Renderer.Component.DrawerItem>
                <Renderer.Component.DrawerItem name="Expires">
                  {this.formatDate(cert.valid_to)}
                </Renderer.Component.DrawerItem>
              </div>
            );
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
    this.certificates = certificates;

    // force rerender hack
    this.setState({});
  }
  render() {
    return <div>{this.certificates}</div>;
  }
}
