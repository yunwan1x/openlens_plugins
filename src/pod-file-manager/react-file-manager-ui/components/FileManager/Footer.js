import React, { useRef ,useState}  from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function Footer({
  structure,
  setStructure,
  currentPath,
  selection,
  deletePaths,
  reload,
  rename,
  labels,
  enabledFeatures,
}) {
  const list = structure[currentPath] || [];
  const files = list.filter((item) => item.type === 1).length;
  const folders = list.filter((item) => item.type === 2).length;
  const folderLabel =
    folders > 1 ? labels["folderMultiple"] : labels["folderSingle"];
  const fileLabel = files > 1 ? labels["fileMultiple"] : labels["fileSingle"];

  //是否显示改名输入框
  const [showNewNameInput, setShowNewNameInput] = useState(false);
  //改新文件名
  const [newName, setNewName] = useState("");

  const onDeletePath = () => {
    deletePaths(selection)
      .then(() => {
        setStructure({});
        reload();
      })
      .catch((error) => error && console.error(error));
  };

  const onRename = () => {
    if (!newName || newName == "") {
      if (!showNewNameInput) {
        setShowNewNameInput(true);
      } else {
        alert("Please input new  name");
      }
    } else {
      rename(selection[0], newName)
        .then(reload)
        .catch((error) => error && console.error(error));
      setShowNewNameInput(false);
      setNewName("");
    }
  };

  return (
    <div className="FileManager-Footer">
      <div className="Footer-Left">
        {folders} {folderLabel} and {files} {fileLabel}
      </div>
      <div className="Footer-Right">
        {selection.length === 1 && enabledFeatures.indexOf("rename") !== -1 && (
          <>
            <button
              className="Icon-Button"
              type="button"
              onClick={() => onRename()}
              title={labels["rename"]}
            >
              <FaEdit />
            </button>
            <input
              type="text"
              hidden={!showNewNameInput}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </>
        )}
        {!!selection.length &&
          enabledFeatures.indexOf("deletePaths") !== -1 && (
            <button
              className="Icon-Button"
              type="button"
              onClick={() => onDeletePath()}
              title={labels["delete"]}
            >
              <FaTrash />
            </button>
          )}
      </div>
    </div>
  );
}
