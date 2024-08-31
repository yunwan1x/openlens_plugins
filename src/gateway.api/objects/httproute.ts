import { Renderer } from "@k8slens/extensions";

const {
  K8sApi: { KubeObject, KubeApi },
} = Renderer;
export class HTTPRouteParentRef {
  group?: string;
  kind?: string;
  name?: string;
  namespace?: string;
  port?:number;
}
export class HTTPRouteBackendRef {
  group?: string;
  kind?: string;
  name?: string;
  namespace?: string;
  weight?: number;
  port?:number;
}
export class HTTPRouteRule {
  backendRefs?: HTTPRouteBackendRef[];
}
export class HTTPRoute extends KubeObject {
  static kind = "HTTPRoute";
  static namespaced = true;
  static apiBase = "/apis/gateway.networking.k8s.io/v1beta1/httproutes";

  hostnames?: string[];
  parentRefs?: HTTPRouteParentRef[];
  rules?:HTTPRouteRule[];
  constructor(data: any) {
    super(data);
    const { hostnames, parentRefs,rules } = data.spec;
    this.hostnames = hostnames;
    this.parentRefs = parentRefs;
    this.rules =rules;
  }
}
