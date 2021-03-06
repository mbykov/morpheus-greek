//

import "./stylesheets/app.css";
import "./stylesheets/main.css";
import Split from 'split.js'

import "./helpers/context_menu.js";
import { initDBs, checkVersion, readCfg, writeCfg, recreateDBs } from "./helpers/databases.js";
import { getPos, getMorphs, rDict, rMorph, rTrns } from "./helpers/results.js";

// import { antrax, enableDBs } from '../../antrax'
import { antrax, enableDBs } from 'antrax'

import _ from "lodash";
import { remote } from "electron";
import {shell} from 'electron'
import sband from "./helpers/clean-greek";
import { ipcRenderer } from "electron";
import { q, qs, empty, create, span, p, div, enclitic } from './helpers/utils'

// import {comb, plain, accents as ac} from '../../orthos'
import {comb, plain, accents as ac} from 'orthos'

let fse = require('fs-extra')
const log = console.log

const Mousetrap = require('mousetrap')
const axios = require('axios')
const path = require('path')

const mustache = require('mustache')

const clipboard = require('electron-clipboard-extended')

let hterms = {}
let hstate = -1
let hstates = []

// const isDev = require('electron-is-dev')
// const isDev = false
const isDev = true
const app = remote.app;
const apath = app.getAppPath()
let upath = app.getPath("userData")

initDBs()
checkVersion()
enableDBs(upath)

let split
let splitSizes = [60, 40]

showSection('title')

ipcRenderer.on('version', function (event, oldver) {
  axios.get('https://api.github.com/repos/mbykov/morpheus-greek/releases/latest')
    .then(function (response) {
      if (!response || !response.data) return
      let newver = response.data.name
      if (oldver && newver && newver > oldver) {
        let over = q("#new-version")
        let verTxt = ['new version available:', newver].join(' ')
        over.textContent = verTxt
      }
      // antraxVersion(oldver.aversion)
    })
    .catch(function (error) {
      console.log('API ERR', error)
    })
})



ipcRenderer.on('section', function (event, name) {
  if (name == 'dicts') showDicts()
  else if (name == 'cleanup') showCleanup()
  else if (name == 'install') showInstall()
  else showSection(name)
})

function orthoPars(pars) {
  pars.forEach(spans => {
    spans.forEach(spn => {
      if (spn.gr) spn.text = comb(spn.text)
    })
  })
}

function showSection(name) {
  let oapp = q('#app')
  let secpath = path.resolve(apath, 'src/sections', [name, 'html'].join('.'))
  const section = fse.readFileSync(secpath)
  oapp.innerHTML = section
}

clipboard
  .on('text-changed', () => {
    let txt = clipboard.readText()
    let pars = sband('gr', txt)
    if (!pars || !pars.length) return
    orthoPars(pars)
    hstates.push(pars)
    hstate = hstates.length-1
    showText(hstates[hstate])
  })
  .startWatching()

function twoPages(splitSizes) {
  split = Split(['#text', '#results'], {
    sizes: splitSizes,
    gutterSize: 5,
    cursor: 'col-resize',
    minSize: [0, 0]
    })
}


function showText (pars) {
  if (!pars) return
  showSection('main')
  let oprg = q('#progress')
  oprg.style.display = "inline-block"

  twoPages(splitSizes)

  let otext = q('#text')
  empty(otext)

  let wfs = []
  pars.forEach(spans => {
    let opar = p()
    opar.classList.add('greek')
    spans.forEach(spn => {
      let ospan = span(spn.text)
      if (spn.gr) ospan.classList.add('greek'), wfs.push(spn.text)
      if (spn.text == ' ') ospan.classList.add('space')
      opar.appendChild(ospan)
    })
    otext.appendChild(opar)
  })

  let grs = qs('span.greek')
  if (grs.length == 1) showResults(grs[0].textContent)
  oprg.style.display = "none"
}

function showResults(query) {
  let ores = q('#results')
  empty(ores)

  query = enclitic(query)
  query = cleanStr(query)

  antrax(query)
    .then(chains => {
      if (!chains || !chains.length) showNoRes()
      chains = _.sortBy(chains, chain => {
        let weight
        let penult = chain[chain.length-2]
        if (!penult) return 1000
        if (penult.weight) weight = penult.weight
        else if (penult && penult.dicts) weight = penult.dicts[0].weight
        else weight = 1000
        return weight
      })
      chains.forEach(chain => {
        let owf
        if (_.isArray(chain)) owf = showWF(chain)
        else owf = showTerm(chain)
        ores.appendChild(owf)
      })
    })
}

function showNoRes() {
  let nores = span('no result')
  let ores = q('#results')
  ores.appendChild(nores)
}

function showWF(chain) {
  let fls = _.last(chain).flexes
  let segs = chain.slice(0, -1)

  let owf = div()
  if (chain.length > 2) {
    let oscheme = drawScheme(chain)
    owf.appendChild(oscheme)
  }

  segs.forEach((seg, idx) => {
    if (!seg.dicts) return // bad dictionaries !!
    let dicts = _.sortBy(seg.dicts, 'weight')

    dicts.forEach(dict => {
      let oddiv = div()
      let odict = rDict(dict)
      oddiv.appendChild(odict)
      if (idx > segs.length - 2) {
        let morphs = getMorphs(dict, fls)
        let oMorph = rMorph(morphs)
        oddiv.appendChild(oMorph)
      }
      let otrns = rTrns(dict)
      oddiv.appendChild(otrns)
      owf.appendChild(oddiv)
    })
  })
  return owf
}

function drawScheme(chain) {
  let oscheme = div()
  if (chain.length == 3) oscheme.classList.add('scheme-green')
  else oscheme.classList.add('scheme-red')

  let segs = chain.map(seg => { return seg.seg} )
  let osegs = []
  chain.forEach((seg, idx) => {
    let oseg = span(seg.seg)
    oseg.classList.add('segment')
    let odef = span(' - ')
    osegs.push(oseg)
    if (idx < chain.length -2) osegs.push(odef)
  })
  // osegs.pop()

  osegs.forEach(oseg => {
    oscheme.appendChild(oseg)
  })
  return oscheme
}

// ἡ αὐτή βάλανος τοῦ ταὐτοῦ βάθος
function showTerm(dict) {
  if (!dict) return
  // dict.pref - only as a first part of a wordform:
  if (dict.pref) return
  let odiv = div()
  let odict = rDict(dict)
  odiv.appendChild(odict)

  if (dict.morphs) {
    let morphs = getMorphs(dict, dict.morphs)
    let oMorph = rMorph(morphs)
    odiv.appendChild(oMorph)
  }

  let otrns = rTrns(dict)
  odiv.appendChild(otrns)
  return odiv
}

const historyMode = event => {
  const checkArrow = element => {
    // if (!element.classList.contains("arrow")) return
    if (element.id === "new-version") {
      // log('NEW VERS CLICKED')
    }
    if (element.id === "arrow-left") {
      if (hstate - 1 > -1) hstate--
      showText(hstates[hstate])
    } else if (element.id === "arrow-right") {
      if (hstate + 1 < hstates.length) hstate++
      showText(hstates[hstate])
    }
  };
  checkArrow(event.target);
};

const checkGreek = event => {
  if (event.shiftKey) return
  const checkDomElement = element => {
    if (element.nodeName !== "SPAN") return
    if (element.classList.contains("greek")) {
      let query = element.textContent
      if (!query) return
      showResults(query)
    }
  }
  checkDomElement(event.target);
}

document.addEventListener("mouseover", checkGreek, false)
document.addEventListener("click", historyMode, false)

Mousetrap.bind(['command+p', 'ctrl+p'], function() {
  let el = q('span.greek:hover')
  if (!el) return
  let query = el.textContent
  let href1 = 'http://www.perseus.tufts.edu/hopper/morph?l='
  let href2 = '&la=greek#lexicon'
  let href = [href1, query, href2].join('')
  shell.openExternal(href)
  return false
})

Mousetrap.bind(['alt+left', 'alt+right'], function(ev) {
  if (ev.which == 37 && hstate - 1 > -1) hstate--
  if (ev.which == 39 && hstate + 1 < hstates.length) hstate++
  showText(hstates[hstate])
  return false
})

// 1-49, 2-50
Mousetrap.bind(['1', '2'], function(ev) {
  let sizes = split.getSizes()
  if (sizes[0] == 60 && ev.which == 49) {
    splitSizes = [90, 0]
  } else if (sizes[0] == 60 && ev.which == 50) {
    splitSizes = [0, 90]
  } else if (sizes[0] != 60) {
    splitSizes = [60, 40]
  }
  split.setSizes(splitSizes)
  return false
})

function showDicts() {
  showSection('dicts')
  let cfg = readCfg()
  let hiddens = ['flex', 'specs']
  let mins = _.filter(cfg, db => { return !hiddens.includes(db.name)})
  let obj = {dbs: mins}

  const tablePath = path.resolve(apath, 'src/sections/dictTable.mustache')
  const tmpl = fse.readFileSync(tablePath).toString()
  let html = mustache.render(tmpl, obj);

  let otbody = q('#tbody')
  otbody.innerHTML = html
  let rows = qs('.active-dict')
  rows.forEach(row => {
    let cf = _.find(cfg, db => { return db.name == row.name })
    if (!cf) return
    row.checked = (cf.active) ? true : false
  })

  let oorder = q('#order')
  otbody.addEventListener("click", activeCfg, false)
  oorder.addEventListener("click", reorderCfg, false)
}

function reorderCfg(ev) {
  let cfg = readCfg()
  let clicked = _.find(cfg, db => { return db.name == ev.target.id })
  if (!clicked) return
  cfg = cfg.filter(db => db.name !== ev.target.id)
  cfg.unshift(clicked)
  cfg.forEach((cf, idx) => { cf.idx = idx })
  writeCfg(cfg)
  showDicts()
}

function activeCfg(ev) {
  if (ev.target.type != 'checkbox') return
  let cfg = readCfg()
  let clicked = _.find(cfg, db => { return db.name == ev.target.name })
  if (!clicked) return
  let chk = ev.target.checked
  clicked.active = (chk) ? true : false

// погасить галочку
  let row = ev.target.parentNode.parentNode
  let img = row.getElementsByTagName('img')[0]
  // if (chk) img.style.display = 'block'
  // else img.style.display = 'none'

  writeCfg(cfg)
  showDicts()
}

function showCleanup() {
  showSection('cleanup')
  let ocleanup = q('#cleanup')
  ocleanup.addEventListener("click", cleanupDBs, false)
}

function cleanupDBs() {
  recreateDBs()
  checkVersion()
  enableDBs(upath)
  showSection('title')
}

function showInstall() {
  showSection('install')
  let oinputfile = q('#inputfile')

  oinputfile.onchange = function(ev) {
    let fileList = oinputfile.files
    let fname = fileList[0].name
    let fpath = fileList[0].path
    let ofn = q('#filename')
    ofn.textContent = fname
    ofn.setAttribute('fpath', fpath)
  }
  let oinstall = q('#dbinstall')
  oinstall.addEventListener("click", installDB, false)
}

function installDB() {
  let ofn = q('#filename')
  let fpath = ofn.getAttribute('fpath')
  // addDB(fpath)
  ofn.textContent = 'done'
  // showDicts()
}

function cleanStr(str) {
  str = str.replace(/·/, '')
  return str
}
