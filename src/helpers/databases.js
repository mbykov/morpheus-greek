//

import _ from "lodash"
import { remote } from "electron"

// import { enableDBs } from '../../../antrax'
// import { enableDBs } from 'antrax'

const log = console.log
const path = require('path')
const app = remote.app
const isDev = require('electron-is-dev')
const appPath = app.getAppPath()
const userDataPath = app.getPath("userData")

const decompress = require('decompress')
const decompressTargz = require('decompress-targz')

let fse = require('fs-extra')


export function readCfg() {
  let cfgpath = path.resolve(userDataPath, 'pouch/cfg.json')
  let cfg = fse.readJsonSync(cfgpath)
  return cfg
}

export function writeCfg(cfg) {
  let cfgpath = path.resolve(userDataPath, 'pouch/cfg.json')
  fse.writeJsonSync(cfgpath, cfg)
  enableDBs(userDataPath, appPath, isDev)
}

export function recreateDBs() {
  let pouchpath = path.resolve(userDataPath, 'pouch')
  try {
    if (fse.pathExistsSync(pouchpath)) {
      fse.removeSync(pouchpath)
    }
    enableDBs(userDataPath, appPath, isDev)
  } catch (err) {
    log('ERR re-creating DBs', err)
    app.quit()
  }
}
