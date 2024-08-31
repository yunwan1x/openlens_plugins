import { Renderer } from "@k8slens/extensions";
import React from "react";

import {
  CCELoginUser,
  cceLoginPreferencesStore,
} from "./preference/preference-store";

import { makeObservable, computed, observable, runInAction } from "mobx";
import { observer } from "mobx-react";
import https from "https";
import fetch from "@k8slens/node-fetch";
import "./image.css";

const {
  Component: { Button },
} = Renderer;

import * as Excel from "xlsx/xlsx.mjs";

import writeXlsxFile from "write-excel-file";
//SWR镜像列表(自己的镜像)
@observer
export class HuaweiCCESwrSelfImages extends React.Component<{
  extension: Renderer.LensExtension;
}> {
  @observable private userIndex: number;
  @observable private cce_url: string;
  @observable private cce_username: string;
  @observable private cce_password: string;
  //token
  @observable private id_token: string;
  @observable private access_token: string;
  //机构
  @observable private orgs: string[];
  @observable private org: string;
  //namespace
  @observable private namespaces: string[];
  @observable private namespace: string;
  //搜索
  @observable private search: string;
  //镜像列表
  @observable private repos: object[];
  constructor(props) {
    super(props);
    //接收变量的变化
    makeObservable(this);
  }
  //登录获取token
  async login() {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const headersList = {
      Accept: "*/*",
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const bodyContent =
      "client_id=cce-client&response_type=code&grant_type=password&username=" +
      encodeURI(cceLoginPreferencesStore.users[this.userIndex].username) +
      "&password=" +
      encodeURI(cceLoginPreferencesStore.users[this.userIndex].password) +
      "&scope=openid";

    const response = await fetch(
      cceLoginPreferencesStore.users[this.userIndex].url +
        "/auth/realms/CCE/protocol/openid-connect/token",
      {
        method: "POST",
        body: bodyContent,
        headers: headersList,
        agent,
      }
    );

    const login_response = await response.json();

    this.id_token = login_response["id_token"];
    this.access_token = login_response["access_token"];
  }
  //获取组织机构列表
  async getOrgs() {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const headersList = {
      Accept: "*/*",
      Authorization: "bearer " + this.access_token,
      "Content-Type": " application/json;charset=utf-8",
    };

    const response = await fetch(
      cceLoginPreferencesStore.users[this.userIndex].url +
        "/auth/realms/CCE/protocol/openid-connect/userinfo",
      {
        method: "GET",
        headers: headersList,
        agent,
      }
    );

    const data = await response.json();
    if (data["roles"].includes("system_admin")) {
      const response_all = await fetch(
        cceLoginPreferencesStore.users[this.userIndex].url +
          "/apis/cce/v1/organizations",
        {
          method: "GET",
          headers: headersList,
          agent,
        }
      );
      const data_all = await response_all.json();
      const items = data_all["items"];
      this.orgs = items.map((t) => t["metadata"]["name"]);
    } else {
      this.orgs = data["org_admin"];
    }
  }
  //获取namespace列表
  async getNamespaces() {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const headersList = {
      Accept: "*/*",
      Authorization: "bearer " + this.id_token,
      Organization: this.org,
    };

    const response = await fetch(
      cceLoginPreferencesStore.users[this.userIndex].url +
        "/v2/manage/namespaces",
      {
        method: "GET",
        headers: headersList,
        agent,
      }
    );

    const data = await response.json();

    this.namespaces = data["namespaces"];
  }

  //获取镜像列表列表
  async getRepos() {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const headersList = {
      Accept: "*/*",
      Authorization: "bearer " + this.id_token,
      Organization: this.org ? this.org : "",
    };
    let filter = "";
    if (this.namespace && this.namespace.trim() != "") {
      filter = filter + "|namespace::" + this.namespace;
    }

    const response = await fetch(
      cceLoginPreferencesStore.users[this.userIndex].url +
        "/v2/manage/repos?filter=center::self" +
        filter,
      {
        method: "GET",
        headers: headersList,
        agent,
      }
    );

    const data = await response.json();

    this.repos = data["data"].sort((n1, n2) => {
      return Number(n2["num_images"]) - Number(n1["num_images"]);
    });
  }
  isSettingCompeleted(): boolean {
    return (
      cceLoginPreferencesStore.users &&
      cceLoginPreferencesStore.users.length > 0
    );
  }
  async componentDidMount() {
    if (!this.isSettingCompeleted()) {
      return;
    }
    this.userIndex = 0;

    //登录获取token
    await this.login();
    //获取机构
    await this.getOrgs();
    if (!this.org || this.org.trim() == "") {
      if (this.orgs && this.orgs.length > 0) {
        this.org = this.orgs[0];
        await this.getNamespaces();
        if (this.namespaces && this.namespaces.length > 0) {
          this.namespace = this.namespaces[0]["name"];
        } else {
          this.namespace = "";
        }
      }
    }
    //获取镜像列表
    await this.getRepos();
    // force rerender hack
    this.setState({});
  }
  renderOrgDropDowns() {
    const list = [];
    if (this.orgs && this.orgs.length > 0) {
      for (let i = 0, s = this.orgs.length; i < s; i++) {
        list.push(<option value={this.orgs[i]}>{this.orgs[i]}</option>);
      }
    }
    return list;
  }
  renderNamespaceDropDowns() {
    const list = [];
    if (this.namespaces && this.namespaces.length > 0) {
      list.push(<option value={""}></option>);
      for (let i = 0, s = this.namespaces.length; i < s; i++) {
        list.push(
          <option value={this.namespaces[i]["name"]}>
            {this.namespaces[i]["name"]}
          </option>
        );
      }
    }
    return list;
  }
  renderRepos() {
    const list = [];
    if (this.repos && this.repos.length > 0) {
      let repos_fliter = this.repos;
      if (this.search && this.search.trim() != "") {
        repos_fliter = this.repos.filter((t) =>
          t["name"].toString().includes(this.search)
        );
      }
      for (let i = 0, s = repos_fliter.length; i < s; i++) {
        list.push(
          <tr>
            <td>{repos_fliter[i]["name"]}</td>
            <td>{repos_fliter[i]["namespace"]}</td>
            <td title={repos_fliter[i]["tags"].join(",")}>
              {repos_fliter[i]["num_images"]}
            </td>
            <td>{repos_fliter[i]["num_download"]}</td>
            <td>{repos_fliter[i]["created_at"]}</td>
            <td>{repos_fliter[i]["updated_at"]}</td>
            <td>{repos_fliter[i]["path"]}</td>
            <td>{repos_fliter[i]["is_public"] ? "true" : "false"}</td>
          </tr>
        );
      }
    }
    return list;
  }
  async onOrgChange(v) {
    this.org = v;
    await this.getNamespaces();
    if (this.namespaces && this.namespaces.length > 0) {
      this.namespace = this.namespaces[0]["name"];
    } else {
      this.namespace = "";
    }
    //获取镜像列表
    await this.getRepos();
    // force rerender hack
    this.setState({});
  }
  async onNamespaceChange(v) {
    this.namespace = v;
    //获取镜像列表
    await this.getRepos();
    this.setState({});
  }
  async onSearch(v) {
    this.search = v;
    // force rerender hack
    this.setState({});
  }

  renderLoginUsers() {
    const list = [];
    if (
      cceLoginPreferencesStore.users &&
      cceLoginPreferencesStore.users.length > 0
    ) {
      for (let i = 0, s = cceLoginPreferencesStore.users.length; i < s; i++) {
        list.push(
          <option value={i}>
            {cceLoginPreferencesStore.users[i].username}
          </option>
        );
      }
    }
    return list;
  }

  async onUserChange(v) {
    this.userIndex = v;
    //登录获取token
    await this.login();
    //获取机构
    await this.getOrgs();
    if (!this.org || this.org.trim() == "") {
      if (this.orgs && this.orgs.length > 0) {
        this.org = this.orgs[0];
        await this.getNamespaces();
        if (this.namespaces && this.namespaces.length > 0) {
          this.namespace = this.namespaces[0]["name"];
        } else {
          this.namespace = "";
        }
      }
    }
    //获取镜像列表
    await this.getRepos();
    // force rerender hack
    this.setState({});
  }

  render() {
    if (!this.isSettingCompeleted()) {
      return <h5>not Compeleted cce login settings</h5>;
    }
    return (
      <div className="repos_container">
        <table width={"100%"}>
          <tr>
            <td>Users:</td>
            <td>
              <select
                value={this.userIndex}
                onChange={(e) => this.onUserChange(e.target.value)}
              >
                {this.renderLoginUsers()}
              </select>
            </td>
            <td>Org:</td>
            <td>
              <select
                value={this.org}
                onChange={(e) => this.onOrgChange(e.target.value)}
              >
                {this.renderOrgDropDowns()}
              </select>
            </td>
            <td>Namespace:</td>
            <td>
              <select
                value={this.namespace}
                onChange={(e) => this.onNamespaceChange(e.target.value)}
              >
                {this.renderNamespaceDropDowns()}
              </select>
            </td>
            <td>Search:</td>
            <td>
              <input
                type="text"
                value={this.search}
                onChange={(e) => this.onSearch(e.target.value)}
              />
            </td>
            <td>
              <Button
                onClick={() => {
                  //导出 镜像列表
                  this.exportImageToXlsx();
                }}
              >
                Export All Images
              </Button>
            </td>
            <td>
              <Button
                onClick={() => {
                  //导出 镜像版本列表
                  this.exportImageTagToXlsx();
                }}
              >
                Export All Image tags
              </Button>
            </td>
            
          </tr>
        </table>
        <div className="repos_list">
          <table width={"100%"} className="repos-table">
            <tr>
              <th>name</th>
              <th>namespace</th>
              <th>image nums</th>
              <th>downloaded nums</th>
              <th>created time</th>
              <th>latest updated time</th>
              <th>image path</th>
              <th>is public</th>
            </tr>
            {this.renderRepos()}
          </table>
        </div>
      </div>
    );
  }

  async exportImageToXlsx() {
    console.log("exportImageToXlsx");

    let repos: object[] = [];

    for (let i = 0, s = cceLoginPreferencesStore.users.length; i < s; i++) {
      const user = cceLoginPreferencesStore.users[i];

      //获取登录token
      const tokens: string[] = await this.getTokens(user);

      const orgs: string[] = await this.getOrgsByUser(user, tokens);
      if (orgs) {
        for (let j = 0, t = orgs.length; j < t; j++) {
          const result = await this.getReposByUserAndOrg(user, orgs[j], tokens);
          repos = repos.concat(
            result.map((u) => {
              return {
                name: u["name"],
                namespace: u["namespace"],
                num_images: u["num_images"],
                num_download: u["num_download"],
                created_at: u["created_at"],
                updated_at: u["updated_at"],
                path: u["path"],
              };
            })
          );
        }
      }
    }

    const obj: { [key: string]: boolean } = {};
    repos = repos.reduce<object[]>((item, next) => {
      if (!obj[next["namespace"] + "." + next["name"]]) {
        item.push(next);
        obj[next["namespace"] + "." + next["name"]] = true;
      }
      return item;
    }, []);

    /*
    const ws = Excel.utils.json_to_sheet(repos);

    const wb = Excel.utils.book_new();

    Excel.utils.book_append_sheet(wb, ws, "repos");

    Excel.writeFile(wb, "repos.xlsx");
    */
    const schema = [
      {
        column: "Name",
        type: String,
        value: (s) => s["name"],
      },
      {
        column: "Namespace",
        type: String,
        value: (s) => s["namespace"],
      },
      {
        column: "Num of images",
        type: Number,
        value: (s) => s["num_images"],
      },
      {
        column: "Num of downloaded",
        type: Number,
        value: (s) => s["num_download"],
      },
      {
        column: "Path",
        type: String,
        value: (s) => s["path"],
      },
      {
        column: "Create Time",
        type: Date,
        format: 'yyyy-mm-dd',
        value: (s) => new Date(s["created_at"]),
      },
      {
        column: "Updated Time",
        type: Date,
        format: 'yyyy-mm-dd',
        value: (s) => new Date(s["updated_at"]),
      },
    ];
    await writeXlsxFile(repos, {
      schema,
      fileName: "repos.xlsx",
    });
  }

  async exportImageTagToXlsx() {
    console.log("exportImageTagToXlsx");

    let repos: object[] = [];

    for (let i = 0, s = cceLoginPreferencesStore.users.length; i < s; i++) {
      const user = cceLoginPreferencesStore.users[i];

      //获取登录token
      const tokens: string[] = await this.getTokens(user);

      const orgs: string[] = await this.getOrgsByUser(user, tokens);
      if (orgs) {
        for (let j = 0, t = orgs.length; j < t; j++) {
          const result = await this.getReposByUserAndOrg(user, orgs[j], tokens);
          repos = repos.concat(
            result.flatMap((u) => {
              return u["tags"].map((tag)=>{
                  return {
                    name: u["name"],
                    namespace: u["namespace"],
                    tag: tag,
                    path: u["path"]+":"+tag,
                  };
              })
            })
          );
        }
      }
    }

    const obj: { [key: string]: boolean } = {};
    repos = repos.reduce<object[]>((item, next) => {
      if (!obj[next["namespace"] + "." + next["name"]+ "." + next["tag"]]) {
        item.push(next);
        obj[next["namespace"] + "." + next["name"]+ "." + next["tag"]] = true;
      }
      return item;
    }, []);

    /*
    const ws = Excel.utils.json_to_sheet(repos);

    const wb = Excel.utils.book_new();

    Excel.utils.book_append_sheet(wb, ws, "repos");

    Excel.writeFile(wb, "repos.xlsx");
    */
    const schema = [
      {
        column: "Name",
        type: String,
        value: (s) => s["name"],
      },
      {
        column: "Namespace",
        type: String,
        value: (s) => s["namespace"],
      },
      
      {
        column: "Tag",
        type: String,
        value: (s) => s["tag"],
      },
      {
        column: "Path",
        type: String,
        value: (s) => s["path"],
      }
    ];
    await writeXlsxFile(repos, {
      schema,
      fileName: "repos_tags.xlsx",
    });
  }
  //获取用户组织机构列表
  async getOrgsByUser(user: any, tokens: string[]): Promise<string[]> {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const headersList = {
      Accept: "*/*",
      Authorization: "bearer " + tokens[1],
      "Content-Type": " application/json;charset=utf-8",
    };

    const response = await fetch(
      user["url"] + "/auth/realms/CCE/protocol/openid-connect/userinfo",
      {
        method: "GET",
        headers: headersList,
        agent,
      }
    );

    const data = await response.json();
    return data["org_admin"];
  }
  //获取tokens
  async getTokens(user: any): Promise<string[]> {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const headersList = {
      Accept: "*/*",
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const bodyContent =
      "client_id=cce-client&response_type=code&grant_type=password&username=" +
      encodeURI(user["username"]) +
      "&password=" +
      encodeURI(user["password"]) +
      "&scope=openid";

    const response = await fetch(
      user["url"] + "/auth/realms/CCE/protocol/openid-connect/token",
      {
        method: "POST",
        body: bodyContent,
        headers: headersList,
        agent,
      }
    );

    const login_response = await response.json();

    return [login_response["id_token"], login_response["access_token"]];
  }

  async getReposByUserAndOrg(
    user: any,
    org: string,
    tokens: string[]
  ): Promise<object[]> {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const headersList = {
      Accept: "*/*",
      Authorization: "bearer " + tokens[0],
      Organization: org,
    };

    const response = await fetch(
      user["url"] + "/v2/manage/repos?filter=center::self",
      {
        method: "GET",
        headers: headersList,
        agent,
      }
    );

    const data = await response.json();

    return data["data"];
  }
}

export function HuaweiCCESwrImagesIcon(props: Renderer.Component.IconProps) {
  return (
    <Renderer.Component.Icon
      {...props}
      material="security"
      tooltip="HuaweiCCESwrImages"
    />
  );
}
