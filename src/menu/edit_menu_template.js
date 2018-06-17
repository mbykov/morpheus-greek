// export const editMenuTemplate = {
//   label: "Edit",
//   submenu: [
//     { label: "Title", accelerator: "CmdOrCtrl+T", selector: "title:" },
//     { label: "Help", accelerator: "CmdOrCtrl+H", selector: "help:" },
//     { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
//     { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
//     { type: "separator" },
//     { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
//     { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
//     { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
//     { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
//   ]
// };

export const editMenuTemplate = (win) => {
  return {
      label: "Sections",
      submenu: [
        { label: "Title", click ()  { win.webContents.send('section', 'title') } },
        { label: "Main", click ()  { win.webContents.send('section', 'main') } },
        { label: "Help", click ()  { win.webContents.send('section', 'help') } }
      ]
  }
};
