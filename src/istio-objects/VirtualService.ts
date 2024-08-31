
import { Renderer } from "@k8slens/extensions";

const {
  K8sApi: { KubeObject,KubeApi },
} = Renderer;
export class VirtualServiceHttpMatchUri{
  exact?:string;
  prefix?:string;
}
export class VirtualServiceHttpMatch{
  uri?:VirtualServiceHttpMatchUri;
}
export class VirtualServiceHttpRedirect{
  uri?:VirtualServiceHttpMatchUri;
}
export class VirtualServiceHttpRewrite{
  uri?:VirtualServiceHttpMatchUri;
}
export class VirtualServiceHttpRouteDestinationPort{
  number?:number;
}
export class VirtualServiceHttpRouteDestination{
  host?:string;
  port?:VirtualServiceHttpRouteDestinationPort;
}
export class VirtualServiceHttpRoute{
  destination?:VirtualServiceHttpRouteDestination;
}

export class VirtualServiceHttp{
  match?:VirtualServiceHttpMatch[];
  name?:string;
  redirect?:VirtualServiceHttpRedirect;
  rewrite?:VirtualServiceHttpRewrite;
  route?:VirtualServiceHttpRoute[];

}
export class VirtualService extends KubeObject {
  static kind = "VirtualService";
  static namespaced = true;
  static apiBase = "/apis/networking.istio.io/v1alpha3/virtualservices";

  gateways? :string[];
  hosts? :string[];
  http?:VirtualServiceHttp[];
  constructor(data: any) {
    super(data);
    const { gateways,hosts ,http} = data.spec;
    this.gateways = gateways;
    this.hosts = hosts;
    this.http=http;
  }
}


export class VirtualServiceApi extends KubeApi<VirtualService> {}