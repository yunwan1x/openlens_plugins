
import { Renderer } from "@k8slens/extensions";

const {
  K8sApi: { KubeObject, KubeObjectStore, KubeApi, apiManager },
} = Renderer;

export class ValidatingWebhookConfiguration extends KubeObject {
  static kind = "ValidatingWebhookConfiguration";
  static namespaced = false;
  static apiBase =
    "/apis/admissionregistration.k8s.io/v1/validatingwebhookconfigurations";

  webhooks?: unknown[];

  constructor(data: any) {
    super(data);
    const { webhooks } = data;
    this.webhooks = webhooks;
  }
}

export class ValidatingWebhookConfigurationApi extends KubeApi<ValidatingWebhookConfiguration> {}
