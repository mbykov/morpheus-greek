import { app, BrowserWindow } from "electron";

export const dictMenuTemplate = {
  label: "Dictionaries",
  submenu: [
    { label: "Active", click: () => { BrowserWindow.getFocusedWindow().webContents.send('section', 'dicts') } },
    // { label: "Install", click: () => { BrowserWindow.getFocusedWindow().webContents.send('section', 'install') } },
    { label: "Cleanup", click: () => { BrowserWindow.getFocusedWindow().webContents.send('section', 'cleanup') } }
  ]
};
