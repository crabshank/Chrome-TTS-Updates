var selec='';
var fcn=``;
var voice_data='';
var vol=0.5;
var rte=1.2;
const synth = window.speechSynthesis;
var voices=[];
//var ptch=1;
var addrs=[];
var slctrs=[];
var fcns=[];
var line_q=[];
var sbl=true;
var prg=false;
var lg_only=0;
var lg_frms=false;
var vtg_err=null;
const PT_ATTR = 'data-tts-pt';
let ptSeq = 0;
let observer = null;
let batchChain = Promise.resolve();

function pickText(el){
	return (el.innerText===null || typeof el.innerText==='undefined' || (el.innerText==='' && el.value !=='') ? el.value : el.innerText );
}

function isValid_tag(tg,slc){
	try{
		if( typeof tg !=='undefined' && typeof tg.matches!=='undefined' && tg.matches(slc) ){
				let tx=pickText(tg);
				if(tx!==null && typeof tx!=='undefined' && tx!==''){
					return [tx,true];
				}else{
					return [tx,false];
				}
		}else{
			return [null,false];
		}
	}catch(e){
		if(vtg_err===null || e.message!==vtg_err){
			vtg_err=e.message;
			console.error(e);
		}
		return [null,false];
	}
}

function removeEls(d, arr) {
    return arr.filter((a)=>{return a!==d});
}

function findIndexTotalInsens(string, substring, index) {
    string = string.toLocaleLowerCase();
    substring = substring.toLocaleLowerCase();
    for (let i = 0; i < string.length ; i++) {
        if ((string.includes(substring, i)) && (!(string.includes(substring, i + 1)))) {
            index.push(i);
            break;
        }
    }
    return index;
}

function blacklistMatch(array, t) {
    var found = false;
	var blSite='';
	var blSel='';
	var blFcn=``;
    if (!((array.length == 1 && array[0] == "") || (array.length == 0))) {
        let ts = t.toLocaleLowerCase();
        for (var i = 0; i < array.length; i++) {
            let spl = array[i].split('*');
            spl = removeEls("", spl);

            var spl_mt = [];
            for (let k = 0; k < spl.length; k++) {
                var spl_m = [];
                findIndexTotalInsens(ts, spl[k], spl_m);

                spl_mt.push(spl_m);


            }

            found = true;

            if ((spl_mt.length == 1) && (typeof spl_mt[0][0] === "undefined")) {
                found = false;
            } else if (!((spl_mt.length == 1) && (typeof spl_mt[0][0] !== "undefined"))) {

                for (let m = 0; m < spl_mt.length - 1; m++) {

                    if ((typeof spl_mt[m][0] === "undefined") || (typeof spl_mt[m + 1][0] === "undefined")) {
                        found = false;
                        m = spl_mt.length - 2; //EARLY TERMINATE
                    } else if (!(spl_mt[m + 1][0] > spl_mt[m][0])) {
                        found = false;
                    }
                }

            }
            if(found){
            		blSite = array[i];
           		 blSel = slctrs[i];
           		 blFcn = fcns[i];
          		  i = array.length - 1;
            }
        }
    }
    //console.log(found);
    return [found,blSite,blSel,blFcn];

}

var isCurrentSiteBlacklisted = function()
{
		return blacklistMatch(addrs, window.location.href);
};

const getVoices = () => {
  voices = synth.getVoices();
  checker();
};

function restore_options()
{
	if(typeof chrome.storage==='undefined'){
		restore_options();
	}else{
	chrome.storage.local.get(null, function(items)
	{
		if (Object.keys(items).length != 0)
		{
			//console.log(items);
			

		if(!!items.addrs_list && typeof  items.addrs_list!=='undefined'){
			addrs=JSON.parse(items.addrs_list);
		}		
		
		if(!!items.slc_list && typeof  items.slc_list!=='undefined'){
			slctrs=JSON.parse(items.slc_list);
		}

		if(!!items.fcn_list && typeof  items.fcn_list!=='undefined'){
			fcns=JSON.parse(items.fcn_list);
		}

		if(!!items.v_data && typeof  items.v_data!=='undefined'){
			voice_data=items.v_data;
		}	
		
		if(!!items.rate_v && typeof  items.rate_v!=='undefined'){
			rte=parseFloat(items.rate_v);
		}
		
		if(!!items.vol_v && typeof  items.vol_v!=='undefined'){
			vol=parseFloat(items.vol_v);
		}
		
		if(items.log_only_v!==null && typeof  items.log_only_v!=='undefined'){
			lg_only=parseInt(items.log_only_v);
		}
		
		if(items.log_frms_v!==null && typeof  items.log_frms_v!=='undefined'){
			lg_frms=items.log_frms_v;
		}
				
		var isBl=isCurrentSiteBlacklisted();
		if(lg_frms){
			console.log('TTS Updates - Frame URL: '+window.location.href);
		}
			if(isBl[0]){
				fcn=(typeof isBl[3]!=='undefined')?isBl[3]:``;
				selec=isBl[2];
				sbl=false;
				getVoices();
				checker();
			}
		}
		else
		{
			save_options();
		}
	});
	}
}

function save_options()
{
		chrome.storage.local.clear(function() {
	chrome.storage.local.set(
	{
		addrs_list: '[]',
		slc_list: '[]',
		fcn_list: '[]',
		v_data: '',
		rate_v: "1.2",
		vol_v: "0.5",
		log_only_v: 0,
		log_frms_v: false
	}, function()
	{
		console.log('Default options saved.');
		restore_options();
	});
		});

}

if (typeof synth.onvoiceschanged !== 'undefined') {
  synth.onvoiceschanged = getVoices;
}

function speak_line( txt,cancl){
	return new Promise(function(resolve){
        try{
let line=txt;
if(cancl){
	synth.cancel();
	resolve();
}else if(line!=''){

let vce;
let vix=voices.findIndex(voice => {return voice.name === voice_data; }); if (vix>=0){
	vce=voices[vix];
}else{
	vce=voices[0];
}

let speakText = new SpeechSynthesisUtterance(line);
		
	speakText.voice = vce;
	    // Set pitch and rate
    speakText.rate = rte;
   speakText.pitch =1;
    speakText.volume = vol;
	speakText.onend = (e) => {resolve();};
	speakText.onerror = (e) => {resolve();};
		synth.speak(speakText);
}
}catch(e){ resolve(); }
});
}

async function speak_lines(){
	while(line_q.length>0){
		prg=true;
		await speak_line(line_q[0],false);
		line_q=line_q.slice(1);
	}
	prg=false;
}


async function askProcText(pairs){
	const jobs=[];
	try{
		for(const p of pairs){
			const t='pt'+(++ptSeq)+'-'+Math.random().toString(36).slice(2);
			p[0].setAttribute(PT_ATTR,t);
			jobs.push({t:t, ln:p[1]});
		}
		const reply=await chrome.runtime.sendMessage({type:'tts:procText', fcn:fcn, jobs:jobs});
		if(reply && !reply.ok){ console.warn('TTS Updates - procText: '+reply.reason); }
		const vals=(reply && reply.ok && Array.isArray(reply.values))?reply.values:[];
		return pairs.map((p,i)=>{ return (typeof vals[i]==='undefined')?null:vals[i]; });
	}catch(e){
		console.error(e);
		return pairs.map(()=>null);
	}finally{
		for(const p of pairs){ p[0].removeAttribute(PT_ATTR); }
	}
}

function collectEls(mutations){
	let fnd_els=[];
	let g=[];
	for(let i=0, len=mutations.length; i<len; i++){
		let t=mutations[i];
		if(t.type==='attributes' && t.attributeName===PT_ATTR){ continue; } // our own tagging
		g=isValid_tag(t.target, selec);
		if(g[1]){ fnd_els.push([t.target, g[0]]); }
		let d=[...t.addedNodes];
		for(let k=0, len_k=d.length; k<len_k; k++){   // was: k<len  (bug)
			g=isValid_tag(d[k], selec);
			if(g[1]){ fnd_els.push([d[k], g[0]]); }
		}
	}
	return fnd_els;
}

async function handleBatch(fnd_els){
	let ptMap=new Map();
	if(fcn!==``){
		let vals=await askProcText(fnd_els);                 // ONE round trip
		for(let i=0, len=fnd_els.length; i<len; i++){ ptMap.set(fnd_els[i][0], vals[i]); }
	}
	let procText=(el,ln)=>{ return ptMap.get(el); };          // synchronous façade

	for(let i=0, len=fnd_els.length; i<len; i++){
		let m=fnd_els[i];
		if (fcn!==``){
			let pt=procText(m[0], m[1]);                     // <-- YOUR LINE, UNCHANGED
			if(typeof pt!=='undefined'){
				m.push(pt);
			}else{
				m.push(null);
			}
		}else{
			m.push(null);
		}
		if(m[2]!==null){ m.push(true); }else{ m.push(false); }
	}

	fnd_els=fnd_els.filter((f)=>{
		return f[3] ? f[2].trim()!=='' : f[1].trim()!=='';
	});

	if(lg_only>0){
		let disps=fnd_els.map((f)=>{
			if(f[3]){
				return {el:f[0], out_text:f[2], raw_text:f[1], frame_URL:window.location.href};
			}else{
				return {el:f[0], out_text:f[1], frame_URL:window.location.href};
			}
		});
		let cnt=0;
		for(let k=0, len=fnd_els.length;k<len;k++){
			if(cnt===0){ console.group('TTS Updates - "'+selec+'":'); }
			console.log(disps[k]);
			cnt++;
		}
		if(cnt>0){ console.groupEnd(); }
	}

	if(lg_only<2){
		let fnd_els_text=fnd_els.map((f)=>{ return f[3] ? f[2] : f[1]; });
		line_q.push(...fnd_els_text);
		if(!prg){ speak_lines(); }
	}
}

function checker(){
	if(selec==='' || sbl || voices.length===0 || observer!==null){ return; }
	observer=new MutationObserver((mutations)=>{
		let fnd_els=collectEls(mutations);                    // collect synchronously
		if(fnd_els.length>0){
			batchChain=batchChain.then(()=>handleBatch(fnd_els)).catch((e)=>{console.error(e);});
		}
	});
	observer.observe(document, {
		subtree:true, childList:true, attributes:true,
		attributeOldValue:true, characterData:true, characterDataOldValue:true
	});
}

restore_options();