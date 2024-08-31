import React from "react";
import { Renderer, Common } from "@k8slens/extensions";
//自定义窗口样式
import "./pod-file-manager-dialog.scss";
import "process"
import { dialogState } from "./pod-file-manager-menu";

type Pod = Renderer.K8sApi.Pod;

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
import FileManager from "./react-file-manager-ui/components/FileManager/FileManager.js";
import "./react-file-manager-ui/index.css";
import { ipcRenderer } from "electron";
import path from "path";

export const viewFileDialogState = observable.object({
  //是否打开文件管理弹出
  isOpen: observable.box(false),
  filepath: observable.box(""),
  filecontent: observable.box(""),
});

export interface PodFileManagerDialogProps {
  isDialogOpen: IComputedValue<boolean>;
}

@observer
export class PodFileManagerDialog extends React.Component<PodFileManagerDialogProps> {
  constructor(props: PodFileManagerDialogProps) {
    super(props);
    //接收变量的变化
    makeObservable(this);
  }

  //关闭菜单
  close() {
    dialogState.isOpen.set(false);
  }

  render() {
    const { isDialogOpen, ...dialogProps } = this.props;

    const kubeconfigPath = new CatalogEntityRegistry().activeEntity.spec
      .kubeconfigPath;
    //console.log(App.Preferences.getKubectlPath());
    const kubectlPath = App.Preferences.getKubectlPath() || "kubectl";
    /*
    const paths = {
      "": [
        { name: "New folder 1", type: 2 },
        { name: "New folder 2", type: 2 },
        { name: "New folder 3", type: 2 },
        { name: "file.txt", type: 1 },
      ],
      "/New folder 1": [
        { name: "New folder 2", type: 2 },
        { name: "file 2.txt", type: 1 },
      ],
      "/New folder 2": [{ name: "file 5.txt", type: 1 }],
      "/New folder 3": [{ name: "file 6.txt", type: 1 }],
      "/New folder 1/New folder 2": [{ name: "New folder 3", type: 2 }],
      "/New folder 1/New folder 2/New folder 3": [
        { name: "New folder 4", type: 2 },
      ],
      "/New folder 1/New folder 2/New folder 3/New folder 4": [],
    };
    */

    const getList = (spath, setCurrentPath) => {
      console.log("getList:" + spath.trim());
      return new Promise((resolve, reject) => {
        //setTimeout(() => (paths[path] ? resolve(paths[path]) : reject()), 100);

        let dir = spath.trim().replace("//", "/");
        if (!dir || dir == "") {
          dir = dialogState.init_path.get().trim().replace("//", "/");
          if (!dir || dir == "") {
            dir = "/";
          }
          if (dir != "/") {
            setCurrentPath(dir);
            resolve([]);
          }
        }

        execFile(
          kubectlPath,
          [
            "--kubeconfig",
            kubeconfigPath,
            "exec",
            "-n",
            dialogState.namespace.get(),
            "-c",
            dialogState.container.get(),
            dialogState.pod.get(),
            "--",
            "sh",
            "-c",
            "ls -lh --full-time -s -A --group-directories-first " + dir,
          ],
          {},
          (error, stdout, stderr) => {
            if (error) {
              resolve([]);
              console.log(stderr);
              alert(stderr);
            } else {
              //console.log(stdout)
              const fileList = [];
              stdout
                .trim()
                .split("\n")
                .forEach((line) => {
                  line = line.trim();
                  if (!line.startsWith("total")) {
                    const tokens = line.match(/\S+/g);
                    const file = { type: 1, name: "", size: "" };
                    if (tokens[1].startsWith("d")) {
                      file.type = 2;
                    } else {
                      file.type = 1;
                    }
                    file.name = tokens[9];
                    file.size = tokens[5];
                    fileList.push(file);
                  }
                });
              resolve(fileList);
            }
          }
        );
      });
    };

    const createDirectory = async (spath, new_folder_name) => {
      console.log("createDirectory:" + spath);

      console.log(new_folder_name);
      const result: any = await new Promise((resolve) =>
        execFile(
          kubectlPath,
          [
            "--kubeconfig",
            kubeconfigPath,
            "exec",
            "-n",
            dialogState.namespace.get(),
            "-c",
            dialogState.container.get(),
            dialogState.pod.get(),
            "--",
            "sh",
            "-c",
            "mkdir -p " + new_folder_name,
          ],
          {},
          (error, stdout, stderr) => {
            resolve({ error, stderr });
          }
        )
      );
      if (result.error) {
        alert(result.stderr);
      }
    };

    const deletePaths = async (paths) => {
      console.log("deletePaths:" + paths);
      const result: any = await new Promise((resolve) =>
        execFile(
          kubectlPath,
          [
            "--kubeconfig",
            kubeconfigPath,
            "exec",
            "-n",
            dialogState.namespace.get(),
            "-c",
            dialogState.container.get(),
            dialogState.pod.get(),
            "--",
            "sh",
            "-c",
            "rm -rf " + paths,
          ],
          {},
          (error, stdout, stderr) => {
            resolve({ error, stderr });
          }
        )
      );
      if (result.error) {
        alert(result.stderr);
      }
    };
    //双击下载文件
    const openFile = async (spath) => {
      if (!spath || spath == "undefined") {
        return;
      }
      console.log("openFile " + spath);

      //弹框选择下载目录
      const result = await ipcRenderer.invoke(
        "open-directory-dialog",
        "openDirectory"
      );
      //取消选择
      if (result.canceled) {
        return;
      }
      if (!result.filePaths) {
        return;
      }
      if (result.filePaths.length == 0) {
        return;
      }
      const files = result.filePaths[0];
      console.log(files);
      if (!files) {
        return;
      }

      //使用kubectl命令下载文件
      exec(
        kubectlPath +
          " --kubeconfig " +
          kubeconfigPath +
          " exec " +
          " -n " +
          dialogState.namespace.get() +
          " -c " +
          dialogState.container.get() +
          " " +
          dialogState.pod.get() +
          " -- " +
          " cat " +
          spath +
          " > " +
          files +
          "/" +
          path.basename(spath),
        {},
        (error, stdout, stderr) => {
          if (error) {
            alert(stderr);
          } else {
            alert("downloaded");
          }
        }
      );
    };

    const rename = async (spath, newName) => {
      if (!newName || newName == "" || newName == "undefined") {
        return;
      }
      console.log("rename:", spath, newName);
      const result: any = await new Promise((resolve) =>
        execFile(
          kubectlPath,
          [
            "--kubeconfig",
            kubeconfigPath,
            "exec",
            "-n",
            dialogState.namespace.get(),
            "-c",
            dialogState.container.get(),
            dialogState.pod.get(),
            "--",
            "sh",
            "-c",
            "mv " + spath + " " + path.dirname(spath) + "/" + newName,
          ],
          {},
          (error, stdout, stderr) => {
            resolve({ error, stderr });
          }
        )
      );
      if (result.error) {
        alert(result.stderr);
      }
    };
    

    const uploadFiles = async (spath, files) => {
      console.log(spath, files);
      console.log(dialogState.container.get(),dialogState.namespace.get())
      console.log(files[0].path,dialogState.pod.get() + ":" + spath + "/" + path.basename(files[0].path))
      let srcPath=files[0].path
      if (process.platform == 'win32'){
        srcPath = "\\\\localhost\\" + files[0].path.replace(":", "$")
      }

      {
        const { stdout, stderr } = await execFile(
          kubectlPath,
          [
            "--kubeconfig",
            kubeconfigPath,
            "cp",
            "-n",
            dialogState.namespace.get(),
            "-c",
            dialogState.container.get(),
            srcPath,
            dialogState.pod.get() + ":" + spath + "/" + path.basename(files[0].path),
          ],
          {}
        );
        if (stderr) {
          console.log(stderr);
        }
      }
   
    };

    const viewFile = async (spath) => {
      console.log(spath);
      //打开查看文件窗口
      viewFileDialogState.filepath.set(spath);
      viewFileDialogState.isOpen.set(true);

      //使用kubectl命令下载文件
      exec(
        kubectlPath +
          " --kubeconfig " +
          kubeconfigPath +
          " exec " +
          " -n " +
          dialogState.namespace.get() +
          " -c " +
          dialogState.container.get() +
          " " +
          dialogState.pod.get() +
          " -- " +
          " cat " +
          spath,
        {},
        (error, stdout, stderr) => {
          if (error) {
            alert(stderr);
          } else {
            viewFileDialogState.filecontent.set(stdout);
          }
        }
      );
    };

    const header = (
      <span>
        Pod File Manager( {dialogState.pod.get()}:{dialogState.container.get()})
        <Button
          plain
          onClick={() => {
            dialogState.isOpen.set(false);
          }}
        >
          Close
        </Button>
      </span>
    );
    return (
      <Dialog
        {...dialogProps}
        className="PodFileManagerDialog"
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
                    dialogState.isOpen.set(false);
                  }}
                >
                  Close
                </Button>
              </div>
            }
          >
            <FileManager
              getList={getList}
              createDirectory={createDirectory}
              deletePaths={deletePaths}
              openFile={openFile}
              uploadFiles={uploadFiles}
              rename={rename}
              viewFile={viewFile}
              features={[
                "createDirectory",
                "uploadFiles",
                "deletePaths",
                "rename",
              ]}
              width="100%"
              height="600px"
            />
          </WizardStep>
        </Wizard>
      </Dialog>
    );
  }
}
