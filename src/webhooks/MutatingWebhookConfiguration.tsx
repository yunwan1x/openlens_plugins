import React from "react";

import { Renderer } from "@k8slens/extensions";

const {
  K8sApi: { KubeObject, KubeObjectStore, KubeApi, apiManager },
  Component: { TabLayout, KubeObjectListLayout },
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
/*
export const mutatingWebhookConfigurationApi = new MutatingWebhookConfigurationApi({
  objectConstructor: MutatingWebhookConfiguration
});


export class MutatingWebhookConfigurationStore extends KubeObjectStore<MutatingWebhookConfiguration> {
  api = mutatingWebhookConfigurationApi
}*/

//export const mutatingWebhookConfigurationStore = new MutatingWebhookConfigurationStore();

//apiManager.registerStore(mutatingWebhookConfigurationStore);

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

export class MutatingWebhookConfigurationPage extends React.Component<{
  extension: Renderer.LensExtension;
}> {
  render() {
    const mutatingWebhookConfigurationApi = new MutatingWebhookConfigurationApi(
      {
        objectConstructor: MutatingWebhookConfiguration,
      }
    );

    class MutatingWebhookConfigurationStore extends KubeObjectStore<MutatingWebhookConfiguration> {
      api = mutatingWebhookConfigurationApi;
    }
    const mutatingWebhookConfigurationStore =
      new MutatingWebhookConfigurationStore();

    apiManager.registerStore(mutatingWebhookConfigurationStore);
    return (
      <TabLayout>
        <KubeObjectListLayout
          isConfigurable
          tableId="MutatingWebhookConfiguration"
          className="MutatingWebhookConfiguration"
          store={mutatingWebhookConfigurationStore}
          sortingCallbacks={{
            [sortBy.name]: (
              mutatingWebhookConfiguration: MutatingWebhookConfiguration
            ) => mutatingWebhookConfiguration.getName(),
            [sortBy.age]: (
              mutatingWebhookConfiguration: MutatingWebhookConfiguration
            ) => mutatingWebhookConfiguration.getAge(),
            [sortBy.webhooks]: (
              mutatingWebhookConfiguration: MutatingWebhookConfiguration
            ) => mutatingWebhookConfiguration.webhooks.length,
          }}
          searchFilters={[
            (mutatingWebhookConfiguration: MutatingWebhookConfiguration) =>
              mutatingWebhookConfiguration.getSearchFields(),
          ]}
          renderHeaderTitle="MutatingWebhookConfiguration"
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
            mutatingWebhookConfiguration: MutatingWebhookConfiguration
          ) => [
            mutatingWebhookConfiguration.getName(),
            mutatingWebhookConfiguration.webhooks.length,
            mutatingWebhookConfiguration.getAge(),
          ]}
        />
      </TabLayout>
    );
  }
}

export function MutatingWebhookConfigurationIcon(
  props: Renderer.Component.IconProps
) {
  return (
    <Renderer.Component.Icon
      {...props}
      material="security"
      tooltip="MutatingWebhookConfiguration"
    />
  );
}
