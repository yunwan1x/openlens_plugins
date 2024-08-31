
import { Renderer } from "@k8slens/extensions";

const {
  K8sApi: { KubeObject, KubeObjectStore, KubeApi, apiManager },
} = Renderer;

export class MutatingWebhookConfiguration extends KubeObject {
  static kind = "MutatingWebhookConfiguration";
  static namespaced = false;
  static apiBase =
    "/apis/admissionregistration.k8s.io/v1/mutatingwebhookconfigurations";

  webhooks?: unknown[];

  constructor(data: any) {
    super(data);
    const { webhooks } = data;
    this.webhooks = webhooks;
  }
}

export class MutatingWebhookConfigurationApi extends KubeApi<MutatingWebhookConfiguration> {}