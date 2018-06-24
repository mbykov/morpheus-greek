//

import "./stylesheets/app.css";
import "./stylesheets/main.css";
import Split from 'split.js'

// Small helpers you might want to keep
import "./helpers/context_menu.js";
import "./helpers/external_links.js";
import { readCfg, writeCfg, recreateDBs, addCfg } from "./helpers/databases.js";
import { getPos, getMorphs, rDict, rMorph, rTrns } from "./helpers/results.js";

// import { antrax, clause } from '../../antrax/dist/antrax'
// import { enableDBs } from '../../antrax/dist/lib/pouch'
import { antrax, clause } from 'antrax/dist/antrax'
import { enableDBs } from 'antrax/dist/lib/pouch'

import _ from "lodash";
import { remote } from "electron";
import jetpack from "fs-jetpack";
import { greet } from "./hello_world/hello_world";
import env from "env";
import sband from "./helpers/clean-greek";
import { ipcRenderer } from "electron";
import { q, qs, empty, create, span, p, div } from './helpers/utils'

// const orthos = require('../../orthos')
const axios = require('axios');
const orthos = require('orthos')
const path = require('path')

const mustache = require('mustache');
// const pug = require('pug');
// import { pug } from "pug";

const app = remote.app;
const appPath = app.getAppPath()
const jetApp = jetpack.cwd(appPath)
let log = console.log

const clipboard = require('electron-clipboard-extended')

let hterms = {}
let hstate = -1
let hstates = []

let userDataPath = app.getPath("userData")
enableDBs(userDataPath, appPath)

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
      if (spn.gr) spn.text = orthos.toComb(spn.text)
    })
  })
}

function showSection(name) {
  let oapp = q('#app')
  let rpath = ['src/sections/', name].join('')
  rpath = [rpath, 'html'].join('.')
  const section = jetApp.read(rpath, "utf8");
  oapp.innerHTML = section
}

clipboard
  .on('text-changed', () => {
    let txt = clipboard.readText()
    let pars = sband('gr', txt)
    if (!pars) return
    orthoPars(pars)
    hstates.push(pars)
    hstate++
    showText(hstates[hstate])
  })
  .startWatching()

function showText (pars) {
  if (!pars) return
  showSection('main')
  let oprg = q('#progress')
  oprg.style.display = "inline-block"

  Split(['#text', '#results'], {
    sizes: [60, 40],
    gutterSize: 5,
    cursor: 'col-resize',
    minSize: [0, 0]
  })

  let otext = q('#text')
  empty(otext)

  let wfs = []
  pars.forEach(spans => {
    let opar = p()
    opar.classList.add('greek')
    spans.forEach(spn => {
      let ospan = span(spn.text)
      if (spn.gr) ospan.classList.add('greek'), wfs.push(spn.text)
      opar.appendChild(ospan)
    })
    otext.appendChild(opar)
  })

  queryTerms(_.uniq(wfs))
  oprg.style.display = "none"
}

// унести в databases NB ?
function queryTerms(wfs) {
  clause(wfs)
    .then(terms => {
      hterms = terms
      let grs = qs('span.greek')
      grs.forEach(spn => {
        if (!terms[spn.textContent]) return
        spn.classList.remove('greek')
        spn.classList.add('term')
      })
    })
}

function showResults(result) {
  let ores = q('#results')
  empty(ores)

  antrax(result)
    .then(chains => {
      if (!chains.length) showNoRes()
      chains.forEach(chain => {
        let owf = showWF(chain)
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
  // log('CH', segs)

  let owf = div()
  if (chain.length > 2) {
    let oscheme = drawScheme(chain)
    owf.appendChild(oscheme)
  }

  segs.forEach((seg, idx) => {
    log('SEG', seg)
    if (!seg.dicts) return // bad dictionaries !
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
function showTerm(str) {
  let ores = q('#results')
  empty(ores)

  let terms = hterms[str]
  if (!terms.length) return
  terms.forEach(dict => {
    // dict.pref - only as a first part of a wordform:
    if (dict.pref) return
    let odiv = div()
    let odict = rDict(dict)
    odiv.appendChild(odict)

    let fls = dict.morphs
    if (fls) {
      let morphs = getMorphs(dict, fls)
      let oMorph = rMorph(morphs)
      odiv.appendChild(oMorph)
    }

    let otrns = rTrns(dict)
    odiv.appendChild(otrns)
    ores.appendChild(odiv)
  })
}

const historyMode = event => {
  const checkArrow = element => {
    // if (!element.classList.contains("arrow")) return
    if (element.id === "new-version") {
      log('NEW VERS CLICKED')
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
  const checkDomElement = element => {
    if (element.nodeName !== "SPAN") return
    if (element.classList.contains("greek")) {
      let query = element.textContent
      if (!query) return
      showResults(query)
    } else if (element.classList.contains("term")) {
      let term = element.textContent
      if (!term) return
      showTerm(term)
    }
  }
  checkDomElement(event.target);
}

document.addEventListener("mouseover", checkGreek, false)
document.addEventListener("click", historyMode, false)

function showDicts() {
  showSection('dicts')
  let cfg = readCfg()
  let hiddens = ['flex', 'specs']
  let mins = _.filter(cfg, db => { return !hiddens.includes(db.name)})
  let obj = {dbs: mins}

  let rpath = 'src/sections/dictTable.mustache'
  const tmpl = jetApp.read(rpath, "utf8");
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
  // log('P', img)

  writeCfg(cfg)
  showDicts()
}

function showCleanup() {
  showSection('cleanup')
  let ocleanup = q('#cleanup')
  ocleanup.addEventListener("click", cleanupDBs, false)
}

function cleanupDBs() {
  // log('CLEANUP')
  recreateDBs()
  // cfg = readCfg()
  showDicts()
}

function showInstall() {
  showSection('install')
  // let oform = q('#select-file')
  let oinputfile = q('#inputfile')

  oinputfile.onchange = function(ev) {
    let fileList = oinputfile.files
    // log('FL', fileList)
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
  log('INSTALL DB')
  let ofn = q('#filename')
  let fpath = ofn.getAttribute('fpath')
  log('FP', fpath)
  // addCfg()
  // showDicts()
}
