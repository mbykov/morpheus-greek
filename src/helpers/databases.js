//

import _ from "lodash"
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
let fse = require('fs-extra')


export function readCfg() {
  let cfgpath = path.resolve(userDataPath, 'pouch/cfg.json')
  let cfg = fse.readJsonSync(cfgpath)
  return cfg
}

export function writeCfg(cfg) {
  let cfgpath = path.resolve(userDataPath, 'pouch/cfg.json')
  fse.writeJsonSync(cfgpath, cfg)
  enableDBs(userDataPath)
}

export function recreateDBs() {
  let pouchpath = path.resolve(userDataPath, 'pouch')
  log('RECREATE', pouchpath)
  try {
    if (fse.pathExistsSync(pouchpath)) {
      fse.removeSync(pouchpath)
    }
    enableDBs(userDataPath, appPath)
  } catch (err) {
    log('ERR re-creating DBs', err)
    app.quit()
  }
}

// export function addDB(fpath) {
//   let dbpath = path.resolve(userDataPath, 'pouch')
//   decompress(fpath, dbpath, {
//     plugins: [
//       decompressTargz()
//     ]
//   }).then(() => {
//     addCfg()
//   })
// }

// function addCfg() {
//   let cfg = readCfg()
//   let fns = jetData.list('pouch')
//   fns.forEach(dn => {
//     let exists = _.find(cfg, cf => { return cf.name == dn})
//     if (exists) return
//     let dpath = ['pouch/', dn].join('')
//     if (jetData.exists(dpath) !== 'dir') return
//     let newcf = {name: dn, active: true, idx: cfg.length}
//     cfg.push(newcf)
//   })
//   cfg.forEach((cf, idx) => { cf.idx = idx })
//   jetData.write('pouch/cfg.json', cfg)
//   enableDBs(userDataPath)
// }
