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
        log('clause:', clause)
        // oRes.textContent = obj.sentence
        // check(obj.sentence)

        let num = obj.num
        drawHeader(clause, num)
        drawMorph(clause, num)
    })
})

function drawMorph(clause, num) {
    let anchor = document.getElementById('antrax-tree');
    empty(anchor)
    let chains = conform(clause, num)
    log('CHAINS', chains)
    // 1- подчернуть chains и 2 - показать tree-current
    underline(clause, chains)
    let tree = new Tree(anchor)
    let data = parseCurrent(chains, num)
    tree.data(data)
}

// border-bottom: 1px solid blue;
// border-bottom-color: green;
// или м.б разные words, кроме current? А если разные, то что делать?
// и как будут еще сгруппированы chains? а если прибавится связей?
// .πωνυμ

function underline(clause, chains) {
    let uns = qs('.underlined')
    uns.forEach(function(el) {
        // log('UNDERLINED', el)
        classes(el).remove('underlined')
    })

    let chain = chains[0] // any chain - пока что простейший вариант, все chains из одинаковых words
    if (!chain || !chain.length) return // это уйдет, когда chain в terms будет массив FIXME:
    log('CCCCCC', chains)
    if (chain.length < 2) return
    let words = qs('#antrax-header span.antrax-form')
    chain.forEach(function(word) {
        let el = words[word.idx]
        classes(el).add('underlined')
    })
}

// здесь поиск chains для num
function conform(clause, num) {
    // log('CONFORM', clause, num);
    let currents = clause[num]
    currents = _.select(currents, function(raw) { return !raw.empty})
    log('CUR', currents)
    let chains = [];
    currents.forEach(function(cur) {
        if (!cur.gend) {
            chains.push([cur]);
            return;
        }
        // log('cur-dict', cur.dict);
        let chain = [];
        for (let idx in clause) {
            let rows = clause[idx]
            // τῶν παλαιῶν ἀσθένειαν
            rows.forEach(function(word, idy) {
                // log('W', idx, word.form);
                if (cur.gend != word.gend || cur.numcase != word.numcase) return
                // if (!cur.dict) //
                // if (word.dict && word.dict.slice(-cur.dict.length) != cur.dict) return;
                chain.push(word);
            });
        }
        // if (chain.length < 2) return;
        chains.push(chain);
        let max = _.max(chains.map(function(ch) { return ch.length; }));
        // log('MAX', max);
        chains = _.select(chains, function(ch) { return ch.length == max; });
    });
    return chains;
}


function parseCurrent(chains, num) {
    let currents = _.select(_.flatten(chains), function(ch) { return ch.idx  == num })
    // если не глагол . . .
    // все типы - сколько их? <<<<<<<<<<<<<<<<<<==========
    // <<=========================================
    // и словарь - по одному var
    // причастия начать - нужна таблица стемов глаголов?
    // кажется, можно без таблицы все, кроме leluka - не считая неправильных
    // terms залить заново, не form и dict
    //
    //  καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ ἤκιστα
    //
    let data = []
    let gdicts = _.groupBy(currents, 'dict')
    for (let gdict in gdicts) {
        let group = gdicts[gdict]
        let trns = group[0].trn.split(' | ')
        let children = trns.map(function(trn) { return {text: trn}})
        let gmorphs = _.groupBy(group, 'numcase')
        let ggends = _.groupBy(group, 'gend')
        log('SIZE m', _.keys(gmorphs), 'g', _.keys(ggends))
        // καὶ τόδε τῶν παλαιῶν ἀσθένειαν οὐχ
        if (_.keys(gmorphs) > _.keys(ggends)) {
            for (let numcase in gmorphs) {
                let gends = gmorphs[numcase].map(function(gm) { return gm.gend})
                let morph = [JSON.stringify(gends), numcase].join('.')
                let header = [gdict, morph].join(': ')
                // let oMorph = sa(header)
                // classes(oMorph).add('oMorph')
                let dobj = {text: header, id: gdict, children: children}
                data.push(dobj)
            }
        } else {
            for (let gend in ggends) {
                let morphs = ggends[gend].map(function(gg) { return gg.numcase})
                let morph = [gend, JSON.stringify(morphs)].join('.')
                let header = [gdict, morph].join(': ')
                let dobj = {text: header, id: gdict, children: children}
                data.push(dobj)
            }
        // let gends = []
        // log('GM', gdict, 33, gmorphs)
        }
    }

    currents.forEach(function(cur, idx) {
        let morph = [cur.gend, cur.numcase].join('.')
        let header = [cur.dict, morph].join(': ')
        let trns = cur.trn.split(' | ')
        let children = trns.map(function(trn) { return {text: trn}})
        let dobj = {text: header, id: idx.toString(), children: children}
        // data.push(dobj)
    })
    // log('DATA curs', currents)
    return data
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
    let oHeader = q('#antrax-header')
    empty(oHeader)
    let idxs = _.keys(clause)
    idxs.forEach(function(idx, i) {
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
    drawMorph(clause, next)
}

let x = q('#antrax-close')
x.onclick = function() {
    closeAll()
}


function log() { console.log.apply(console, arguments); }
