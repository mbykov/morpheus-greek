//

import _ from "lodash"
import { remote } from "electron"

// import { enableDBs } from '../../../antrax'
// import { enableDBs } from 'antrax'

const log = console.log
const path = require('path')
const app = remote.app
const isDev = require('electron-is-dev')
const apath = app.getAppPath()
const upath = app.getPath("userData")

const decompress = require('decompress')
const decompressTargz = require('decompress-targz')

let fse = require('fs-extra')

export function initDBs() {
  let cfg = readCfg()
  if (cfg) return
  let isDarwin = process.platform === "darwin"
  // let srcpath
  // if (isDarwin) srcpath = path.resolve(apath, '../app.asar.unpacked/pouch')
  // else
  let srcpath = path.resolve(apath, '../app.asar.unpacked/pouch')
  let destpath = path.resolve(upath, 'pouch')
  log('init - SRC:', srcpath, 'DEST:', destpath)
  try {
    fse.ensureDirSync(destpath)
    fse.copySync(srcpath, destpath, {
      overwrite: true
    })
  } catch (err) {
    log('ERR copying default DBs', err)
  }
}

export function readCfg() {
  let cfgpath = path.resolve(upath, 'pouch/cfg.json')
  return fse.readJsonSync(cfgpath, { throws: false })
}

export function writeCfg(cfg) {
  let cfgpath = path.resolve(upath, 'pouch/cfg.json')
  fse.writeJsonSync(cfgpath, cfg)
  enableDBs(upath, apath, isDev)
}

export function recreateDBs() {
  let pouchpath = path.resolve(upath, 'pouch')
  try {
    if (fse.pathExistsSync(pouchpath)) {
      fse.removeSync(pouchpath)
    }
    enableDBs(upath, apath, isDev)
  } catch (err) {
    log('ERR re-creating DBs', err)
    app.quit()
  }
}
