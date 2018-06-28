// ================ потом перенести speckled band

import _ from "lodash";
let log = console.log

// punctuation \u002E\u002C\u0021\u003A\u003B\u00B7 - \u0020\u0027 - ... middle dot, - space, apostrophe
// parens ()[]{-/
// \u0028\u0029\u005B\u005D\u007B\u007D\u002D\u002F
// greek 0370-03FF 1F00–1FFF
// diactitic 0300-036F

let puncts = '([\u002E\u002C\u0021\u003A\u003B\u00B7])'

let coderanges = {
  'zh': '([\u4E00-\u9FFF]+)',
  'gr': '([\u0370-\u03FF\u1F00-\u1FFF\u0300-\u036F\u0027]+)'
}

export default (code, str) => {
  let re = new RegExp(coderanges[code])
  if (!re.test(str)) return
  let clean = str.trim().replace(/᾽/g, "'")
  let rep = new RegExp(puncts)
  let rows = clean.replace(/\r?\n+/, '\n').split('\n')
  let rclauses = rows.map(row => { return row.split(rep) })
  // log('RCLs', rclauses)
  let spans = []
  rows.forEach(row => {
    let spns = []
    let rclauses = row.split(rep)
    rclauses.forEach(rclause => {
      log('RCL', rclause)
      if (rep.test(rclause)) {
        let spn = {text: rclause, punct: true}
        log('PU', spn)
        spns.push(spn)
      } else {
        let clauses = rclause.split(re)
        clauses = _.compact(clauses)
        log('CLS', clauses)
        clauses.forEach(clause => {
          let lang = (re.test(clause)) ? true : false
          let spn = {text: clause}
          if (lang) spn[code] = true
          spns.push(spn)
        })
      }
    })
    spans.push(spns)
  })
  return spans
}
