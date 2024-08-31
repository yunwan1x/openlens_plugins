import { Common } from "@k8slens/extensions";
import { observable, makeObservable } from "mobx";

export type CCELoginUser = {
  url: string;
  username: string;
  password: string;
};


export type CCELoginPreferencesModel = {
  usersjson :string
};

export class CCELoginPreferencesStore extends Common.Store
  .ExtensionStore<CCELoginPreferencesModel> {
    
  // Store properties
  @observable  users=[]
  @observable  usersjson="[]"
  constructor() {
    super({
      // Store name
      configName: "ccelogin-preference-store",
      // Store default property values
      defaults: {
        usersjson:"[]"
      },
    });
    makeObservable(this);
  }

  fromStore({ usersjson }: CCELoginPreferencesModel): void {
    this.users=JSON.parse(usersjson);
    this.usersjson =usersjson
  }

  toJSON(): CCELoginPreferencesModel {
    return {
      usersjson: this.usersjson
    };
  }
}

export const cceLoginPreferencesStore = new CCELoginPreferencesStore();
