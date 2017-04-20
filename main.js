'use strict'

const electron = require('electron')
const {app, Menu, Tray, globalShortcut} = require('electron')
const clipboard = electron.clipboard
const path = require('path')
const ipcMain = electron.ipcMain

const orthos = require('../../greek/orthos');
const BaseURL = 'http://localhost'

const BrowserWindow = electron.BrowserWindow

// Module to control application life.
// const app = electron.app
// Module to create native browser window.

let tray = null
app.on('ready', () => {
    // tray = new Tray('../Examples/electron-api-demos/assets/img/about.png')
    tray = new Tray('./lib/book.png')
    const contextMenu = Menu.buildFromTemplate([
        // {label: 'about', type: 'radio', click() { console.log('item 1 clicked') } },
        // {label: 'help', type: 'radio'},
        // {label: '-------', type: 'radio', checked: true},
        // {label: 'quit', type: 'radio', click() { win = null, app.quit() } },
        {label: 'about', click: function() { selectWindow('about') }},
        {label: 'help', click: function() { selectWindow('help') }},
        {label: '--------'},
        {label: 'quit, cmd+q', accelerator: 'CmdOrCtrl+Q', click: function() { app.quit();}}
    ])
    tray.setToolTip('Morpheus Greekv.0.3 "Antrax" ')
    tray.setContextMenu(contextMenu)

    // listenSelection()
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow(msg) {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 800, height: 600, frame: false})
    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html`)
    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
    mainWindow.setAlwaysOnTop(true)

    mainWindow.webContents.on('did-finish-load', function() {
        mainWindow.webContents.send('ping', msg)
    })

    const ses = mainWindow.webContents.session

    let cvalue = { name: 'position' }
    let x = 1206
    let y = 10
    ses.cookies.get(cvalue, function(error, cookies) {
        if (!cookies.length) return
        try {
            let pos = cookies[0].value
            let position = JSON.parse(pos)
            // console.log('P', position)
            x = position[0]
            y = position[1]
            // console.log('GET CO', x, y)
            mainWindow.setPosition(x, y)
        }
        catch(e) {
        }
    })

    let xypos, size
    mainWindow.on('move', getPosAndSize)
    mainWindow.on('resize', getPosAndSize)

    function getPosAndSize() {
        xypos = mainWindow.getPosition()
        size = mainWindow.getSize()
    }

    mainWindow.on('close', function () {
        let value = JSON.stringify(xypos.concat(size))
        // console.log('V', value)
        setCookie(ses, value, 'position')
    })


    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow)
app.on('ready', listenSelection)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
      app.quit()
  }
})

app.on('ready', () => {
    // Register a 'CommandOrControl+Y' shortcut listener.
    globalShortcut.register('CommandOrControl+H', () => {
        selectWindow('help')
    })
    globalShortcut.register('CommandOrControl+A', () => {
        selectWindow('about')
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
    // console.log('HIDE!', arg);
    mainWindow.hide()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function listenSelection() {
    let oldstr;
    setInterval(function(){
        let str = clipboard.readText()
        if (!str) return
        str = cleanGreek(str.trim())
        if (!str || str == oldstr) return
        oldstr = str
        // num:
        // let num = str.split('|')[1]
        // str = str.split('|')[0]
        str = orthos.toComb(str);
        let num
        if (!num) num = 0 // FIXME: найти длиннейшее слово
        if (!str) str = 'KUKUKU'
        // let sent = punctuation(str)
        let sent = {sentence: str, punct: "!"}
        sent.num = num
        let msg = JSON.stringify(sent)

        selectWindow(msg)
        // if (!mainWindow) {
        //     createWindow(msg)
        // }
        // else {
        //     mainWindow.show()
        //     mainWindow.focus()
        //     mainWindow.webContents.send('ping', msg)
        // }
    }, 100);
}

function selectWindow(msg) {
    if (!mainWindow) {
        createWindow(msg)
    }
    else {
        mainWindow.show()
        mainWindow.focus()
        mainWindow.webContents.send('ping', msg)
    }
}

function setCookie(ses, data, name) {
    let expiration = new Date();
    let hour = expiration.getHours();
    hour = hour + 6;
    expiration.setHours(hour);
    ses.cookies.set({
        url: BaseURL, //the url of the cookie.
        name: name, // a name to identify it.
        value: data, // the value that you want to save
        expirationDate: expiration.getTime()
    }, function(error) {
        // console.log(error);
    });
}

// function getCookie(name, cb) {
//     let value = {
//         name: name // the request must have this format to search the cookie.
//     };
//     ses.cookies.get(value, function(error, cookies) {
//         let position = cookies[0].value
//         cb(position)
//         // console.console.log(cookies[0].value); // the value saved on the cookie
//         // let myNotification = new Notification('get cookie', {
//             // body: cb(cookies[0].value)
//         // })
//     });
// }

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
    // FIXME: добавить скобки, и в скобках abcde по кр.мере
    // return str.replace(/[^\u002E\u002C\u0021\u003B\u00B7\u0020\u0028\u0029\u005B\u005D\u007B\u007D\u002D\u002F\u1F00-\u1FFF\u0370-\u03FF\u0300-\u036F]/gi, '')
}
