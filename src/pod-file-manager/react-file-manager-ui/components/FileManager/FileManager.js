import React, { useEffect, useState } from "react";
import TopBar from "./TopBar.js";
import Footer from "./Footer.js";
import MiddleArea from "./MiddleArea.js";
import "./FileManager.css";

const defaultLabels = {
  'fileSingle': 'file',
  'fileMultiple': 'files',
  'folderSingle': 'folder',
  'folderMultiple': 'folders',
  'root': '/',
  'home': 'Home',
  'up': 'Up',
  'reload': 'Reload',
  'upload': 'Upload',
  'download': 'Download',
  'delete': 'Delete',
  'rename': 'Rename',
  'createDirectory': 'Create directory'
};

export default function FileManager({ width,height, getList, createDirectory, deletePaths, openFile, uploadFiles, rename, translations, features,viewFile }) {

  const [collapsed, setCollapsed] = useState({});
  const [structure, setStructure] = useState({});
  const [currentPath, setCurrentPath] = useState('');
  const [lastPath, setLastPath] = useState('');
  const [selection, setSelection] = useState([]);
  const [loading, setLoading] = useState(false);

  const labels = translations || defaultLabels;

  const enabledFeatures = features || [];
  if (!features) {
    if (createDirectory) {
      enabledFeatures.push('createDirectory');
    }
    if (deletePaths) {
      enabledFeatures.push('deletePaths');
    }
    if (uploadFiles) {
      enabledFeatures.push('uploadFiles');
    }
    if (rename) {
      enabledFeatures.push('rename');
    }
  }

  const reload = async () => {
    setLoading(true);
    const updated = {};
    const notChanged = {};
    try {
      const paths = Object.keys(structure).filter(path => {
        if (currentPath.indexOf(path) === 0 || path.indexOf(currentPath) === 0) {
          return true;
        } else {
          notChanged[path] = structure[path];
          return false;
        }
      });
      if (paths.indexOf(currentPath) === -1) {
        paths.push(currentPath);
      }
      await Promise.all(paths.map(path => {
        const promise = load(path);
        promise.then(list => {
          if (list !== undefined) {
            updated[path] = list;
            if (path === currentPath) {
              setLastPath(currentPath);
            }
          }
        }).catch(console.error);
        return promise;
      }));
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setCurrentPath(lastPath);
    }
    const processed = { ...notChanged, ...updated };
    const ordered = {};
    Object.keys(processed).sort((a, b) => {
      if (a > b) {
        return 1;
      }
      if (a < b) {
        return -1;
      }
      return 0;
    }).forEach(path => {
      ordered[path] = processed[path];
    });
    setStructure(ordered);
  };

  const load = async (path) => {
    try {
      const response = await getList(path,setCurrentPath);
      return response.map(item => {
         return { name: item.name, type: (item.type === 1 ? 1 : 2) ,size:item.size} ;
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    reload();
    setSelection([]);
  }, [currentPath]);

  return (
    <div className={'FileManager' + (loading ? ' FileManager-Loading' : '')} style={{ width:width ||'200vh', height: height || '100vh' }}>
      <TopBar
        currentPath={currentPath} setCurrentPath={setCurrentPath} createDirectory={createDirectory}
        uploadFiles={uploadFiles} labels={labels} loading={loading} reload={reload} enabledFeatures={enabledFeatures}
      />
      <MiddleArea
        collapsed={collapsed} setCollapsed={setCollapsed}
        structure={structure} setStructure={setStructure}
        currentPath={currentPath} setCurrentPath={setCurrentPath}
        openFile={openFile} reload={reload}
        selection={selection} setSelection={setSelection}
        uploadFiles={uploadFiles} enabledFeatures={enabledFeatures}
        labels={labels} loading={loading} rename={rename}
        viewFile={viewFile}
      />
      <Footer structure={structure} setStructure={setStructure} currentPath={currentPath} selection={selection}
              enabledFeatures={enabledFeatures} labels={labels} loading={loading} deletePaths={deletePaths}
              reload={reload} rename={rename}/>
    </div>
  );
}
