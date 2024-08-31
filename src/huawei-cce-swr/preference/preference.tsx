import { Renderer } from "@k8slens/extensions";
import { makeObservable, computed, observable, runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import {
  cceLoginPreferencesStore,
  CCELoginUser,
} from "./preference-store";

const {
  Component: { SubTitle, Input },
} = Renderer;

@observer
export class CCELoginPreference extends React.Component {
  deleteUser(val: number) {
    cceLoginPreferencesStore.users =cceLoginPreferencesStore.users.filter((num,index)=>{return index !== val})
    cceLoginPreferencesStore.usersjson =JSON.stringify(cceLoginPreferencesStore.users)
  }

  constructor(props) {
    super(props);
    //接收变量的变化
    makeObservable(this);
  }
  renderUsers(user: CCELoginUser, index: number): any {
    const separatorStyle = {
      minWidth: "40px",
      minHeight: "40px",
    };
    const hintStyle = { marginTop: "8px" };

    return (
      <section>
        <button onClick={()=>this.deleteUser(index)}>Delete</button>
        <SubTitle title="CCE Login Url" />
        <Input
          theme="round-black"
          type="text"
          value={cceLoginPreferencesStore.users[index].url}
          onChange={(v) => {
            const users =cceLoginPreferencesStore.users;
            users[index].url = v;
            cceLoginPreferencesStore.users=users;
            cceLoginPreferencesStore.usersjson =JSON.stringify(cceLoginPreferencesStore.users)
          }}
        />
        <span style={hintStyle}>The Url of huawei cce.</span>
        <div style={separatorStyle}></div>

        <SubTitle title="User Name" />
        <Input
          theme="round-black"
          type="text"
          value={cceLoginPreferencesStore.users[index].username}
          onChange={(v) => {
            const users =cceLoginPreferencesStore.users;
            users[index].username = v;
            cceLoginPreferencesStore.users=users;
            cceLoginPreferencesStore.usersjson =JSON.stringify(cceLoginPreferencesStore.users)
          }}
        />
        <span style={hintStyle}>The username to login huawei cce.</span>

        <div style={separatorStyle}></div>

        <SubTitle title="Password" />
        <Input
          theme="round-black"
          type="password"
          value={cceLoginPreferencesStore.users[index].password}
          onChange={(v) => {
            const users =cceLoginPreferencesStore.users;
            users[index].password = v;
            cceLoginPreferencesStore.users=users;
            cceLoginPreferencesStore.usersjson =JSON.stringify(cceLoginPreferencesStore.users)
          }}
        />
        <span style={hintStyle}>The password to login huawei cce.</span>
      </section>
    );
  }

  addUser() {
    const users =cceLoginPreferencesStore.users;
    users.push({
      url: "",
      username: "",
      password: "",
    });
    cceLoginPreferencesStore.users=users;
    cceLoginPreferencesStore.usersjson =JSON.stringify(cceLoginPreferencesStore.users)
  }

  render() {
    const list = [];
    list.push(<button onClick={this.addUser}>Add</button>);
    for (let i = 0, s = cceLoginPreferencesStore.users.length; i < s; i++) {
      list.push(this.renderUsers(cceLoginPreferencesStore.users[i], i));
    }
    return list;
  }
}

export class CCELoginPreferenceHint extends React.Component {
  render() {
    return <span>cce login settings</span>;
  }
}
