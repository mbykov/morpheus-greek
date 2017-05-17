'use strict'

const electron = require('electron')
const {app, Menu, Tray, globalShortcut, nativeImage} = require('electron')
const clipboard = electron.clipboard
const path = require('path')
const ipcMain = electron.ipcMain
const windowStateKeeper = require('electron-window-state');
const log = require('electron-log');
const {autoUpdater} = require("electron-updater");

const orthos = require('orthos');
const BaseURL = 'http://localhost'

const BrowserWindow = electron.BrowserWindow

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// Module to control application life.
// const app = electron.app
// Module to create native browser window.

// let tray = null
app.on('ready', () => {
    let platform = require('os').platform()
    let ipath
    if (platform == 'darwin') {
        ipath = path.join(__dirname, 'build/icon.png')
    }
    else if (platform == 'win32') {
        ipath = 'build/icon.ico';
    } else {
        ipath = 'build/128x128.png';
    }
    let nimage = nativeImage.createFromPath(ipath)

    let tray = new Tray(ipath)
    const contextMenu = Menu.buildFromTemplate([
        {label: 'about', click: function() { selectWindow('about') }},
        {label: 'todo', click: function() { console.log('todo') }},
        {label: 'help', click: function() { selectWindow('help') }},
        {label: 'volunteers', click: function() { selectWindow('vol') }},
        {label: '--------'},
        {label: 'quit, cmd+q', accelerator: 'CmdOrCtrl+Q', click: function() { app.quit();}}
    ])
    tray.setToolTip('Morpheus Greek v.0.3 "Antrax" ')
    tray.setContextMenu(contextMenu)
    // if (platform == "darwin") {
    //     tray.setPressedImage(nimage)
    // }
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null
let timerId = null

function sendStatusToWindow(text) {
    log.info(text);
    mainWindow.webContents.send('message', text);
}

function createWindow(msg) {
    // Create the browser window.
    let mainWindowState = windowStateKeeper({
        defaultWidth: 800,
        defaultHeight: 600
    })

    mainWindow = new BrowserWindow({  //width: 800, height: 600, frame: false})
        'x': mainWindowState.x,
        'y': mainWindowState.y,
        'width': mainWindowState.width,
        'height': mainWindowState.height,
        icon: 'build/icon.png',
        frame: false})

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html`)
    // Open the DevTools.
    mainWindow.webContents.openDevTools()
    mainWindow.setAlwaysOnTop(true)

    mainWindow.webContents.on('did-finish-load', function() {
        mainWindow.webContents.send('ping', msg)
    })

    mainWindowState.manage(mainWindow)

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        clearInterval(timerId)
        // tray = null
        timerId = null
        mainWindow = null
    })
}

autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
})
autoUpdater.on('update-available', (ev, info) => {
    log.info('Update available.');
})
autoUpdater.on('update-not-available', (ev, info) => {
    log.info('Update not available.');
})
autoUpdater.on('error', (ev, err) => {
    log.info('Error in auto-updater.');
})
autoUpdater.on('update-downloaded', (ev, info) => {
    log.info('Update downloaded; will install in 5 seconds');
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
      app.quit()
  }
})

app.on('ready', () => {

    let oldstr
    timerId = setInterval(function(){
        let str = clipboard.readText()
        if (!str) return
        str = cleanGreek(str.trim())
        if (!str || str == oldstr) return
        oldstr = str

        str = orthos.toComb(str);
        let sent = {sentence: str, punct: "!", num: 0}
        let msg = JSON.stringify(sent)

        selectWindow(sent)

    }, 100);

    globalShortcut.register('CommandOrControl+Shift+Q', () => {
        app.exit(0)
    })
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
  }
})

ipcMain.on('sync', (event, arg) => {
    // event.preventDefault()
    mainWindow.hide()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function selectWindow(msg) {
    if (mainWindow === null) {
        createWindow(msg)
    }
    else {
        mainWindow.show()
        mainWindow.focus()
        mainWindow.webContents.send('ping', msg)
    }
}

// punctuation \u002E\u002C\u0021\u003B\u00B7\u0020\u0027 - ... middle dot, space, apostrophe
// parens ()[]{-/
// \u0028\u0029\u005B\u005D\u007B\u007D\u002D\u002F
// greek 0370-03FF 1F00–1FFF
// diactitic 0300-036F
function cleanGreek(str) {
    let greek = str.replace(/[^\u002E\u002C\u0021\u003B\u00B7\u0020\u0027\u1F00-\u1FFF\u0370-\u03FF\u0300-\u036F]/gi, '')
    greek = greek.trim().replace(/^\d+/, '').replace(/^\./, '').trim()
    if (!/[\u1F00-\u1FFF\u0370-\u03FF\u0300-\u036F]/.test(greek[0])) return
    return greek
}

// FIXME: добавить скобки, и в скобках abcde по кр.мере
// return str.replace(/[^\u002E\u002C\u0021\u003B\u00B7\u0020\u0028\u0029\u005B\u005D\u007B\u007D\u002D\u002F\u1F00-\u1FFF\u0370-\u03FF\u0300-\u036F]/gi, '')


//-------------------------------------------------------------------
// Auto updates
//
// For details about these events, see the Wiki:
// https://github.com/electron-userland/electron-builder/wiki/Auto-Update#events
//
// The app doesn't need to listen to any events except `update-downloaded`
//
// Uncomment any of the below events to listen for them.  Also,
// look in the previous section to see them being used.
//-------------------------------------------------------------------
// autoUpdater.on('checking-for-update', () => {
// })
// autoUpdater.on('update-available', (ev, info) => {
// })
// autoUpdater.on('update-not-available', (ev, info) => {
// })
// autoUpdater.on('error', (ev, err) => {
// })
// autoUpdater.on('download-progress', (ev, progressObj) => {
// })

autoUpdater.on('update-downloaded', (ev, info) => {
  // Wait 5 seconds, then quit and install
  // In your application, you don't need to wait 5 seconds.
  // You could call autoUpdater.quitAndInstall(); immediately
  setTimeout(function() {
    autoUpdater.quitAndInstall();
  }, 5000)
})

app.on('ready', function()  {
  autoUpdater.checkForUpdates();
});
