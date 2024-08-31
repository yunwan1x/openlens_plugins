import React from "react";
import { Renderer, Common } from "@k8slens/extensions";
//自定义窗口样式
import "./pod-file-view-dialog.scss";

import { viewFileDialogState } from "./pod-file-manager-dialog";

const {
  Component: {
    MenuItem,
    Icon,
    SubMenu,
    StatusBrick,
    Dialog,
    Wizard,
    WizardStep,
    Button,
  },
  Catalog: { CatalogEntityRegistry },
} = Renderer;
const { Util, App } = Common;
import { makeObservable, computed, observable, runInAction } from "mobx";
import { observer } from "mobx-react";
import type { IComputedValue, IObservableValue } from "mobx";
import { execFile, exec } from "child_process";
import { ipcRenderer } from "electron";
import path from "path";
export interface PodFileViewDialogProps {
  isDialogOpen: IComputedValue<boolean>;
}

@observer
export class PodFileViewDialog extends React.Component<PodFileViewDialogProps> {
  constructor(props: PodFileViewDialogProps) {
    super(props);
    //接收变量的变化
    makeObservable(this);
  }

  //关闭菜单
  close() {
    viewFileDialogState.filecontent.set("");
    viewFileDialogState.isOpen.set(false);
  }

  render() {
    const { isDialogOpen, ...dialogProps } = this.props;
    const header = (
      <span>
        Pod File Manager( {viewFileDialogState.filepath.get()})
        <Button
          plain
          onClick={() => {
            viewFileDialogState.isOpen.set(false);
          }}
        >
          Close
        </Button>
      </span>
    );

    return (
      <Dialog
        {...dialogProps}
        className="PodFileViewDialog"
        isOpen={this.props.isDialogOpen.get()}
        close={this.close}
      >
        <Wizard header={header} done={this.close}>
          <WizardStep
            disabledNext={true}
            customButtons={
              <div className="buttons flex gaps align-center justify-space-between">
                <Button
                  plain
                  onClick={() => {
                    viewFileDialogState.isOpen.set(false);
                  }}
                >
                  Close
                </Button>
              </div>
            }
          >
            <pre>{viewFileDialogState.filecontent.get()}</pre>
          </WizardStep>
        </Wizard>
      </Dialog>
    );
  }
}
