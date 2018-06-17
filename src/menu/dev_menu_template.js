import { app, BrowserWindow } from "electron";

export const devMenuTemplate = {
  label: "Morpheus",
  submenu: [
    {
      label: "Home",
      accelerator: "CmdOrCtrl+R",
      click: () => {
        BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache();
      }
    },
    {
      label: "Quit",
      accelerator: "CmdOrCtrl+Q",
      click: () => {
        app.quit();
      }
    }
  ]
};
