// Morpheus for ancient greek based on electron.js

const antrax = require('antrax')
// const antrax = require('./antrax')
const _ = require('underscore')
const Events = require('component-events')
const Tree = require('./tree')
const {ipcRenderer} = require('electron')
const shell = require('electron').shell
const util = require('util');
const fs = require('fs');
const path = require('path')


let words

ipcRenderer.on('message', function(event, text) {
    // log('Message', text)
    let parent = q('#antrax-dicts')
    let message = document.createElement('div');
    message.innerHTML = text;
    parent.appendChild(message);
})

function showMessage(str) {
    let parent = q('#antrax-dicts')
    parent.textContent = str
}

require('electron').ipcRenderer.on('init', (event, msg) => {
    antrax.init(function(msg) {
        // log('B', msg)
        if (msg == 'ready') {
            syncing()
        } else if (msg == 'loading dumps') {
            populating()
        } else {
            showMessage('somethig goes wrong')
        }
    })
})

function syncing() {
    // showMessage('syncing databases...')
    antrax.sync(function() {
        let opro = q('#progress')
        opro.classList.add('hidden')
        let obook = q('#book')
        obook.classList.remove('hidden')
        showMessage('Ready. Copy some Ancient Greek sentence: ctrl-C')
    })
}

function populating() {
    let opro = q('#progress')
    opro.classList.remove('hidden')
    showMessage('populating databases from dumps...')
    antrax.populate(function(res) {
        // log('M:', res)
        antrax.sync(function(res) {
            syncing()
        })
    })
}

require('electron').ipcRenderer.on('ping', (event, obj) => {
    if (typeof(obj) === 'string') {
        showSection(null, obj)
        return
    }
    antrax.query(obj.sentence, obj.num, function(_words) {
        let obook = q('#book')
        obook.classList.add('hidden')
        words = _words
        drawHeader(words, obj.num)
        drawMorphs(words, obj.num)
    })
})

function drawHeader(words, num) {
    let oHeader = q('#antrax-header')
    empty(oHeader)
    words.forEach(function(word, i) {
        let form = word.raw
        let span = sa(form)
        span.idx = i
        let space = cret(' ')
        oHeader.appendChild(span)
        oHeader.appendChild(space)
        span.classList.add('antrax-form')
        if (i == num) span.classList.add('antrax-current')
    })
    bindHeaderEvents(oHeader)
}

function bindHeaderEvents(el) {
    let ve = window.event
    let events = Events(el, {
        current: function(e){
            let el = e.target
            let old = q('#antrax-header span.antrax-current')
            old.classList.remove('antrax-current')
            el.classList.add('antrax-current')
            drawMorphs(words, el.idx)
        }
    })
    events.bind('click .antrax-form', 'current')
}

function drawMorphs(words, num) {
    emptyDict()
    let current = words[num]
    if (!current.dicts.length) {
        showNo()
        return
    }
    let idxs = conformNames(words, num)
    if (idxs && idxs.length) underline(idxs)
    drawCurrent(current)
}

// TODO: second cycle: pronouns
function conformNames(words, num){
    let current = words[num]
    if (!current.dicts) return
    let targets = _.select(current.dicts, function(dict) { return ['art', 'name'].includes(dict.pos)})
    if (!targets.length) return
    let target = targets[0]
    if (!target.morphs || !target.morphs.length) return
    let idxs = []
    words.forEach(function(word, idx) {
        if (!word.dicts) return
        if (word.idx == num) return
        word.dicts.forEach(function(dict) {
            target.morphs.forEach(function(tm) {
                let cnfmd = _.select(dict.morphs, function(dm) { return tm.gend == dm.gend && tm.numcase == dm.numcase})
                if (!cnfmd.length) return
                idxs.push(idx)
                if (dict.pos == 'name') dict.morphs = target.morphs
            })
        })
    })
    let res = (idxs.length) ? idxs : null
    return res
}

function drawCurrent(cur) {
    cur.dicts.forEach(function(d) {
        if (!d.weight) d.weight = 1
    })

    let dicts = _.sortBy(cur.dicts, 'weight')
    dicts.forEach(function(dict) {
        if (dict.pos == 'verb') showVerb(dict)
        else if (dict.pos == 'inf') showInf(dict)
        else if (dict.pos == 'part') showPart(dict)
        else showName(dict)
    })
}

function showNo() {
    let oDict = creDict()
    let head = 'no result. Try Ctrl-P'
    let children = []
    let data = [{text: head, id: 'no-result', children: children}]
    let tree = new Tree(oDict)
    tree.data(data)
}

function showPart(cur) {
    let oDict = creDict()

    let mstr = compactNameMorph(cur)
    let dictpos = [cur.dict, cur.pos, cur.var].join(' - ')
    if (cur.type) dictpos = [cur.type, dictpos].join(': ')
    let head = [dictpos, mstr].join('; ')
    let strs = cur.trn.split(/\||\n/)
    let children = strs.map(function(str) { return {text: str}})
    let data = [{text: head, id: 'dictpos', children: children}]

    let tree = new Tree(oDict)
    tree.data(data)
}

function showName(cur) {
    let oDict = creDict()

    let dictpos = [cur.dict, cur.pos].join(' - ')
    if (cur.type) dictpos = [cur.type, dictpos].join(': ')
    let mstr = (cur.morphs) ? compactNameMorph(cur) : null
    let head = (mstr) ? [dictpos, mstr].join('; ') : dictpos

    let strs = cur.trn.split(/\||\n/)
    let children = strs.map(function(str) { return {text: str}})
    let data = [{text: head, id: 'dictpos', children: children}]

    let tree = new Tree(oDict)
    tree.data(data)
}

function compactNameMorph(cur) {
    let mstr
    let gmorphs = _.groupBy(cur.morphs, 'numcase')
    let ggends = _.groupBy(cur.morphs, 'gend')

    let morphs = []
    if (_.keys(gmorphs).length <= _.keys(ggends).length) {
        for (let numcase in gmorphs) {
            let gends = gmorphs[numcase].map(function(gm) { return gm.gend})
            gends = _.uniq(gends).sort()
            let str = gends.join('-')
            let morph = [str, numcase].join(': ')
            morphs.push(morph)
        }
    } else {
        for (let gend in ggends) {
            let numcases = ggends[gend].map(function(gg) { return gg.numcase})
            numcases = _.uniq(numcases).sort()
            numcases = removeVoc(numcases)
            let str = numcases.join('-')
            let morph = [gend, str].join(': ')
            morphs.push(morph)
        }
    }
    mstr = morphs.join(', ')
    return mstr
}

function creDict() {
    let oDict = cre('div')
    oDict.classList.add('antrax-dict')
    let parent = q('#antrax-dicts')
    parent.appendChild(oDict)
    return oDict
}

function showVerbs(verbs) {
    verbs.forEach(function(verb) {
        showVerb(verb)
    })
}

function showVerb(cur) {
    let oDict = creDict()
    let mstrs = []
    for (let mod in cur.morphs) {
        mstrs.push([mod, cur.morphs[mod]].join(': '))
    }
    let mstr = mstrs.join('; ')

    let dictpos = [cur.dict, cur.pos].join(' - ')
    let head = [dictpos, mstr].join('; ')
    let strs = cur.trn.split(/\||\n/)
    let children = strs.map(function(str) { return {text: str}})
    let data = [{text: head, id: 'dictpos', children: children}]

    let tree = new Tree(oDict)
    tree.data(data)
}

function compactVerbMorph(cur) {
    if (!cur.morphs.length) return ''
    let result = cur.morphs.map(function(morph) {
        return morph.numpers
    })
    return JSON.stringify(result)
}

function showInf(cur) {
    let oDict = creDict()

    let dictpos = [cur.dict, cur.pos].join(' - ')
    let head = [dictpos, cur.var].join('; ')
    let strs = cur.trn.split(/\||\n/)
    let children = strs.map(function(str) { return {text: str}})
    let data = [{text: head, id: 'dictpos', children: children}]

    let tree = new Tree(oDict)
    tree.data(data)
}

// эта хрень должна реагировать только на обращение:
function removeVoc(morphs) {
    let cleans = []
    let hasNom = false
    morphs.forEach(function(morph) {
        if (morph == 'sg.nom') hasNom = true
        if (morph == 'pl.nom') hasNom = true
        if (morph == 'du.nom') hasNom = true
    })
    if (!hasNom) return morphs
    morphs.forEach(function(morph) {
        if (morph.split('.')[1] == 'voc') return
        cleans.push(morph)
    })
    return cleans
}

function emptyDict() {
    let uns = qs('.underlined')
    uns.forEach(function(el) {
        el.classList.remove('underlined')
    })
    let odicts = q('#antrax-dicts')
    remove(odicts)
    let oDicts = cre('div')
    oDicts.id = 'antrax-dicts'
    let parent = q('#antrax-results')
    parent.appendChild(oDicts)
}

function underline(idxs) {
    let oWords = qs('#antrax-header span.antrax-form')
    idxs.forEach(function(idx) {
        let el = oWords[idx]
        el.classList.add('underlined')
    })
}



function q(sel) {
    return document.querySelector(sel);
}

function qs(sel) {
    return document.querySelectorAll(sel);
}

function cre(tag) {
    return document.createElement(tag);
}

function cret(str) {
    return document.createTextNode(str);
}

function sa(str) {
    var oSa = cre('span');
    oSa.textContent = str;
    return oSa;
}

function empty(el) {
    while (el.hasChildNodes()) {
        el.removeChild(el.lastChild);
    }
}

function remove(el) {
    el.parentElement.removeChild(el);
}

function closeAll() {
    words = null
    // window.close()
    ipcRenderer.send('sync', 'window-hide');
}

document.onkeydown = function(e) {
    if (e.shiftKey && e.which === 27) { // Esc + Shift
        ipcRenderer.send('sync', 'window-hide');
    } else if (e.ctrlKey && e.which === 80) {
        openExternal(80)
    } else if (e.ctrlKey && e.which === 76) {
        openExternal(76)
    } else if (e.which === 27) { //Esc
        closeAll()
    } else if ([37, 39].includes(e.which)) {
        moveCurrent(e)
    }
}

function openExternal(key){
    let el = q('.antrax-current')
    if (!el) return
    let text = el.textContent
    text = text.replace(/[\u002E\u002C\u0021\u003B\u00B7\u0020\u0027]/, '')
    let url
    if (key == 80) url = ['http:\/\/www.perseus.tufts.edu/hopper/morph?l=', text, '&la=greek#Perseus:text:1999.04.0058:entry=nohto/s-contents'].join('')
    else if (key == 76) url = ['http://www.lexigram.gr/lex/arch/', text, '&selR=1#Hist1'].join('')
    shell.openExternal(url)
}

function showSection(e, name) {
    if (!name) return
    if (e) {
        e.preventDefault()
        e.stopPropagation()
    }

    let obook = q('#book')
    obook.classList.add('hidden')

    let fpath = path.join(__dirname, ['lib/', name, '.html'].join(''))
    let html = fs.readFileSync(fpath,'utf8').trim();
    let odicts = q('#antrax-dicts')
    if (odicts) remove(odicts)
    odicts = cre('div')
    odicts.id = 'antrax-dicts'
    let ores = q('#antrax-results')
    ores.appendChild(odicts)

    odicts.innerHTML = html
    let menupath = path.join(__dirname, ['lib/help-menu.html'].join(''))
    let menu = fs.readFileSync(menupath,'utf8').trim();
    let omenu = cre('div')
    omenu.classList.add('help-menu')
    omenu.innerHTML = menu
    odicts.insertBefore(omenu, odicts.firstChild);
    bindSectionEvents(odicts)
}

function bindSectionEvents(el) {
    let events = Events(el, {
        link: function(ev){
            let url = ev.target.textContent
            shell.openExternal(url)
        },
        menu: function(ev){
            showSection(ev, ev.target.id)
        }
    })
    events.bind('click .link', 'link')
    events.bind('click .help-menu', 'menu')
}

function moveCurrent(e) {
    let el = q('.antrax-current')
    if (!el) return
    let idx = el.idx
    let oWords = qs('#antrax-header span.antrax-form')
    let size = oWords.length
    let dir = (e.which == 37) ? -1 : 1
    let next = idx+dir
    if (next == size) next = 0
    if (next == -1) next = size -1
    let nextEl = oWords[next]
    el.classList.remove('antrax-current')
    nextEl.classList.add('antrax-current')
    drawMorphs(words, next)
}

let x = q('#antrax-close')
x.onclick = function() {
    closeAll()
}

let qhelp = q('#antrax-help')
qhelp.onclick = function(e) {
    showSection(e, 'help')
}

// function log() { }
function log() { console.log.apply(console, arguments); }
