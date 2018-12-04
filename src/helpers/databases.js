//

import _ from "lodash"
import { remote } from "electron"

// import { enableDBs } from '../../../antrax'
import { enableDBs } from 'antrax'

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
  // let srcpath = path.resolve(apath, '../app.asar.unpacked/pouch')
  let srcpath = path.resolve(apath, 'pouch')
  let destpath = path.resolve(upath, 'pouch')
  // log('init - SRC:', srcpath, 'DEST:', destpath)
  try {
    fse.ensureDirSync(destpath)
    fse.copySync(srcpath, destpath, {
      overwrite: true
    })
  } catch (err) {
    log('ERR copying default DBs', err)
  }
}

export function checkVersion() {
  let pckg = require('../../package.json')
  let version = pckg.version
  let rewrite = false
  let versionpath = path.resolve(upath, 'version.json')
  let oldver = fse.readJsonSync(versionpath, { throws: false })
  if (!oldver) rewrite = true
  else if (oldver.version != version) rewrite = true
  let cfgpath = path.resolve(upath, 'pouch/cfg.json')
  let cfg = fse.readJsonSync(cfgpath, { throws: false })
  if (!cfg) cfg = createZeroCfg(upath, version)
  return cfg
}

function createZeroCfg(upath, version) {
  let destpath = path.resolve(upath, 'pouch')
  let fns = fse.readdirSync(destpath)

  let cfg = []
  fns.forEach((dn, idx) => {
    if (dn == 'cfg.json') return
    let dpath = path.resolve(destpath, dn)
    let cf = {name: dn, active: true, idx: idx}
    cfg.push(cf)
  })
  cfg = _.sortBy(cfg, ['idx'])
  let sfgpath = path.resolve(destpath, 'cfg.json')
  fse.writeJsonSync(sfgpath, cfg)
  let versionpath = path.resolve(upath, 'version.json')
  fse.writeJsonSync(versionpath, {version: version})
  return cfg
}

export function readCfg() {
  let cfgpath = path.resolve(upath, 'pouch/cfg.json')
  return fse.readJsonSync(cfgpath, { throws: false })
}

export function writeCfg(cfg) {
  let cfgpath = path.resolve(upath, 'pouch/cfg.json')
  fse.writeJsonSync(cfgpath, cfg)
  enableDBs(upath)
}

export function recreateDBs() {
  let destpath = path.resolve(upath, 'pouch')
  try {
    fse.removeSync(destpath)
    initDBs()
  } catch (err) {
    log('ERR re-creating DBs', err)
    // app.quit()
  }
}
