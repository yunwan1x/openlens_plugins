import React from "react";
import { Renderer } from "@k8slens/extensions";

const {
  Component: { Button },
} = Renderer;

//导出所有helm
import { exportAllHelm } from "./export-all-helm";
import { observable } from "mobx";
import { observer } from "mobx-react";

@observer
export class ExportAllHelmButton extends React.Component {
  @observable private loading = false;
  async onClick() {
    this.loading=true
    this.setState({})
    await exportAllHelm();
    this.loading = false;
    this.setState({})
  }
  render() {
    return (
      <Button
        className="export-helm-release-button"
        tooltip="Export Helm Release"
        onClick={this.onClick.bind(this)}
        disabled={this.loading}
      >
        Export All Helm Release {this.loading ? "(Exporting...)" : ""}
      </Button>
    );
  }
}
