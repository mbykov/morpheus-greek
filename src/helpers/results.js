//

import _ from 'lodash'
import { q, qs, empty, create, span, p, div } from './utils'

export function rDict (dict) {
  let odicthead = div()
  odicthead.classList.add('dicthead')
  let odname = span(dict.dname)
  odname.classList.add('dname')
  odicthead.appendChild(odname)
  let pos = [dict.pos, ':'].join('')
  let ospos = span(pos)
  odicthead.appendChild(ospos)
  if (!dict.rdict || dict.rdict == 'undefined') return odicthead

  let ogend
  if (dict.gend) ogend = span(dict.gend)
  let ordict = span(dict.rdict)
  ordict.classList.add('dict')

  if (ogend) odicthead.appendChild(ogend)
  odicthead.appendChild(ordict)
  return odicthead
}

export function rMorph (morphs) {
  let ofls = create('ul', 'fls')
  morphs.forEach(morph => {
    let ofl = create('li')
    ofl.textContent = morph
    ofls.appendChild(ofl)
  })
  return ofls
}

export function rTrns (dict) {
  let otrns = create('ul', 'trns')
  if (!dict.trns) dict.trns = ['no transtation in this dict article']
  dict.trns.forEach(trn => {
    let otrn = create('li')
    let str = trn.split('(').join('<span class="grey">').split(')').join('</span>')
    otrn.innerHTML = str
    otrns.appendChild(otrn)
  })
  return otrns
}

export function getMorphs (dict, fls) {
  let morphs
  if (dict.pos == 'verb') morphs = fls.map(flex => { return [flex.tense, flex.numper].join(' ') })
  else if (dict.pos == 'name' && dict.gend) morphs = fls.map(flex => { return [dict.gend, flex.numcase].join('.') })
  else if (dict.pos == 'name') morphs = fls.map(flex => { return [flex.gend, flex.numcase].join('.') })
  else if (dict.pos == 'pron')  morphs = fls.map(flex => { return [flex.gend || '-', flex.numcase].join('.') })
  else if (dict.pos == 'art')  morphs = fls.map(flex => { return [flex.gend, flex.numcase].join('.') })
  else if (dict.pos == 'adv')  morphs = fls.map(flex => { return flex.degree })
  else if (dict.pos == 'part')  morphs = fls.map(flex => { return [flex.gend, flex.numcase].join('.') })
  return morphs
}
