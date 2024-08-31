import React from "react";

import { Renderer } from "@k8slens/extensions";

const {
  K8sApi: { KubeObject, KubeObjectStore, KubeApi, apiManager },
  Component: { TabLayout, KubeObjectListLayout },
} = Renderer;

export class APIService extends KubeObject {
  static kind = "APIService";
  static namespaced = false;
  static apiBase = "/apis/apiregistration.k8s.io/v1/apiservices";

  serviceName?: string;

  available?: string;

  constructor(data: any) {
    super(data);
    if (data.spec.service) {
      this.serviceName =
        data.spec.service.namespace + "/" + data.spec.service.name;
    } else {
      this.serviceName = "Local";
    }

    if (data.status && data.status.conditions) {
      for (let i = 0, s = data.status.conditions.length; i < s; i++) {
        if (data.status.conditions[i].type == "Available") {
          if (data.status.conditions[i].status == "True") {
            this.available = "True";
          } else {
            this.available =
              data.status.conditions[i].reason +
              "(" +
              data.status.conditions[i].message +
              ")";
          }
        }
      }
    }
  }
}

export class APIServiceApi extends KubeApi<APIService> {}

enum sortBy {
  name = "name",
  age = "age",
  service = "service",
  group = "group",
  version = "version",
  available = "available",
}
enum columnId {
  name = "name",
  age = "age",
  service = "service",
  group = "group",
  version = "version",
  available = "available",
}

export class APIServicePage extends React.Component<{
  extension: Renderer.LensExtension;
}> {
  render() {
    const apiServiceApi = new APIServiceApi({
      objectConstructor: APIService,
    });

    class APIServiceStore extends KubeObjectStore<APIService> {
      api = apiServiceApi;
    }
    const apiServiceStore = new APIServiceStore();

    apiManager.registerStore(apiServiceStore);
    return (
      <TabLayout>
        <KubeObjectListLayout
          isConfigurable
          tableId="APIService"
          className="APIService"
          store={apiServiceStore}
          sortingCallbacks={{
            [sortBy.name]: (apiService: APIService) => apiService.getName(),
            // [sortBy.group]: (apiService: APIService) => apiService.spec["group"],
            // [sortBy.version]: (apiService: APIService) => apiService.spec["version"],
            [sortBy.age]: (apiService: APIService) => apiService.getAge(),
            [sortBy.service]: (apiService: APIService) =>
              apiService.serviceName,

            [sortBy.available]: (apiService: APIService) =>
              apiService.available,
          }}
          searchFilters={[
            (apiService: APIService) => apiService.getSearchFields(),
          ]}
          renderHeaderTitle="APIService"
          renderTableHeader={[
            { title: "Name", className: "name", sortBy: sortBy.name },
            // { title: "Group", className: "name", sortBy: sortBy.group },
            //  { title: "Version", className: "name", sortBy: sortBy.version },
            { title: "Age", className: "age", sortBy: sortBy.age },
            { title: "Service", className: "service", sortBy: sortBy.service },
            {
              title: "Available",
              className: "available",
              sortBy: sortBy.available,
            },
          ]}
          renderTableContents={(apiService: APIService) => [
            apiService.getName(),
            // apiService.spec["group"],
            // apiService.spec["version"],
            apiService.getAge(),
            apiService.serviceName,
            apiService.available,
          ]}
        />
      </TabLayout>
    );
  }
}

export function APIServiceIcon(props: Renderer.Component.IconProps) {
  return (
    <Renderer.Component.Icon
      {...props}
      material="security"
      tooltip="APIService"
    />
  );
}
