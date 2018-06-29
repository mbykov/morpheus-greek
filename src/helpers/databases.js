//

import _ from "lodash"
import jetpack from "fs-jetpack"
import { remote } from "electron"
// import { enableDBs } from '../../../antrax'
import { enableDBs } from 'antrax'

const path = require('path')
const app = remote.app
const appPath = app.getAppPath()
const userDataPath = app.getPath("userData")

const decompress = require('decompress')
const decompressTargz = require('decompress-targz')

let log = console.log
const jetData = jetpack.cwd(userDataPath)

export function antraxVersion(aver) {
  let oldver = jetData.read('version.json', 'json')
  if (!oldver) {
    oldver = {antrax: aver}
    jetData.write('version.json', oldver)
    recreateDBs()
  }
  if (aver != oldver.antrax) recreateDBs()
}

export function readCfg() {
  let cfg = jetData.read('pouch/cfg.json', 'json')
  return cfg
}

export function writeCfg(cfg) {
  jetData.write('pouch/cfg.json', cfg)
  enableDBs(userDataPath)
}

export function recreateDBs() {
  try {
    if (jetData.exists('pouch')) {
      jetData.remove('pouch')
    }
    enableDBs(userDataPath, appPath)
  } catch (err) {
    log('ERR re-creating DBs', err)
    app.quit()
  }
}

export function addDB(fpath) {
  let dbpath = path.resolve(userDataPath, 'pouch')
  decompress(fpath, dbpath, {
    plugins: [
      decompressTargz()
    ]
  }).then(() => {
    addCfg()
  })
}

function addCfg() {
  let cfg = readCfg()
  let fns = jetData.list('pouch')
  fns.forEach(dn => {
    let exists = _.find(cfg, cf => { return cf.name == dn})
    if (exists) return
    let dpath = ['pouch/', dn].join('')
    if (jetData.exists(dpath) !== 'dir') return
    let newcf = {name: dn, active: true, idx: cfg.length}
    cfg.push(newcf)
  })
  cfg.forEach((cf, idx) => { cf.idx = idx })
  jetData.write('pouch/cfg.json', cfg)
  enableDBs(userDataPath)
}
