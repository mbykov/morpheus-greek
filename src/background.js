// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from "path";
import url from "url";
import { app, Menu, globalShortcut, net } from "electron";
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

let mainWindow

const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

if (shouldQuit) {
  app.quit()
}

app.on("ready", () => {

  mainWindow = createWindow("main", {
    width: 1000,
    height: 600
  });

  setApplicationMenu(mainWindow);

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

  mainWindow.webContents.on('did-finish-load', () => {
    let pckg = require('../package.json')
    let name = pckg.name
    let version = pckg.version
    let aversion = pckg.dependencies.antrax.replace('^', '')
    mainWindow.webContents.send('version', {version: version, aversion: aversion})
    mainWindow.setTitle([name, 'v.', version].join(' '))
  })

});

app.on("window-all-closed", () => {
  app.quit();
});
