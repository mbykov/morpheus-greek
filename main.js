'use strict'

const electron = require('electron')
const {app, Menu, Tray} = require('electron')
const clipboard = electron.clipboard
const path = require('path')
const ipcMain = electron.ipcMain
// const session = electron.session
// const ses = session.fromPartition('persist:name')

const orthos = require('../../greek/orthos');

const BrowserWindow = electron.BrowserWindow

// Module to control application life.
// const app = electron.app
// Module to create native browser window.

let tray = null
app.on('ready', () => {
    // tray = new Tray('../Examples/electron-api-demos/assets/img/about.png')
    tray = new Tray('./lib/book.png')
    const contextMenu = Menu.buildFromTemplate([
        {label: 'about', type: 'radio', click() { console.log('item 1 clicked') } },
        {label: 'help', type: 'radio'},
        {label: '-------', type: 'radio', checked: true},
        {label: 'quit', type: 'radio', click() { win = null, app.quit() } },
        {label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: function() { app.quit();}}
    ])
    tray.setToolTip('This is my application.')
    tray.setContextMenu(contextMenu)

    // tray.on('click', function handleClicked () { // работает, но не нужно
    //     console.log('Tray clicked');
    // })

    // let win = new BrowserWindow({width: 800, height: 600, show: false})
    // let url = path.join('file:\/\/', __dirname, '/main.html')
    // win.loadURL(url)
    // console.log('LOAD URL', url)

    listenSelection()
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow(msg) {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 800, height: 600})

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html`)

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    mainWindow.setAlwaysOnTop(true)

    mainWindow.webContents.on('did-finish-load', function() {
        mainWindow.webContents.send('ping', msg)
    })

    mainWindow.on('close', function () {
        // let value = JSON.stringify(xypos.concat(size))
        // setCookie(value, 'position')
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

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
  }
})

ipcMain.on('sync', (event, arg) => {
    console.log('HIDE!', arg);
    mainWindow.hide()
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function listenSelection() {
    let oldstr = '';
    setInterval(function(){
        let str = clipboard.readText()
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

        // let url = path.join('file:\/\/', __dirname, '/main.html')
        // win.loadURL(url)
        // console.log('LOAD URL', url)
        if (!mainWindow) {
            createWindow(msg)
        }
        else {
            mainWindow.show()
            mainWindow.focus()
            mainWindow.webContents.send('ping', msg)
        }

        // if (!win) {
        //     win = new BrowserWindow({ width: 700, height: 500, frame: false})
        //     let xypos = 0;
        //     let size = 0;
        //     win.on('move', getPosAndSize)
        //     win.on('resize', getPosAndSize)
        //     function getPosAndSize() {
        //         xypos = win.getPosition()
        //         size = win.getSize()
        //     }
        //     win.on('close', function (win) {
        //         let value = JSON.stringify(xypos.concat(size))
        //         setCookie(value, 'position')
        //     })

        //     win.on('closed', function () {
        //         win = null
        //     })

        //     win.loadURL(winPath)

        //     let name = 'position'
        //     let cvalue = {
        //         name: name // the request must have this format to search the cookie.
        //     }
        //     let x = 1206;
        //     let y = 10;
        //     ses.cookies.get(cvalue, function(error, cookies) {
        //         let pos = cookies[0].value
        //         let position = JSON.parse(pos)
        //         x = position[0]
        //         y = position[1]
        //         win.setPosition(x, y)
        //     });

        //     win.webContents.openDevTools()
        //     win.show()
        //     win.focus()

        //     win.setAlwaysOnTop(true)
        //     win.webContents.on('did-finish-load', function() {
        //         win.webContents.send('ping', msg)
        //     })
        // } else {
        //     win.webContents.send('ping', msg)
        //     win.focus()
        // }
    }, 100);
}

// function setPosition() {
//     let xypos, size
//     mainWindow.on('move', xypos = mainWindow.getPosition())
//     mainWindow.on('resize', size = mainWindow.getSize())
// }

// function getPosAndSize() {
//     let xypos = mainWindow.getPosition()
//     let size = mainWindow.getSize()
//     return {xypos: xypos, size: size}
// }


function setCookie(data, name) {
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
        /*console.log(error);*/
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
