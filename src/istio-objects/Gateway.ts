import { Renderer } from "@k8slens/extensions";
const {
  K8sApi: { KubeObject,KubeApi },
} = Renderer;
export class GatewayServerPort {
  name?: string;
  number?: number;
  protocol?: string;
}
export class GatewayServerTls {
  httpsRedirect?: boolean;
  credentialName?:string;
  mode?:string;
}
export class GatewayServer {
  hosts?: string[];
  port?: GatewayServerPort;
  tls: GatewayServerTls
}
export class Gateway extends KubeObject {
  static kind = "Gateway";
  static namespaced = true;
  static apiBase = "/apis/networking.istio.io/v1alpha3/gateways";

  servers?: GatewayServer[];

  constructor(data: any) {
    super(data);
    const { servers } = data;
    this.servers = servers;
  }
}

export class GatewayApi extends KubeApi<Gateway> {}