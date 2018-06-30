//

import _ from 'lodash'
import { q, qs, empty, create, span, p, div } from './utils'

export function rDict (dict) {
  let odicthead = div()
  odicthead.classList.add('dicthead')
  let odname = span(dict.dname)
  odname.classList.add('dname')
  odicthead.appendChild(odname)
  let pos = getPos(dict)
  let ospos = span(pos)
  odicthead.appendChild(ospos)
  if (!dict.rdict || dict.rdict == 'undefined') return odicthead

  let ogend
  if (dict.gend) ogend = span([', ', dict.gend].join(''))
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
  if (dict.verb) morphs = fls.map(flex => { return [flex.tense, flex.numper].join(' ') })
  else if (dict.name && dict.gend) morphs = fls.map(flex => { return [dict.gend, flex.numcase].join('.') })
  else if (dict.name) morphs = fls.map(flex => { return [flex.gend, flex.numcase].join('.') })
  else if (dict.pron)  morphs = fls.map(flex => { return [flex.gend, flex.numcase].join('.') })
  else if (dict.art)  morphs = fls.map(flex => { return [flex.gend, flex.numcase].join('.') })
  else if (dict.adv)  morphs = null
  else if (dict.part)  morphs = fls.map(flex => { return [flex.gend, flex.numcase].join('.') })
  else if (dict.xxx)  morphs = ''
  return morphs
}

function getPos (dict) {
  let pos
  if (dict.verb) pos = 'verb:'
  else if (dict.name) pos = 'name:'
  else if (dict.pron)  pos = 'pronoun:'
  else if (dict.art)  pos = 'article:'
  else if (dict.adv)  pos = 'adverb:'
  else if (dict.part)  pos = 'participle:'
  else if (dict.conj)  pos = 'conj:'
  else if (dict.prep)  pos = 'prep:'
  else if (dict.indecl)  pos = 'indecl:'
  else if (dict.pref)  pos = 'prefix:'
  else if (dict.particle)  pos = 'particle:'
  else if (dict.spec)  pos = 'special:'
  else if (dict.xxx)  pos = ''
  return pos
}
