import { app, BrowserWindow } from "electron";

export const aboutMenuTemplate = {
  label: "About",
  submenu: [
    { label: "About", click: () => { BrowserWindow.getFocusedWindow().webContents.send('section', 'about') } },
    { label: "Authintic", click: () => { BrowserWindow.getFocusedWindow().webContents.send('section', 'authentic') } },
    { label: "Code", click: () => { BrowserWindow.getFocusedWindow().webContents.send('section', 'code') } },
    { label: "Contacts", click: () => { BrowserWindow.getFocusedWindow().webContents.send('section', 'contacts') } },
    { label: "Acknowledgements", click: () => { BrowserWindow.getFocusedWindow().webContents.send('section', 'acknowledgements') } },
    { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
  ]
};
