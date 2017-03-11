//

// console.log('INSIDE HTML')

// let antrax = document.getElementById('antrax-result')
const antrax = require('./antrax')
const _ = require('underscore')
const Events = require('component-events')
const classes = require('component-classes')
const Tree = require('./tree')

/* αὐτοῦ μοι μὲν αὐτοὺς οἵπερ Δαναοὺς μηδὲ ἐμοὶ ὅσοι οὐδὲν
δηλοῖ δέ μοι καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ ἤκιστα. πρὸ γὰρ τῶν Τρωικῶν οὐδὲν φαίνεται πρότερον κοινῇ ἐργασαμένη ἡ Ἑλλάς. δοκεῖ δέ μοι, οὐδὲ τοὄνομα τοῦτο  ξύμπασά πω εἶχεν, ἀλλὰ τὰ μὲν πρὸ Ἕλληνος τοῦ Δευκαλίωνος καὶ πάνυ οὐδὲ εἶναι ἡ ἐπίκλησις αὕτη. κατὰ ἔθνη δὲ ἄλλα τε καὶ τὸ Πελασγικὸν ἐπὶ πλεῖστον ἀφ' ἑαυτῶν τὴν ἐπωνυμίαν παρέχεσθαι. Ἕλληνος δὲ καὶ τῶν παίδων αὐτοῦ


  Ἐν ἐκείνῃ τῇ ὥρᾳ προσῆλθον οἱ μαθηταὶ τῷ Ἰησοῦ λέγοντες· Τίς ἄρα μείζων ἐστὶν ἐν τῇ βασιλείᾳ τῶν οὐρανῶν; 2καὶ προσκαλεσάμενος ὁ Ἰησοῦς παιδίον ἔστησεν αὐτὸ ἐν μέσῳ αὐτῶν καὶ εἶπεν· 3Ἀμὴν λέγω ὑμῖν, ἐὰν μὴ στραφῆτε καὶ γένησθε ὡς τὰ παιδία, οὐ μὴ εἰσέλθητε εἰς τὴν βασιλείαν τῶν οὐρανῶν. 4ὅστις οὖν ταπεινώσει ἑαυτὸν ὡς τὸ παιδίον τοῦτο, οὗτός ἐστιν ὁ μείζων ἐν τῇ βασιλείᾳ τῶν οὐρανῶν. καὶ ὃς ἐὰν δέξηται παιδίον τοιοῦτον ἓν ἐπὶ τῷ ὀνόματί μου, ἐμὲ δέχεται·

*/

let words;

require('electron').ipcRenderer.on('ping', (event, json) => {
    let oRes = document.getElementById('antrax-result')
    let obj = JSON.parse(json)
    log('MSG', obj)
    antrax.query(obj.sentence, obj.num, function(_words) {
        words = _words
        log('WORDS', words)

        drawHeader(words, obj.num)
        drawMorphs(words, obj.num)
    })
})

// поиск chains для current num
// chains мне нужны ТОЛЬКО для подчеркивания - пока names
// chain = {idx: num, idy: str-id}

// τῶν παλαιῶν
// δηλοῖ δέ μοι καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ ἤκιστα

function drawMorphs(words, num) {
    emptyDict()
    let current = words[num]
    // log('DRAW CURRENT ========', num, current)
    if (current.empty) return
    // 1- подчернуть chains и 2 - показать tree-current
    // let res =  conformNames(words, num)
    // if (res) {
    //     // log('LINE===', res.idxs) // rec.cur - ограничение morphs
    //     current = res.cur
    //     // underline(res.idxs)
    // }
    drawCurrent(current)
}
// καλῆς τῆς σκηνῆς
// λέγω
// καὶ ὃς ἐὰν δέξηται παιδίον τοιοῦτον ἓν ἐπὶ τῷ ὀνόματί μου, ἐμὲ δέχεται· // TXT
// εἰρήνη - peace

function drawCurrent(cur) {
    log('draw CURRENT', cur)
    let morphs = []
    let dicts = cur.dicts.sort().reverse()
    dicts.forEach(function(dict) {
        log('DICT BEFORE SHOW', dict)
        if (dict.pos == 'verb') showVerb(dict)
        else showName(dict)
    })
    // if (cur.term && cur.term.pos == 'verb') showVerb(cur.term)
    // if (cur.term && cur.term.pos != 'verb') showName(cur.term)
    // if (cur.plain) showForms([cur.plain]) // FIXME:
    // if (cur.forms) showForms(cur.forms)
    // if (cur.verbs) showVerbs(cur.verbs)
    // if (cur.names) showNames(cur.names)
}

// function showNames(names) {
//     names.forEach(function(name) {
//         showName(name)
//     })
// }

function showName(cur) {
    // log('SHOW NAME', cur)
    let oMorphs = q('#antrax-morphs')
    let oDict = creDict()

    let mstrs = compactNameMorph(cur)
    // log('MSTR', mstrs)
    let mstr = mstrs.join(', ')
    let dictpos = [cur.dict, cur.pos].join(' - ')
    if (cur.type) dictpos = [cur.type, dictpos].join(': ')
    let head = [dictpos, mstr].join('; ')
    if (!cur.trn) return // FIXME: th-part ἀγῶσι
    cur.trn = cur.trn.toString() // FIXME: true
    let strs = cur.trn.split(/\||\n/)
    let children = strs.map(function(str) { return {text: str}})
    let data = [{text: head, id: 'dictpos', children: children}]

    // log('NAME DATA', data)
    let tree = new Tree(oDict)
    tree.data(data)
}

function compactNameMorph(cur) {
    let result
    // log('MORPHS', cur.morphs)
    let gmorphs = _.groupBy(cur.morphs, 'numcase')
    let ggends = _.groupBy(cur.morphs, 'gend')
    // log('gmorphs', gmorphs)
    // log('SIZE m', _.keys(gmorphs), 'g', _.keys(ggends))
    let morphs = []
    if (_.keys(gmorphs).length <= _.keys(ggends).length) {
        for (let numcase in gmorphs) {
            let gends = gmorphs[numcase].map(function(gm) { return gm.gend})
            gends = _.uniq(gends).sort()
            // log('GENDS', gends)
            let str = gends.join('-')
            // let morph = [JSON.stringify(gends), numcase].join('.')
            let morph = [str, numcase].join(': ')
            // log('MORPH', morph)
            morphs.push(morph)
        }
    } else {
        for (let gend in ggends) {
            let numcases = ggends[gend].map(function(gg) { return gg.numcase})
            numcases = _.uniq(numcases).sort()
            numcases = removeVoc(numcases)
            // log('NUMCASES', numcases)
            let str = numcases.join('-')
            // let morph = [gend, JSON.stringify(numcases)].join('.')
            let morph = [gend, str].join(': ')
            morphs.push(morph)
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
    log('SHOW VERB', cur)
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
    let strs = cur.trn.split(/\||\n/)
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



// эта хрень должна реагировать только на обращение:
function removeVoc(morphs) {
    let cleans = []
    let hasNom = false
    morphs.forEach(function(morph) {
        if (morph == 'sg.nom') hasNom = true
        if (morph == 'pl.nom') hasNom = true
        if (morph == 'du.nom') hasNom = true
    })
    if (!hasNom) return morphs
    morphs.forEach(function(morph) {
        if (morph.split('.')[1] == 'voc') return
        // if (morph.split('.')[0] == 'du') return
        cleans.push(morph)
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
//  καὶ ὃς ἐὰν δέξηται παιδίον τοιοῦτον ἓν ἐπὶ τῷ ὀνόματί μου, ἐμὲ δέχεται· // TXT
// τοιαύτη, τοιοῦτο, τοιοῦτον ;;; ὀνόματι

function drawHeader(words, num) {
    // log('HEADER', words, num)
    let oHeader = q('#antrax-header')
    empty(oHeader)
    words.forEach(function(word, i) {
        let form = word.raw
        let span = sa(form)
        // let id = ['id_', idx].join('')
        span.idx = i
        // span.setAttribute('idx') = idx
        let space = cret(' ')
        oHeader.appendChild(span)
        oHeader.appendChild(space)
        classes(span).add('antrax-form')
        if (i == num) classes(span).add('antrax-current')
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

function emptyDict() {
    let uns = qs('.underlined')
    uns.forEach(function(el) {
        classes(el).remove('underlined')
    })
    let oMorphs = q('#antrax-morphs')
    empty(oMorphs)
    let odicts = q('#antrax-dicts')
    remove(odicts)
    let oDicts = cre('div')
    oDicts.id = 'antrax-dicts'
    let parent = q('#antrax-results')
    parent.appendChild(oDicts)
}



// μοι καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ
function underline(idxs) {
    let oWords = qs('#antrax-header span.antrax-form')
    idxs.forEach(function(idx) {
        let el = oWords[idx]
        classes(el).add('underlined')
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
    let oWords = qs('#antrax-header span.antrax-form')
    let size = oWords.length
    let dir = (e.which == 37) ? -1 : 1
    let next = idx+dir
    if (next == size) next = 0
    if (next == -1) next = size -1
    let nextEl = oWords[next]
    classes(el).remove('antrax-current')
    classes(nextEl).add('antrax-current')
    drawMorphs(words, next)
}

let x = q('#antrax-close')
x.onclick = function() {
    closeAll()
}


function log() { console.log.apply(console, arguments); }

/// ================================================== OLD

function getNames(current) {
    let names = []
    if (current.names) names = (current.names)
    if (current.term && current.term.pos == 'art') names.push(current.term)
    // if (current.term) names.push(current.term)
    return (names.length) ? names: null
}

/* пока что полная жопа. tode - neut.sg.acc, neut.sg.nom - выбирает причастие palaion, что не верно
   оставить пока только артикли? А в реальности - постепенно - сначала артикли, отбросить лишнее. Потом смотреть местоимения
   потому что артикли главнее, а местоимения могут бить дальше
   то есть делать два цикла?
   сейчас работает, но код - жуть

*/



// function conformNames_(words, num) {
//     let current = words[num]
//     let cnames = getNames(current)
//     if (!cnames) return
//     let dist = 4
//     let chains = []
//     cnames.forEach(function(cname, idy) {
//         log('CONFName', idy, cname)
//         let cmorphs = cname.morphs
//         let cstrs = cmorphs.map(function(m) { return JSON.stringify(m)})
//         cstrs = _.uniq(cstrs)
//         let chain = [cname]
//         for (let idx in words) {
//             if (idx == num) continue
//             if (idx < num - dist) continue
//             if (idx > num + dist) continue
//             let other = words[idx]
//             let onames = getNames(other)
//             if (!onames) continue
//             log('ONAMES', onames)
//             // похоже, чушь. Common должн быть одинаковый в chain
//             onames.forEach(function(oname, idz) {
//                 let omorphs = oname.morphs
//                 let ostrs = omorphs.map(function(m) { return JSON.stringify(m)})
//                 ostrs = _.uniq(ostrs)
//                 let common = _.intersection(cstrs, ostrs)
//                 log('STRS', cstrs, ostrs)
//                 log('COMM', common)
//                 if (!common.length) return
//                 let cmn = {idx: idx, idz: idz, common: common}
//                 chain.push(cmn)
//             })
//         }
//         if (chain.length < 2) return
//         chains.push(chain)
//         log('CHAIN', chain)
//     })
//     if (!chains.length) return
//     let max = _.max(chains.map(function(chain) { return chain.length }))
//     // log('MAX', max);
//     if (!max) return
//     let mchains = _.select(chains, function(chain) { return chain.length == max })
//     if (!mchains.length) return
//     log('MCHS', mchains);
//     // let newc = mchain[0]
//     let res = []
//     mchains.forEach(function(chain) {
//         let newc = chain[0]
//         let idxs = chain.slice(1).map(function(m) { return m.idx})
//         idxs = _.uniq(idxs)
//         let cms = chain.slice(1).map(function(m) { return m.common })[0]
//         let nmorphs = cms.map(function(common) { return JSON.parse(common)})
//         // log('CMS', cms)
//         newc.omorphs = newc.morphs
//         newc.morphs = nmorphs
//         let r = {newc: newc, idxs: idxs, cms: cms}
//         res.push(r)
//     })
//     // log('RRRRR', res)
//     let idxs = res[0].idxs
//     let newcs = res.map(function(r) {return r.newc })

//     let cur = {names: [], terms: []}
//     newcs.forEach(function(newc) {
//         if (newc.pos == 'name') cur.names.push(newc)
//         else if (newc.type == 'term') cur.term = newc
//     })
//     let result = {cur: cur, idxs: idxs}
//     return result
// }
