import { Main } from "@k8slens/extensions";
import { ipcMain, dialog, webContents } from "electron";
import log from "electron-log";
import { sternPreferenceStore } from "./src/multi-logs/preference/stern-preference/stern-preference-store";
import { cceLoginPreferencesStore } from "./src/huawei-cce-swr/preference/preference-store";

/**
 * Main.LensExtension api allows you to access, configure, and customize Lens data add
 * custom application menu items, and generally run custom code in Lens'
 * main process.
 *
 * See more details: <https://docs.k8slens.dev/>
 */
export default class IntegrationExtension extends Main.LensExtension {
  /**
   * onActivate is called when your extension has been successfully enabled.
   */
  onActivate() {
    // !! Note that the console statements in MainExtension is NOT visible in the
    // !! DevTools console in Lens
    // To see console statements, start the Lens app from a Terminal
    console.log("lens-multi-pod-logs main | activating...");
    sternPreferenceStore.loadExtension(this);
    console.log("lens-multi-pod-logs main | activated");

    console.log("PodFileManagerExtension main | activating...");
    ipcMain.handle("open-directory-dialog", async function (event, p) {
      const result = await dialog.showOpenDialog({
        properties: [p],
        title: "Please select folder to download",
        buttonLabel: "Select",
      });

      return result;
    });

    console.log("PodFileManagerExtension main | activated");

    //添加华为云cce swr插件
    console.log("huawei-cce-swr main | activating...");
    cceLoginPreferencesStore.loadExtension(this);
    console.log("huawei-cce-swr main | activated");
  }
}

