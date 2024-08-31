import { Renderer } from "@k8slens/extensions";
import React from "react";
import { makeObservable, computed, observable, runInAction } from "mobx";
import { observer } from "mobx-react";

const {
  Component: { Button },
  K8sApi: { podsApi, serviceApi, ingressApi },
} = Renderer;
import "./ingress-check.scss";
import tls, { PeerCertificate } from "tls";
import net from "net";
//检查错误ingress配置
@observer
export class IngressCheckPage extends React.Component<{
  extension: Renderer.LensExtension;
}> {
  @observable private resultList: object[] = [];
  @observable private checking = false;
  render() {
    return (
      <div className="ingress-check-container">
        <p>
          <Button
            disabled={this.checking}
            onClick={() => {
              //检查ingress
              this.checkAllIngress();
            }}
          >
            Check Ingress {this.checking ? "(Checking...)" : ""}
          </Button>
          <table className="ingress-check-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Namespace</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {this.resultList.map((item) => {
                return (
                  <tr>
                    <td>{item["name"]}</td>
                    <td>{item["namespace"]}</td>
                    <td>{item["error"]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </p>
      </div>
    );
  }

  //检查ingress错误
  async checkAllIngress() {
    this.checking = true;
    // force rerender hack
    this.setState({});

    const ingressList = await ingressApi.list();
    const resultList = [];
    for (let i = 0; i < ingressList.length; i++) {
      const ingress = ingressList[i];
      if (ingress.spec.tls) {
        if (ingress.spec.tls.length == 0) {
          resultList.push({
            name: ingress.metadata.name,
            namespace: ingress.metadata.namespace,
            error: "ingress has no tls",
            ingress: ingress,
          });
        }
        for (let j = 0; j < ingress.spec.tls.length; j++) {
          const tls1 = ingress.spec.tls[j];
          if (tls1.secretName) {
            let secret: Renderer.K8sApi.Secret = null;
            try {
              secret = await Renderer.K8sApi.secretsApi.get({
                namespace: ingress.getNs(),
                name: tls1.secretName,
              });
            } catch (e) {
              console.log(e);
            }
            //检查secret是否存在
            if (!secret) {
              resultList.push({
                name: ingress.metadata.name,
                namespace: ingress.metadata.namespace,
                error: "secret " + tls1.secretName + " is not exist",
                ingress: ingress,
              });
            } else {
              //检查secret是否过期
              const secretKeys = secret.getKeys();

              for (const key of secretKeys) {
                const certificateString = Buffer.from(
                  secret.data[key],
                  "base64"
                ).toString("ascii");

                if (
                  !certificateString.startsWith("-----BEGIN CERTIFICATE-----")
                )
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

                  const date = new Date(cert.valid_to);
                  const now = new Date();
                  if (date.getTime() < now.getTime()) {
                    resultList.push({
                      name: ingress.metadata.name,
                      namespace: ingress.metadata.namespace,
                      error: "secret " + tls1.secretName + " is expired",
                      ingress: ingress,
                    });
                  }
                } catch (e) {
                  console.error(e);
                }
              }
            }
          }
        }
      }
      if (ingress.spec.rules) {
        for (let j = 0; j < ingress.spec.rules.length; j++) {
          const rule = ingress.spec.rules[j];
          if (ingress.spec.tls) {
            if (!rule.host) {
              resultList.push({
                name: ingress.metadata.name,
                namespace: ingress.metadata.namespace,
                error: "https protocol but no host",
                ingress: ingress,
              });
            }
          }

          if (rule.http && rule.http.paths) {
            for (let j = 0, l = rule.http.paths.length; j < l; j++) {
              const path = rule.http.paths[j];
              if (path.backend && path.backend["service"]) {
                let serviceObject: Renderer.K8sApi.Service = null;
                try {
                  serviceObject = await Renderer.K8sApi.serviceApi.get({
                    name: path.backend["service"].name,
                    namespace: ingress.getNs(),
                  });
                } catch (e) {
                  console.log(e);
                }

                if (!serviceObject) {
                  resultList.push({
                    name: ingress.metadata.name,
                    namespace: ingress.metadata.namespace,
                    error:
                      "service " +
                      path.backend["service"].name +
                      " is not exist",
                    ingress: ingress,
                  });
                }
              }
            }
          }
        }
      }
    }

    this.resultList = resultList;
    this.checking = false;
    // force rerender hack
    this.setState({});
  }
}

export function IngressCheckIcon(props: Renderer.Component.IconProps) {
  return (
    <Renderer.Component.Icon
      {...props}
      material="security"
      tooltip="IngressCheck"
    />
  );
}
