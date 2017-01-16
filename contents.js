//

// console.log('INSIDE HTML')

// let antrax = document.getElementById('antrax-result')
const antrax = require('./antrax')
const _ = require('underscore')
const Events = require('component-events')
const classes = require('component-classes')
const Tree = require('./tree')

/* αὐτοῦ μοι μὲν αὐτοὺς οἵπερ Δαναοὺς μηδὲ ἐμοὶ ὅσοι οὐδὲν
δηλοῖ δέ μοι καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ ἤκιστα. πρὸ γὰρ τῶν Τρωικῶν οὐδὲν φαίνεται πρότερον κοινῇ ἐργασαμένη ἡ Ἑλλάς. δοκεῖ δέ μοι, οὐδὲ τοὄνομα τοῦτο  ξύμπασά πω εἶχεν, ἀλλὰ τὰ μὲν πρὸ Ἕλληνος τοῦ Δευκαλίωνος καὶ πάνυ οὐδὲ εἶναι ἡ ἐπίκλησις αὕτη. κατὰ ἔθνη δὲ ἄλλα τε καὶ τὸ Πελασγικὸν ἐπὶ πλεῖστον ἀφ' ἑαυτῶν τὴν ἐπωνυμίαν παρέχεσθαι. Ἕλληνος δὲ καὶ τῶν παίδων αὐτοῦ ἐν τῇ Φθιῶτιδι ἰσχυσάντων, καὶ ἐπαγομένων αὐτοὺς ἐπ' ὠφελίᾳ ἐς τὰς ἄλλας πόλεις, καθ' ἑκάστους μὲν ἤδη τῇ ὁμιλίᾳ μᾶλλον καλεῖσθαι Ἕλληνας. οὐ μέντοι πολλοῦ γε χρόνου ἐδύνατο καὶ ἅπασιν ἐκνικῆσαι. τεκμηριοῖ δὲ μάλιστα Ὅμερος πολλῷ γὰρ ὕστερον ἔτι καὶ τῶν Τρωικῶν γενόμενος οὐδαμοῦ οὕτω τοὺς ξύμπαντας ὠνόμασεν οὐδ' ἄλλους ἢ τοὺς μετὰ Ἀχιλλέως ἐκ τῆς Φθιώτιδος. οἵπερ καὶ πρῶτοι Ἕλληνες ἧσαν, Δαναοὺς δὲ ἐν τοῖς ἔπεσι καὶ Ἀργείους καὶ Ἀχαιοὺς ἀνακαλεῖ. οὐ μὴν οὐδὲ βαρβάρους εἴρηκε διὰ τὸ μηδὲ Ἕλληνάς πω, ὡς ἐμοὶ δοκεῖ. ἀντίπαλον ἐς ἓν ὄνομα ἀποκεκρίσθαι. οἱ δ' οὖν ὡς ἕκαστοι Ἕλληνες κατὰ πόλεις τε ὅσοι ἀλλήλων ξυνίεσαν καὶ ξύμπαντες ὕστερον κληθέντες οὐδὲν πρὸ τῶν Τρωικῶν δι' ἀσθένειαν καὶ ἀμειξίαν ἀλλήλων ἁθρόοι ἔπραξαν. ἀλλὰ καὶ ταύτην τὴν στρατείαν θαλάσσῃ ἤδη πλείω χρώμενοι ξυνῆλθον.
ICT KEYS ["παλαιᾶ", "παλαιά", "παλαια", "παλαιας", "παλαιῆ", "παλαιη", "παλαιής", "παλαιης", "παλαιόν", "παλαιός", "ἀσθένεια", "ἀσθένειας"]
ὠχρός
πηχυς ιχθυς
λυω -
*/
let clause;

require('electron').ipcRenderer.on('ping', (event, json) => {
    let oRes = document.getElementById('antrax-result')
    let obj = JSON.parse(json)
    log('MSG', obj)
    antrax.query(obj.sentence, obj.num, function(_clause) {
        clause = _clause

        drawHeader(clause, obj.num)
        drawMorphs(clause, obj.num)
    })
})

// поиск chains для current num
// chains мне нужны ТОЛЬКО для подчеркивания - пока names
// все красиво, но как искать связи в глаголах, etc?

function conform(clause, num) {
    let current = clause[num]
    // let chains = [];
    // только полные current names:
    let name = current.name || current.term
    if (name.pos == 'verb') return
    if (!name) return
    let type = (current.name) ? 'name' : 'term'
    // let type = name.type

    let cmorphs = name.morphs
    let cstrs = cmorphs.map(function(m) { return JSON.stringify(m)})
    cstrs = _.uniq(cstrs)
    // log('CSTRS', cstrs)

    // chains - новые объекты
    // δηλοῖ δέ μοι καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ ἤκιστα

    let dist = 3
    let chain = {}
    chain[num] = current
    for (let idx in clause) {
        if (idx == num) continue
        if (idx < num - dist) continue
        if (idx > num + dist) continue
        let other = clause[idx]
        // только полные others:
        let oname = other.name || other.term
        let otype = (other.name) ? 'name' : 'term'
        if (!oname) continue
        // log('OTHER name', idx, other.key, oname)
        let omorphs = oname.morphs
        log('OTHER morphs', idx, other.key, omorphs)
        let ostrs = omorphs.map(function(m) { return JSON.stringify(m)})
        ostrs = _.uniq(ostrs)
        // log('OSTRS', ostrs)
        let common = _.intersection(cstrs, ostrs)
        let newmorphs, onew
        if (!common.length) continue
        newmorphs = common.map(function(m) { return JSON.parse(m)})
        // cnew.morphs = newmorphs
        current[type].morphs = newmorphs
        // onew = {idx: oname.idx, form: oname.form, pos: oname.pos, dict: oname.dict, morphs: newmorphs, type: oname.type, trn: oname.trn}
        // let newother = {key: other.key, idx: idx}
        other[otype].morphs = newmorphs
        chain[idx] = other
        // if (chain.length > 1) chains.push(chain)
    }
    // log('NEW CHAIN', chain)
    if (_.keys(chain).length == 1) return
    return chain

    // if (!chains.length) return
    // let max = _.max(chains.map(function(ch) { return ch.length; }));
    // log('MAX', max);
    // if (max == 1) return
    // chains = _.select(chains, function(ch) { return ch.length == max; });
    // return chains;
}

// все типы - сколько их? <<<<<<<<<<<<<<<<<<==========
// <<=========================================
// причастия начать - нужна таблица стемов глаголов?
// кажется, можно без таблицы все, кроме leluka - не считая неправильных
// terms залить заново, не form и dict
// в seed_ls - выделить indecls

function drawMorphs(clause, num) {
    // let anchor = document.getElementById('antrax-tree');
    // empty(anchor)
    let current = clause[num]
    log('DRAW MORPHS START ========', num, current)
    let chain = conform(clause, num)

    // 1- подчернуть chains и 2 - показать tree-current

    let uns = qs('.underlined')
    uns.forEach(function(el) {
        classes(el).remove('underlined')
    })

    if (chain) {
        underline(chain)
        current = chain[num]
        log('NEW CUR', current)
    }

    let oMorphs = q('#antrax-morphs')
    empty(oMorphs)
    // log('DRAW oMORPHS', oMorphs)
    let odicts = q('#antrax-dicts')
    remove(odicts)
    let oDicts = cre('div')
    oDicts.id = 'antrax-dicts'
    let parent = q('#antrax-results')
    parent.appendChild(oDicts)

    drawCurrent(current)
}

// δηλοῖ δέ μοι καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ ἤκιστα.
// λέγω

function drawCurrent(cur) {
    log('drCURRENT', cur)
    if (cur.term && cur.term.pos == 'verb') showVerb(cur.term)
    if (cur.term) showName(cur.term)
    if (cur.forms) showForms(cur.forms)
    if (cur.verbs) showVerbs(cur.verbs)
    if (cur.names) showNames(cur.names)
}

function showNames(names) {
    names.forEach(function(name) {
        showName(name)
    })
}

function showName(cur) {
    log('SHOW NAME', cur)
    let oMorphs = q('#antrax-morphs')
    let oDict = creDict()

    let mstr = compactNameMorph(cur)
    log('MSTR', mstr)
    let dictpos = [cur.dict, cur.pos].join(' - ')
    let head = [dictpos, mstr].join('; ')
    let strs = cur.trn.split(' | ')
    let children = strs.map(function(str) { return {text: str}})
    let data = [{text: head, id: 'dictpos', children: children}]

    log('NAME DATA', data)
    let tree = new Tree(oDict)
    tree.data(data)
}

function compactNameMorph(cur) {
    let result
    // log('MORPHS', cur.morphs)
    let gmorphs = _.groupBy(cur.morphs, 'numcase')
    let ggends = _.groupBy(cur.morphs, 'gend')
    log('gmorphs', gmorphs)
    // log('SIZE m', _.keys(gmorphs), 'g', _.keys(ggends))
    let morphs
    if (_.keys(gmorphs).length <= _.keys(ggends).length) {
        for (let numcase in gmorphs) {
            let gends = gmorphs[numcase].map(function(gm) { return gm.gend})
            gends = _.uniq(gends).sort()
            morphs = [JSON.stringify(gends), numcase].join('.')
        }
    } else {
        for (let gend in ggends) {
            morphs = ggends[gend].map(function(gg) { return gg.numcase})
            morphs = _.uniq(morphs).sort()
            // morphs = removeVoc(morphs)
            morphs = [gend, JSON.stringify(morphs)].join('.')
        }
    }
    // let str = [cur.dict, morph].join(': ')
    // result = sa(str)
    return morphs
}

function creDict() {
    let oDict = cre('div')
    classes(oDict).add('antrax-dict')
    let parent = q('#antrax-dicts')
    parent.appendChild(oDict)
    return oDict
}

// καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ
// λέγω
function showVerbs(verbs) {
    verbs.forEach(function(verb) {
        showVerb(verb)
    })
}

function showVerb(cur) {
    log('VERB', cur)
    let oMorphs = q('#antrax-morphs')
    let oDict = creDict()
    let mstrs = []
    for (let mod in cur.morphs) {
        mstrs.push([mod, cur.morphs[mod]].join(': '))
    }
    let mstr = mstrs.join('; ')
    // let mstr = cur.morphs.map(function(m) { return JSON.stringify(m.numpers) })

    let dictpos = [cur.dict, cur.pos].join(' - ')
    let head = [dictpos, mstr].join('; ')
    let strs = cur.trn.split(' | ')
    let children = strs.map(function(str) { return {text: str}})
    let data = [{text: head, id: 'dictpos', children: children}]

    let tree = new Tree(oDict)
    tree.data(data)
}

function compactVerbMorph(cur) {
    if (!cur.morphs.length) return ''
    let result = cur.morphs.map(function(morph) {
        // log('M', morph, morph.numpers)
        return morph.numpers
    })
    // log('VERB MORPH', result)
    return JSON.stringify(result)
}

function showForms(forms) {
    forms.forEach(function(form) {
        // log('DRAW FORM', form)
        let oMorphs = q('#antrax-morphs')
        let oMorph = cre('div')
        // let dict = dict.form // FIXME:
        let dictpos = [form.dict, form.pos].join(', ')
        let oDP = sa(dictpos)
        let comma = cret('; ')
        let oTrn = sa(form.trn)
        classes(oTrn).add('black')
        oMorph.appendChild(oDP)
        oMorph.appendChild(comma)
        oMorph.appendChild(oTrn)
        oMorphs.appendChild(oMorph)
    })
}



// function showConj(cur) {
//     let oMorphs = q('#antrax-morphs')
//     // empty(oMorphs)
//     let oMorph = cre('div')
//     let dict = cur.form // FIXME:
//     let dictpos = [dict, cur.pos].join(' - ')
//     let odict = sa(dictpos)
//     oMorph.appendChild(odict)
//     oMorphs.appendChild(oMorph)
//     appendDicts(cur)
// }


// эта хрень должна реагировать только на обращение:
function removeVoc(morphs) {
    let cleans = []
    let hasNom = false
    morphs.forEach(function(morph) {
        if (morph.split('.')[1] == 'nom') hasNom = true
    })
    morphs.forEach(function(morph) {
        if (hasNom && morph.split('.')[1] != 'voc') cleans.push(morph)
    })
    return cleans
}

// let data = [{
//     text: 'o-text'
// }, {
//     text: 'first title',
//     id: 'first',
//     children:[
//         {text: '2-text'},
//         {text: '3-text'}
//     ]
// }, {
//     text: 'end'
// }]

// δηλοῖ δέ μοι καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ ἤκιστα.
// λέγω
// ἐπιβάλλουσι

function drawHeader(clause, num) {
    // log('HEADER', clause, num)
    let oHeader = q('#antrax-header')
    empty(oHeader)
    let idxs = _.keys(clause)
    idxs.forEach(function(idx, i) {
        let form = clause[idx].key
        let span = sa(form)
        // let id = ['id_', idx].join('')
        span.idx = i
        // span.setAttribute('idx') = idx
        let space = cret(' ')
        oHeader.appendChild(span)
        oHeader.appendChild(space)
        classes(span).add('antrax-form')
        if (idx == num) classes(span).add('antrax-current')
        // καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ
    })
    bindEvents(oHeader)
}

function bindEvents(el) {
    let events = Events(el, {
        current: function(e){
            let el = e.target
            // log('CLICK', e.target.textContent)
            let old = q('#antrax-header span.antrax-current')
            classes(old).remove('antrax-current')
            classes(el).add('antrax-current')
        }
    });
    events.bind('click .antrax-form', 'current')
}


// или м.б разные words, кроме current? А если разные, то что делать?
// и как будут еще сгруппированы chains? а если прибавится связей?
// μοι καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ
// .πωνυμ
function underline(chain) {
    // let uns = qs('.underlined')
    // uns.forEach(function(el) {
    //     classes(el).remove('underlined')
    // })
    let words = qs('#antrax-header span.antrax-form')
    for (let idx in chain) {
        let el = words[idx]
        classes(el).add('underlined')
    }
}


function check(sentence) {
    let err = q('#xxx')
    err.textContent = '=='
    let str = q('#antrax-header').textContent
    if (sentence.trim() == str.trim()) return
    err.textContent = 'ERR'
}


function xxx() {

}



function q(sel) {
    return document.querySelector(sel);
}

function qs(sel) {
    return document.querySelectorAll(sel);
}

function cre(tag) {
    return document.createElement(tag);
}

function cret(str) {
    return document.createTextNode(str);
}

function sa(str) {
    var oSa = cre('span');
    // classes(oSa).add('xxx');
    oSa.textContent = str;
    return oSa;
}

function empty(el) {
    while (el.hasChildNodes()) {
        el.removeChild(el.lastChild);
    }
}

function remove(el) {
    el.parentElement.removeChild(el);
}

function closeAll() {
    window.close()
    // var popups = qs('.morph-popup');
    // var arr = [].slice.call(popups);
    // arr.forEach(function(popup) {
    //     popup.parentElement.removeChild(popup);
    // });
    // var oTip = q('#tip');
    // if (oTip) oTip.parentElement.removeChild(oTip);
}


document.onkeyup = function(e) {
    if (e.which === 27) { //Esc
        closeAll()
    } else if ([37, 39].includes(e.which)) {
        moveCurrent(e)
    }
}

// δηλοῖ δέ μοι καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ ἤκιστα

function moveCurrent(e) {
    let el = q('.antrax-current')
    if (!el) return
    let idx = el.idx
    let words = qs('#antrax-header span.antrax-form')
    let size = words.length
    let dir = (e.which == 37) ? -1 : 1
    let next = idx+dir
    if (next == size) next = 0
    if (next == -1) next = size -1
    let nextEl = words[next]
    classes(el).remove('antrax-current')
    classes(nextEl).add('antrax-current')
    drawMorphs(clause, next)
}

let x = q('#antrax-close')
x.onclick = function() {
    closeAll()
}


function log() { console.log.apply(console, arguments); }



// function conform_(clause, num) {
//     let currents = clause[num]

//     return
//     let chains = [];
//     // только полные current names:
//     let cnames = _.select(currents, function(cur) { return cur.pos == 'name'})
//     cnames = _.select(cnames, function(cur) { return cur.morphs})
//     if (!cnames.length) return
//     // XXX

//     let cverbs = _.select(currents, function(cur) { return cur.pos == 'verb' && cur.morphs})
//     let nomorphs = _.select(currents, function(cur) { return !cur.morphs})
//     log('CUR NAMES', cnames)
//     log('CUR VERBS', cverbs)
//     log('CUR NOMs', nomorphs)
//     nomorphs.forEach(function(cur) {
//         // cur.nomorph = true
//         // chains.push([cur]);
//     })

//     let cmorphs = _.flatten(cnames.map(function(n) { return n.morphs}))
//     let cstrs = cmorphs.map(function(m) { return JSON.stringify(m)})
//     cstrs = _.uniq(cstrs)
//     log('CSTRS', cstrs)
//     let c = cnames[0]
//     let cdicts = cnames.map(function(n) { return {dtype: n.dtype, trn: n.trn}})
//     let cnew = {idx: c.idx, form: c.form, pos: c.pos, dict: c.dict, morphs: cmorphs, dicts: cdicts}

//     // chains - новые объекты

//     let dist = 3
//     let chain = [cnew]
//     for (let idx in clause) {
//         if (idx == num) continue
//         if (idx < num - dist) continue
//         if (idx > num + dist) continue
//         let otherows = clause[idx]
//         // только полные others:
//         let onames = _.select(otherows, function(cur) { return !cur.empty})
//         onames = _.select(onames, function(cur) { return cur.pos == 'name'})
//         onames = _.select(onames, function(cur) { return cur.morphs})
//         let omorphs = _.flatten(onames.map(function(n) { return n.morphs}))
//         let ostrs = omorphs.map(function(m) { return JSON.stringify(m)})
//         ostrs = _.uniq(ostrs)
//         log('OSTRS', ostrs)
//         let common = _.intersection(cstrs, ostrs)
//         let newmorphs, o, onew, odicts
//         if (common.length) {
//             newmorphs = common.map(function(m) { return JSON.parse(m)})
//             cnew.morphs = newmorphs
//             o = onames[0]
//             odicts = onames.map(function(n) { return {dtype: n.dtype, trn: n.trn}})
//             onew = {idx: o.idx, form: o.form, pos: o.pos, dict: o.dict, morphs: newmorphs, dicts: odicts}
//             chain.push(onew)
//         }
//         if (chain.length > 1) chains.push(chain)
//     }
//     log('NEW CHAINS', chains)

//     if (!chains.length) return
//     let max = _.max(chains.map(function(ch) { return ch.length; }));
//     log('MAX', max);
//     if (max == 1) return
//     chains = _.select(chains, function(ch) { return ch.length == max; });
//     return chains;
// }
