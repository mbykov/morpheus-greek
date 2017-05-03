//
// console.log('INSIDE HTML')

// let antrax = document.getElementById('antrax-result')
const antrax = require('./antrax')
const _ = require('underscore')
const Events = require('component-events')
const classes = require('component-classes')
const Tree = require('./tree')
const {ipcRenderer} = require('electron')
const shell = require('electron').shell
const util = require('util');
const fs = require('fs');

function log() { }
// function log() { console.log.apply(console, arguments); }
// function p() { console.log(util.inspect(arguments, false, null)) }

let words

require('electron').ipcRenderer.on('ping', (event, obj) => {
    let oRes = document.getElementById('antrax-result')

    // let obj = JSON.parse(json)
    antrax.query(obj.sentence, obj.num, function(_words) {
        words = _words
        drawHeader(words, obj.num)
        drawMorphs(words, obj.num)
    })
})

function drawHeader(words, num) {
    log('HEADER', words, num)
    let oHeader = q('#antrax-header')
    empty(oHeader)
    words.forEach(function(word, i) {
        let form = word.raw
        let span = sa(form)
        // let id = ['id_', idx].join('')
        span.idx = i
        // span.setAttribute('idx') = idx
        let space = cret(' ')
        oHeader.appendChild(span)
        oHeader.appendChild(space)
        classes(span).add('antrax-form')
        if (i == num) classes(span).add('antrax-current')
    })
    bindHeaderEvents(oHeader)
}

function bindHeaderEvents(el) {
    let ve = window.event
    let events = Events(el, {
        current: function(e){
            let el = e.target
            log('CLICK', e.target.textContent)
            let old = q('#antrax-header span.antrax-current')
            classes(old).remove('antrax-current')
            classes(el).add('antrax-current')
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

// , Ion. and Ep. -ίη, ἡ, - , ἡ, Ion. and Ep. -ίη,
// , Ion. -ίη [ῑ], ἡ, - , ἡ, Ion. -ίη [ῑ],

// надо бы target-ом считать art, независимо, кто current: // второе - pronouns
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
    log('draw CURRENT', cur)
    cur.dicts.forEach(function(d) {
        if (!d.weight) d.weight = 0
    })

    let dicts = _.sortBy(cur.dicts, 'weight')
    dicts.forEach(function(dict) {
        console.log('DICT BEFORE SHOW', dict)
        // if (!dict.trn) dict.trn = '!!! no trn !!!' // FIXME:
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
    log('PART:', cur)
    let oDict = creDict()

    let mstr = compactNameMorph(cur)
    // log('NAME MSTR', mstr)
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
    // log('SHOW NAME', cur)
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
    // log('gmorphs', gmorphs)
    // log('SIZE m', _.keys(gmorphs), 'g', _.keys(ggends))
    let morphs = []
    if (_.keys(gmorphs).length <= _.keys(ggends).length) {
        for (let numcase in gmorphs) {
            let gends = gmorphs[numcase].map(function(gm) { return gm.gend})
            gends = _.uniq(gends).sort()
            // log('GENDS', gends)
            let str = gends.join('-')
            // let morph = [JSON.stringify(gends), numcase].join('.')
            let morph = [str, numcase].join(': ')
            // log('MORPH', morph)
            morphs.push(morph)
        }
    } else {
        for (let gend in ggends) {
            let numcases = ggends[gend].map(function(gg) { return gg.numcase})
            numcases = _.uniq(numcases).sort()
            numcases = removeVoc(numcases)
            // log('NUMCASES', numcases)
            let str = numcases.join('-')
            // let morph = [gend, JSON.stringify(numcases)].join('.')
            let morph = [gend, str].join(': ')
            morphs.push(morph)
        }
    }
    mstr = morphs.join(', ')
    return mstr
}

function creDict() {
    let oDict = cre('div')
    classes(oDict).add('antrax-dict')
    let parent = q('#antrax-dicts')
    parent.appendChild(oDict)
    return oDict
}

// καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ
// λέγω
function showVerbs(verbs) {
    verbs.forEach(function(verb) {
        showVerb(verb)
    })
}

function showVerb(cur) {
    // log('SHOW VERB', cur)
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
    // log('SHOW INF', cur)
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
        // if (morph.split('.')[0] == 'du') return
        cleans.push(morph)
    })
    return cleans
}


function emptyDict() {
    let uns = qs('.underlined')
    uns.forEach(function(el) {
        classes(el).remove('underlined')
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
        classes(el).add('underlined')
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
    // } else if (e.ctrlKey) {
        // console.log('CK', e.which)
    } else if (e.ctrlKey && e.which === 72) { // help
        showHelp(e)
    } else if (e.ctrlKey && e.which === 65) { // about
        e.preventDefault()
        // e.stopPropagation()
        let fpath = './lib/about.html'
        let html = fs.readFileSync(fpath,'utf8').trim();
        let parent = q('#antrax-dicts')
        parent.innerHTML = html
        bindHelpEvents(parent)
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
    log('OPEN')
    let el = q('.antrax-current')
    if (!el) return
    let text = el.textContent
    text = text.replace(/[\u002E\u002C\u0021\u003B\u00B7\u0020\u0027]/, '')
    let url
    if (key == 80) url = ['http:\/\/www.perseus.tufts.edu/hopper/morph?l=', text, '&la=greek#Perseus:text:1999.04.0058:entry=nohto/s-contents'].join('')
    else if (key == 76) url = ['http://www.lexigram.gr/lex/arch/', text, '&selR=1#Hist1'].join('')
    log('OPEN URL', url)
    shell.openExternal(url)
}

function showHelp(e) {
    e.preventDefault()
    e.stopPropagation()
    let fpath = './lib/help.html'
    let html = fs.readFileSync(fpath,'utf8').trim();
    let parent = q('#antrax-dicts')
    parent.innerHTML = html
}

function bindHelpEvents(el) {
    // let ve = window.event
    let events = Events(el, {
        diglossa: function(e){
            // let el = e.target
            console.log('CLICK', e.target.textContent)
            let url = e.target.textContent
            shell.openExternal(url)
            // let old = q('#antrax-header span.antrax-current')
            // classes(old).remove('antrax-current')
            // classes(el).add('antrax-current')
        }
    })
    events.bind('click .link', 'diglossa')
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
    classes(el).remove('antrax-current')
    classes(nextEl).add('antrax-current')
    drawMorphs(words, next)
}

let x = q('#antrax-close')
x.onclick = function() {
    closeAll()
}

let quest = q('#antrax-help')
quest.onclick = function(e) {
    log('show quest')
    showHelp(e)
}
