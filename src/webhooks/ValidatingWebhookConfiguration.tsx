import React from "react";

import { Renderer } from "@k8slens/extensions";

const {
  K8sApi: { KubeObject, KubeObjectStore, KubeApi, apiManager },
  Component: { TabLayout, KubeObjectListLayout },
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
/*
export const validatingWebhookConfigurationApi = new ValidatingWebhookConfigurationApi({
  objectConstructor: ValidatingWebhookConfiguration
});
*/

//export class ValidatingWebhookConfigurationStore extends KubeObjectStore<ValidatingWebhookConfiguration> {
// api = validatingWebhookConfigurationApi
//}

//export const validatingWebhookConfigurationStore = new ValidatingWebhookConfigurationStore();

//apiManager.registerStore(validatingWebhookConfigurationStore);

enum sortBy {
  name = "name",
  age = "age",
  webhooks = "webhooks",
}
enum columnId {
  name = "name",
  age = "age",
  webhooks = "webhooks",
}

export class ValidatingWebhookConfigurationPage extends React.Component<{
  extension: Renderer.LensExtension;
}> {
  render() {
    const validatingWebhookConfigurationApi =
      new ValidatingWebhookConfigurationApi({
        objectConstructor: ValidatingWebhookConfiguration,
      });
    class ValidatingWebhookConfigurationStore extends KubeObjectStore<ValidatingWebhookConfiguration> {
      api = validatingWebhookConfigurationApi;
    }
    const validatingWebhookConfigurationStore =
      new ValidatingWebhookConfigurationStore();

    apiManager.registerStore(validatingWebhookConfigurationStore);

    return (
      <TabLayout>
        <KubeObjectListLayout
          isConfigurable
          tableId="ValidatingWebhookConfiguration"
          className="ValidatingWebhookConfiguration"
          store={validatingWebhookConfigurationStore}
          sortingCallbacks={{
            [sortBy.name]: (
              validatingWebhookConfiguration: ValidatingWebhookConfiguration
            ) => validatingWebhookConfiguration.getName(),
            [sortBy.age]: (
              validatingWebhookConfiguration: ValidatingWebhookConfiguration
            ) => validatingWebhookConfiguration.getAge(),
            [sortBy.webhooks]: (
              validatingWebhookConfiguration: ValidatingWebhookConfiguration
            ) => validatingWebhookConfiguration.webhooks.length,
          }}
          searchFilters={[
            (validatingWebhookConfiguration: ValidatingWebhookConfiguration) =>
              validatingWebhookConfiguration.getSearchFields(),
          ]}
          renderHeaderTitle="ValidatingWebhookConfiguration"
          renderTableHeader={[
            { title: "Name", className: "name", sortBy: sortBy.name },
            {
              title: "Webhooks",
              className: "webhooks",
              sortBy: sortBy.webhooks,
            },
            { title: "Age", className: "age", sortBy: sortBy.age },
          ]}
          renderTableContents={(
            validatingWebhookConfiguration: ValidatingWebhookConfiguration
          ) => [
            validatingWebhookConfiguration.getName(),
            validatingWebhookConfiguration.webhooks.length,
            validatingWebhookConfiguration.getAge(),
          ]}
        />
      </TabLayout>
    );
  }
}

export function ValidatingWebhookConfigurationIcon(
  props: Renderer.Component.IconProps
) {
  return (
    <Renderer.Component.Icon
      {...props}
      material="security"
      tooltip="ValidatingWebhookConfiguration"
    />
  );
}
