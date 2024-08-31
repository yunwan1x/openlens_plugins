import React from "react";
import { FaRegFile, FaRegFolder } from "react-icons/fa";



export default function Body({ structure, reload, currentPath, setCurrentPath, openFile, selection, setSelection, rename, enabledFeatures,viewFile }) {
  const list = structure[currentPath] || [];

  const isTextFile=(filename)=>{
    return /\.(js|jsx|ts|tsx|mjs|txt|json|html|md|go|sql|mod|sum|java|rs|c|h|log|out|rb|php|ini|properties|xml|yaml|yml|conf|cfg|bat|sh|lua|bat|cmd|pl|py|c|cpp|h|hpp|cs|vb|vbs|asm|s|asmx|sln|csproj|vbproj|sln|user|sln|sln.dotsettings|sln.dotsettings|sln.dotsettings|sln.dotsettings|sln.dotsettings|sln.dotsettings|sln.dotsettings|sl)$/.test(filename);
  }
  const onRename = () => {
    rename(selection[0]).then(reload).catch(error => error && console.error(error));
  };
  /*
  return (
    <div className={'FileManager-Body'} onClick={event => {
      event.stopPropagation();
      event.preventDefault();
      setSelection([]);
    }}>
      {!!list && <>
        {list.map((item, index) => {
          const path = currentPath + '/' + item.name;
          const selected = selection.indexOf(path) !== -1;
          return <div
            key={index}
            className={'Body-Item' + (selected ? ' Item-Selected' : '')}
            onClick={event => {
              event.stopPropagation();
              event.preventDefault();
              setSelection([path]);
            }}
            onDoubleClick={event => {
              event.stopPropagation();
              event.preventDefault();
              setSelection([]);
              if (item.type === 1) {
                openFile(path);
              } else {
                setCurrentPath(path);
              }
            }}>
              <span>
            <div className='Body-Item-Icon'>
              {item.type === 1 ? <FaRegFile/> : <FaRegFolder/>}
            </div>
            <div className="Body-Item-Name" title={item.name} onClick={() => {
              const range = window.getSelection();
              if (selection[0] === path && enabledFeatures.indexOf('rename') !== -1 && !range.toString().length) {
                onRename();
              }
            }}>
              {item.name}
            </div>
            </span>
          </div>
        })}
      </>}
    </div>
    
  );*/

  return (
    <div className={'FileManager-Body'} onClick={event => {
      event.stopPropagation();
      event.preventDefault();
      setSelection([]);
    }}>
      <table style={{"width":"100%","border":"1px solid"}}>
        <tr><th>filename</th><th>size</th><th>operation</th></tr>
      {!!list && <>
        {list.map((item, index) => {
          const path = (currentPath + '/' + item.name).replace("//","/");
          const selected = selection.indexOf(path) !== -1;
          return <tr onClick={event => {
            event.stopPropagation();
            event.preventDefault();
            setSelection([path]);
          }}
          onDoubleClick={event => {
            event.stopPropagation();
            event.preventDefault();
            setSelection([]);
            if (item.type === 1) {
              openFile(path.replace("//","/"));
            } else {
              setCurrentPath(path.replace("//","/"));
            }
          }}
            key={index}
            className={'Body-Item' + (selected ? ' Item-Selected' : '')}
            >
              <td align="left" >
              <span>
            <div className='Body-Item-Icon'>
              {item.type === 1 ? <FaRegFile/> : <FaRegFolder/>}
            </div>
            <div className="Body-Item-Name" title={item.name} onClick={() => {
              const range = window.getSelection();
              if (selection[0] === path && enabledFeatures.indexOf('rename') !== -1 && !range.toString().length) {
                onRename();
              }
            }}>
              {item.name}
            </div>
            
            </span>
            </td>

            <td align="right">
            {item.size}
            </td>
            <td align="center">
              {isTextFile(item.name)? <div  onClick={event => {
              event.stopPropagation();
              event.preventDefault();
              console.log(item.name)
              //查看文件
              viewFile(path)
            }}>view</div> : <></>}
            </td>
          </tr>
        })}
      </>}
      </table>
    </div>
    
  );
}
