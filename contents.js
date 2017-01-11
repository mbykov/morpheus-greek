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
        // log('clause:', clause)
        // oRes.textContent = obj.sentence
        // check(obj.sentence)

        let num = obj.num
        drawHeader(clause, num)
        drawMorphs(clause, num)
    })
})

// поиск chains для current num
// chains мне нужны ТОЛЬКО для подчеркивания - пока names
// все красиво, но как искать связи в глаголах, etc?

function conform(currents, clause, num) {
    let chains = [];
    // только полные current names:
    let cnames = _.select(currents, function(cur) { return cur.pos == 'name'})
    cnames = _.select(cnames, function(cur) { return cur.morphs})
    if (!cnames.length) return
    // XXX

    let cverbs = _.select(currents, function(cur) { return cur.pos == 'verb' && cur.morphs})
    let nomorphs = _.select(currents, function(cur) { return !cur.morphs})
    log('CUR NAMES', cnames)
    log('CUR VERBS', cverbs)
    log('CUR NOMs', nomorphs)
    nomorphs.forEach(function(cur) {
        // cur.nomorph = true
        // chains.push([cur]);
    })

    let cmorphs = _.flatten(cnames.map(function(n) { return n.morphs}))
    let cstrs = cmorphs.map(function(m) { return JSON.stringify(m)})
    cstrs = _.uniq(cstrs)
    log('CSTRS', cstrs)
    let c = cnames[0]
    let cdicts = cnames.map(function(n) { return {dtype: n.dtype, trn: n.trn}})
    let cnew = {idx: c.idx, form: c.form, pos: c.pos, dict: c.dict, morphs: cmorphs, dicts: cdicts}

    // chains - новые объекты
    //  καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ ἤκιστα
    // λέγω

    let dist = 3
    let chain = [cnew]
    for (let idx in clause) {
        if (idx == num) continue
        if (idx < num - dist) continue
        if (idx > num + dist) continue
        let otherows = clause[idx]
        // только полные others:
        let onames = _.select(otherows, function(cur) { return !cur.empty})
        onames = _.select(onames, function(cur) { return cur.pos == 'name'})
        onames = _.select(onames, function(cur) { return cur.morphs})
        let omorphs = _.flatten(onames.map(function(n) { return n.morphs}))
        let ostrs = omorphs.map(function(m) { return JSON.stringify(m)})
        ostrs = _.uniq(ostrs)
        log('OSTRS', ostrs)
        let common = _.intersection(cstrs, ostrs)
        let newmorphs, o, onew, odicts
        if (common.length) {
            newmorphs = common.map(function(m) { return JSON.parse(m)})
            cnew.morphs = newmorphs
            o = onames[0]
            odicts = onames.map(function(n) { return {dtype: n.dtype, trn: n.trn}})
            onew = {idx: o.idx, form: o.form, pos: o.pos, dict: o.dict, morphs: newmorphs, dicts: odicts}
            chain.push(onew)
        }
        if (chain.length > 1) chains.push(chain)
    }
    log('NEW CHAINS', chains)

    if (!chains.length) return
    let max = _.max(chains.map(function(ch) { return ch.length; }));
    log('MAX', max);
    if (max == 1) return
    chains = _.select(chains, function(ch) { return ch.length == max; });
    return chains;
}


// все типы - сколько их? <<<<<<<<<<<<<<<<<<==========
// <<=========================================
// причастия начать - нужна таблица стемов глаголов?
// кажется, можно без таблицы все, кроме leluka - не считая неправильных
// terms залить заново, не form и dict
// в seed_ls - выделить indecls
// ff вешать в dicts
// dict-morphs - создавать div и append

function drawMorphs(clause, num) {
    // let anchor = document.getElementById('antrax-tree');
    // empty(anchor)
    let currents = clause[num]
    currents = _.select(currents, function(cur) { return !cur.empty})
    let simpleterms = _.select(currents, function(cur) { return !cur.morphs && cur.type == 'term'})
    currents = _.select(currents, function(cur) { return cur.morphs})
    let chains = conform(currents, clause, num)
    log('CHAINS', chains)
    // 1- подчернуть chains и 2 - показать tree-current
    if (chains) {
        underline(chains)
        currents = _.select(_.flatten(chains), function(ch) { return ch.idx  == num })
    }

    let oMorphs = q('#antrax-morphs')
    empty(oMorphs)
    let oDicts = q('#antrax-dicts')
    remove(oDicts)
    oDicts = cre('div')
    oDicts.id = 'antrax-dicts'
    let parent = q('#antrax-results')
    parent.appendChild(oDicts)

    drawSimpleTerm(simpleterms)
    drawCurrents(currents)
}

// λέγω
// ffs - нет morphs - сразу dicts
function drawSimpleTerm(sts) {
    sts.forEach(function(dict) {
        let oMorphs = q('#antrax-morphs')
        let oMorph = cre('div')
        let form = dict.form // FIXME:
        let dictpos = [dict.form, dict.pos].join(', ')
        let oDP = sa(dictpos)
        let comma = cret('; ')
        let oTrn = sa(dict.trn)
        classes(oTrn).add('black')
        oMorph.appendChild(oDP)
        oMorph.appendChild(comma)
        oMorph.appendChild(oTrn)
        oMorphs.appendChild(oMorph)
    })
}

function drawCurrents(currents) {
    currents.forEach(function(cur) {
        let pos = cur.pos
        switch(pos) {
        case 'verb':
            showVerb(cur)
            break
        case 'art':
        case 'name':
        case 'noun':
        case 'adj':
        case 'part':
        case 'pron':
            showName(cur)
            break
        case 'particle':
        case 'conj':
        case 'prep':
        case 'adv':
            showConj(cur)
            break
        default:
            log('=POS=', pos)
        }
    })
}

//  καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ ἤκιστα
// αἰνολέων, οντος, ὁ, dreadful lion
// ἀπόδεξις, εως, ἡ, (ἀποδέχομαι) acceptance
// XXX

function showConj(cur) {
    let oMorphs = q('#antrax-morphs')
    // empty(oMorphs)
    let oMorph = cre('div')
    let dict = cur.form // FIXME:
    let dictpos = [dict, cur.pos].join(' - ')
    let odict = sa(dictpos)
    oMorph.appendChild(odict)
    oMorphs.appendChild(oMorph)
    appendDicts(cur)
}

function dictData(cur) {
    // log('DDicts', cur.pos, cur.dict)
    let data = []
    let dicts = (cur.dicts) ? cur.dicts : [{dtype: cur.dtype, trn: cur.trn}]
    dicts.forEach(function(dict, idx) {
        let dname = dict.dtype || 'dname'
        let id = [dname, idx].join('_')
        let strs = dict.trn.split(' | ')
        let children = strs.map(function(str) { return {text: str}})
        data.push({text: dname, id: id, children: children})
    })
    // log('DData', data)
    return data
}

function appendDicts(cur) {
    let data = dictData(cur)
    let anchor = cre('div')
    let parent = q('#antrax-dicts')
    parent.appendChild(anchor)
    let tree = new Tree(anchor)
    tree.data(data)
}

// καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ
// λέγω
function showVerb(cur) {
    let oMorphs = q('#antrax-morphs')
    // empty(oMorphs)
    // let oDicts = q('#antrax-dicts')
    // empty(oDicts)
    let oMorph = cre('div')
    let dict = [cur.dict, cur.pos].join(' - ')
    let odict = sa(dict)
    let comma = cret(', ')
    // log('DRAW VERB', cur)

    let mstr = compactVerbMorph(cur)
    let morphs = sa(mstr)
    oMorph.appendChild(odict)
    oMorph.appendChild(comma)
    oMorph.appendChild(morphs)
    oMorphs.appendChild(oMorph)
    appendDicts(cur)
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

function showName(cur) {
    let oMorphs = q('#antrax-morphs')
    // empty(oMorphs)
    let oMorph = cre('div')
    let dict = [cur.dict, cur.pos].join(' - ')
    let odict = sa(dict)
    let comma = cret(', ')
    let mstr = compactNameMorph(cur)
    let morphs = sa(mstr)
    oMorph.appendChild(odict)
    oMorph.appendChild(comma)
    oMorph.appendChild(morphs)
    oMorphs.appendChild(oMorph)
    // log('showName', cur)
    appendDicts(cur)
}

function compactNameMorph(cur) {
    let result
    // log('MORPHS', cur.morphs)
    let gmorphs = _.groupBy(cur.morphs, 'numcase')
    let ggends = _.groupBy(cur.morphs, 'gend')
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

function drawHeader(clause, num) {
    // log('HEADER', clause, num)
    let oHeader = q('#antrax-header')
    empty(oHeader)
    let idxs = _.keys(clause)
    idxs.forEach(function(idx, i) {
        // если есть dict кроме empty, их оставить, empty откинуть, а если нет, то empty
        let form = clause[idx][0].form
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
// .πωνυμ
function underline(chains) {
    let uns = qs('.underlined')
    uns.forEach(function(el) {
        classes(el).remove('underlined')
    })
    // log('LINE CHAINS', chains)
    // let chain = chains[0] // any chain - пока что простейший вариант, все chains из одинаковых words
    // if (!chain || !chain.length) return // это уйдет, когда chain в terms будет массив FIXME:
    // if (chain.length < 2) return
    // log('underline chains', chains)
    // μοι καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ
    let words = qs('#antrax-header span.antrax-form')
    chains.forEach(function(chain) {
        if (chain.length < 2) return
        chain.forEach(function(word) {
            // log('line word.idx')
            let el = words[word.idx]
            classes(el).add('underlined')
        })
    })
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
