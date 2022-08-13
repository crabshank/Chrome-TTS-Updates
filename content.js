var selec='';
var voice_data='';
var vol=0.5;
var rte=1.2;
const synth = window.speechSynthesis;
var voices=[];
//var ptch=1;
var addrs=[];
var slctrs=[];
var sbl=true;
var line_q=[];
var prg=false;
var lg_only=0;
var lg_frms=false;
var vtg_err=null;
var last_read=null;
var last_disp=null;

function pickText(el){
	return (el.innerText===null || typeof el.innerText==='undefined' || (el.innerText==='' && el.value !=='') ? el.value : el.innerText );
}

function isValid_tag(tg,slc){
	let tx=pickText(tg);
	try{
		return ( ( typeof tg.matches!=='undefined' && tg.matches(slc) && tx!==null && typeof tx!=='undefined' && tx!=='')?true:false);
	}catch(e){
		if(vtg_err===null || e.message!==vtg_err){
			vtg_err=e.message;
			console.error(e);
		}
		return false;
	}
}

function removeEls(d, array) {
    return array.filter((a)=>{return a!=d});
}

function getSelectorAllShadow(docm, slc){
var shrc=[docm];
var shrc_l=1;

let srCnt=0;

while(srCnt<shrc_l){
	allNodes=[shrc[srCnt],...shrc[srCnt].querySelectorAll('*')];
	for(let i=0, len=allNodes.length; i<len; i++){
		if(!!allNodes[i] && typeof allNodes[i] !=='undefined' && typeof allNodes[i].matches!=='undefined' && allNodes[i].matches(slc) && i>0){
			shrc.push(allNodes[i]);
		}

		if(!!allNodes[i].shadowRoot && typeof allNodes[i].shadowRoot !=='undefined'){
			let c=allNodes[i].shadowRoot.children;
			shrc.push(...c);
		}
	}
	srCnt++;
	shrc_l=shrc.length;
}

	let out=shrc.filter((c)=>{return ( typeof c.matches!=='undefined' && c.matches(slc) ) ;});
	return out;
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
    if (!((array.length == 1 && array[0] == "") || (array.length == 0))) {
        ts = t.toLocaleLowerCase();
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
          		  i = array.length - 1;
            }
        }
    }
    //console.log(found);
    return [found,blSite,blSel];

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
	chrome.storage.sync.get(null, function(items)
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
		chrome.storage.sync.clear(function() {
	chrome.storage.sync.set(
	{
		addrs_list: '[]',
		slc_list: '[]',
		v_data: '',
		rate_v: "1.2",
		vol_v: "0.5",
		log_only_v: false,
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

function speak_tag(el,cancl){
	return new Promise(function(resolve){ 
let line=pickText(el);
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
});
}

async function speak_tags(){
	while(line_q.length>0){
		prg=true;
		if(last_read===null || line_q[0]!==last_read){
			await speak_tag(line_q[0],false);
			last_read=line_q[0];
		}
		line_q=line_q.slice(1);
	}
	prg=false;
}

function checker(){
if(selec!=='' && !sbl  && voices.length>0){

	if (typeof observer === "undefined") {
		const observer = new MutationObserver((mutations) => {
			let fnd_els=[]; 
				
			for(let i=0, len=mutations.length; i<len;i++){
				let t=mutations[i];
				if(isValid_tag(t.target, selec)){
					fnd_els.push(t.target);
				}
				
					let d=[...t.addedNodes];
					let ix=d.findIndex((n)=>{return isValid_tag(n, selec); } ); if(ix>=0){
						fnd_els.push(d[ix]);
					}
				
			}
					
				if(fnd_els.length>0){
					if(lg_only>0){
						let disps=fnd_els.map((f)=>{return {el: f, text: pickText(f), frame_URL: window.location.href};});
						let cnt=0;
						for(let k=0, len=fnd_els.length;k<len;k++ ){
							if(last_disp===null || disps[k].text!==last_disp){
								if(cnt===0){
									console.group('TTS Updates -"'+selec+'":');
								}
								console.log(disps[k]);
								last_disp=disps[k].text;
								cnt++;
							}
						}
						if(cnt>0){
							console.groupEnd();
						}
					}
					
					if(lg_only<2){
						line_q.push(...fnd_els);
						if(!prg){
							speak_tags();
						}
					}
				}
				
		});

			observer.observe(document, {
				subtree: true,
				childList: true,
				attributes: true,
				attributeOldValue: true,
				characterData: true,
				characterDataOldValue: true
			});

	}
}
}

restore_options();