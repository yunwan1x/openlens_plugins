import React from "react";
import SideBar from "./SideBar.js";
import Body from "./Body.js";

export default function MiddleArea({ collapsed, setCollapsed, structure, currentPath, setCurrentPath, openFile, reload, rename, selection, setSelection, labels, loading, enabledFeatures,viewFile }) {
  return (
    <div className='FileManager-MiddleArea'>
      <SideBar
        labels={labels} loading={loading} structure={structure}
        currentPath={currentPath} setCurrentPath={setCurrentPath}
        collapsed={collapsed} setCollapsed={setCollapsed} enabledFeatures={enabledFeatures}
      />
      <Body
        structure={structure} rename={rename}
        currentPath={currentPath} setCurrentPath={setCurrentPath}
        openFile={openFile} reload={reload} labels={labels} loading={loading}
        selection={selection} setSelection={setSelection} enabledFeatures={enabledFeatures}
        viewFile={viewFile}
      />
    </div>
  );
}
