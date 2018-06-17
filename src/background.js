// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from "path";
import url from "url";
import { app, Menu, globalShortcut } from "electron";
import { devMenuTemplate } from "./menu/dev_menu_template";
// import { editMenuTemplate } from "./menu/edit_menu_template";
import { aboutMenuTemplate } from "./menu/about_menu_template";
import { dictMenuTemplate } from "./menu/dict_menu_template";
import { helpMenuTemplate } from "./menu/help_menu_template";
import createWindow from "./helpers/window";

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from "env";

let log = console.log

const setApplicationMenu = (win) => {
  const menus = [devMenuTemplate, aboutMenuTemplate, dictMenuTemplate, helpMenuTemplate];
  if (env.name !== "production") {
    // menus.push(devMenuTemplate);
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== "production") {
  const userDataPath = app.getPath("userData");
  app.setPath("userData", `${userDataPath} (${env.name})`);
}

app.on("ready", () => {
  // setApplicationMenu();

  const mainWindow = createWindow("main", {
    width: 1000,
    height: 600
  });

  setApplicationMenu(mainWindow);

  // mainWindow.webPreferences.webSecurity = false
  // mainWindow.webPreferences.nodeIntegration = false
  // mainWindow.eval = global.eval = function () {
    // throw new Error(`Sorry, this app does not support window.eval().`)
  // }

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "app.html"),
      protocol: "file:",
      slashes: true
    })
  );

  if (env.name === "development") {
    mainWindow.openDevTools();
  }

  // ipcMain.on('cfg', function(event, newcfg) {
    // log('CFG', newcfg)
  // })

  // globalShortcut.register('CommandOrControl+H', () => {
  //   mainWindow.webContents.send('section', 'help')
  // })

  // log('=================== kuku')
});

app.on("window-all-closed", () => {
  app.quit();
});
