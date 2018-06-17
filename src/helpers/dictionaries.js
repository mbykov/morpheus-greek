import _ from 'lodash'
import { remote } from "electron";
import { q, qs, empty, create, span, p, div } from './utils'
import jetpack from "fs-jetpack";
import { readCfg, writeCfg, recreateDBs } from "./databases.js";
import { setPath } from '../../antrax/dist/antrax'

const app = remote.app;
const upath = app.getAppPath()
let userDatapath = app.getPath("userData")
const appDir = jetpack.cwd(upath)
const mustache = require('mustache');
let log = console.log


function showDicts() {
  showSection('dicts')
  let obj = {dbs: cfg}

  let rpath = 'src/sections/dictTable.mustache'
  const tmpl = appDir.read(rpath, "utf8");
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
  let clicked = _.find(cfg, db => { return db.name == ev.target.id })
  if (!clicked) return
  cfg = cfg.filter(db => db.name !== ev.target.id)
  cfg.unshift(clicked)
  writeCfg(cfg)
  setPath(userDatapath, cfg)
  showDicts()
}

function activeCfg(ev) {
  if (ev.target.type != 'checkbox') return
  let clicked = _.find(cfg, db => { return db.name == ev.target.name })
  if (!clicked) return
  let chk = ev.target.checked
  clicked.active = (chk) ? true : false
  writeCfg(cfg)
  setPath(userDatapath, cfg)
  showDicts()
}

function showCleanup() {
  showSection('cleanup')

  let ocleanup = q('#cleanup')

  ocleanup.addEventListener("click", cleanupDicts, false)

}

function cleanupDicts() {
  // log('CLEANUP')
  // let newcfg = cfg
  recreateDBs()
  cfg = readCfg()
  showDicts()
}
