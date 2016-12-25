// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const path = require('path')
const BrowserWindow = require('electron').remote.BrowserWindow
const electron = require('electron').remote
const clipboard = electron.clipboard
const session = electron.session
const ses = session.fromPartition('persist:name')
const BaseURL = 'http://localhost'
const orthos = require('../../greek/orthos');

// const newWindowBtn = document.getElementById('new-window')
// newWindowBtn.addEventListener('click', function (event) {})

const winPath = path.join('file:\/\/', __dirname, 'index.html')
let win;
// win = new BrowserWindow({ width: 700, height: 500 })


// οὐ μὴν οὐδὲ βαρβάρους εἴρηκε
function listenSelection(win) {
    let oldstr = '';
    setInterval(function(){
        let str = clipboard.readText()
        str = cleanGreek(str)
        if (!str || str == oldstr) return
        oldstr = str
        // num:
        // let num = str.split('|')[1]
        // str = str.split('|')[0]
        str = orthos.toComb(str);
        let num
        if (!num) num = 0 // FIXME: найти длиннейшее слово
        if (!str) str = 'KUKUKU'
        let sent = punctuation(str)
        sent.num = num
        let msg = JSON.stringify(sent)

        if (!win) {
            win = new BrowserWindow({ width: 700, height: 500})
            let xypos = 0;
            let size = 0;
            win.on('move', updateReply)
            win.on('resize', updateReply)
            function updateReply() {
                xypos = win.getPosition()
                size = win.getSize()
            }
            win.on('close', function (win) {
                // let position = win.getPosition()
                // let size = win.getSize()
                let value = JSON.stringify(xypos.concat(size))
                // new Notification('set cookie', {
                    // body: value
                // })
                setCookie(value, 'position')
            })
            win.on('closed', function () {
                win = null
            })
            win.loadURL(winPath)

            let name = 'position'
            let cvalue = {
                name: name // the request must have this format to search the cookie.
            }
            let x = 1206;
            let y = 10;
            ses.cookies.get(cvalue, function(error, cookies) {
                let pos = cookies[0].value
                let position = JSON.parse(pos)
                x = position[0]
                y = position[1]
                win.setPosition(x, y)
            });

            // οὐ μὴν οὐδὲ βαρβάρους εἴρηκε
            win.webContents.openDevTools()

            win.show()
            // . οὐ μὴν οὐδὲ βαρβάρους εἴρηκε
            //

            win.setAlwaysOnTop(true)
            win.webContents.on('did-finish-load', function() {
                win.webContents.send('ping', msg)
            })
        } else {
            win.webContents.send('ping', msg)
        }
    }, 100);
}


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

function getCookie(name, cb) {
    let value = {
        name: name // the request must have this format to search the cookie.
    };
    ses.cookies.get(value, function(error, cookies) {
        let position = cookies[0].value
        cb(position)
        // console.console.log(cookies[0].value); // the value saved on the cookie
        // let myNotification = new Notification('get cookie', {
            // body: cb(cookies[0].value)
        // })
    });
}


// punctuation \u002E\u002C\u0021\u003B\u00B7\u0020\u0027 - ... middle dot, space, apostrophe
// parens ()[]{-/
// \u0028\u0029\u005B\u005D\u007B\u007D\u002D\u002F
// greek 0370-03FF 1F00–1FFF
// diactitic 0300-036F
function cleanGreek(str) {
    let greek = str.replace(/[^\u002E\u002C\u0021\u003B\u00B7\u0020\u0027\u1F00-\u1FFF\u0370-\u03FF\u0300-\u036F]/gi, '')
    if (!/[\u1F00-\u1FFF\u0370-\u03FF\u0300-\u036F]/.test(greek[0])) return
    return greek
    // FIXME: добавить скобки, и в скобках abcde по кр.мере
    // return str.replace(/[^\u002E\u002C\u0021\u003B\u00B7\u0020\u0028\u0029\u005B\u005D\u007B\u007D\u002D\u002F\u1F00-\u1FFF\u0370-\u03FF\u0300-\u036F]/gi, '')
}

function punctuation(str) {
    if (!str) str = 'NOSTRBLAH'
    let sentence = str.split(/[\u002E\u002C\u0021\u003B\u00B7]/)[0]
    let tail = str.split(sentence)[1]
    let punct = null
    if (tail) punct = tail[0]
    return {sentence: sentence, punct: punct}
}


// δηλοῖ δέ μοι καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ ἤκιστα.

// win.on('close', function () { win = null })
// win.loadURL(winPath)
// win.webContents.openDevTools()
// win.show()



// win.webContents.on('did-finish-load', function() {
//     win.webContents.send('ping', 'whoooooooh!')
//     listenSelection(win)
// })

listenSelection()


/* δηλοῖ δέ μοι καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ ἤκιστα. πρὸ γὰρ τῶν Τρωικῶν οὐδὲν φαίνεται πρότερον κοινῇ ἐργασαμένη ἡ Ἑλλάς. δοκεῖ δέ μοι, οὐδὲ τοὄνομα τοῦτο ξύμπασά πω εἶχεν, ἀλλὰ τὰ μὲν πρὸ Ἕλληνος τοῦ Δευκαλίωνος καὶ πάνυ οὐδὲ εἶναι ἡ ἐπίκλησις αὕτη. κατὰ ἔθνη δὲ ἄλλα τε καὶ τὸ Πελασγικὸν ἐπὶ πλεῖστον ἀφ' ἑαυτῶν τὴν ἐπωνυμίαν παρέχεσθαι. Ἕλληνος δὲ καὶ τῶν παίδων αὐτοῦ ἐν τῇ Φθιῶτιδι ἰσχυσάντων, καὶ ἐπαγομένων αὐτοὺς ἐπ' ὠφελίᾳ ἐς τὰς ἄλλας πόλεις, καθ' ἑκάστους μὲν ἤδη τῇ ὁμιλίᾳ μᾶλλον καλεῖσθαι Ἕλληνας. οὐ μέντοι πολλοῦ γε χρόνου ἐδύνατο καὶ ἅπασιν ἐκνικῆσαι. τεκμηριοῖ δὲ μάλιστα Ὅμερος πολλῷ γὰρ ὕστερον ἔτι καὶ τῶν Τρωικῶν γενόμενος οὐδαμοῦ οὕτω τοὺς ξύμπαντας ὠνόμασεν οὐδ' ἄλλους ἢ τοὺς μετὰ Ἀχιλλέως ἐκ τῆς Φθιώτιδος. οἵπερ καὶ πρῶτοι Ἕλληνες ἧσαν, Δαναοὺς δὲ ἐν τοῖς ἔπεσι καὶ Ἀργείους καὶ Ἀχαιοὺς ἀνακαλεῖ. οὐ μὴν οὐδὲ βαρβάρους εἴρηκε διὰ τὸ μηδὲ Ἕλληνάς πω, ὡς ἐμοὶ δοκεῖ. ἀντίπαλον ἐς ἓν ὄνομα ἀποκεκρίσθαι. οἱ δ' οὖν ὡς ἕκαστοι Ἕλληνες κατὰ πόλεις τε ὅσοι ἀλλήλων ξυνίεσαν καὶ ξύμπαντες ὕστερον κληθέντες οὐδὲν πρὸ τῶν Τρωικῶν δι' ἀσθένειαν καὶ ἀμειξίαν ἀλλήλων ἁθρόοι ἔπραξαν. ἀλλὰ καὶ ταύτην τὴν στρατείαν θαλάσσῃ ἤδη πλείω χρώμενοι ξυνῆλθον.

*/



// console.log('RENDERER!')

// require('electron').remote.ipcRenderer.on('ping', (event, message) => {
//     const result = document.getElementById('antrax-result')
//     result.textContent = message;
//     console.log('R', message)
//     // alert('R', message)
// })
