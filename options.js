const synth = window.speechSynthesis;
var slv=document.getElementById("voice-select");
var rteLbl = document.getElementById('rteLb');
var rterg = document.getElementById('rter');
var volLbl = document.getElementById('volL');
var volSd = document.getElementById('vol');
var tstl=document.getElementById("tst");
var plyb=document.getElementById("ply");
var svbt=document.getElementById("save");
var voice_data='';
var voices=[];

volSd.oninput=function(event){
	synth.cancel();
	volLbl.innerText= 'Volume: '+volSd.valueAsNumber.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false});
}

function pickText(el){
	return (el.innerText===null || typeof el.innerText==='undefined' || (el.innerText==='' && el.value !=='') ? el.value : el.innerText );
}

let sct=[...document.querySelectorAll('SECTION.site_sets')];
function forceNewSct(sci){
		let sc=document.createElement('section');
		sc.style.cssText='display: list-item !important;';
		sc.className='site_sets';
		sc.innerHTML='<textarea placeholder="URL (Use asterisks with slashes)" style="box-shadow: 0 0 0px 1px black; border-width: 0px; width:48%;"></textarea><textarea placeholder="CSS selector (Do not use any quotation marks)" style="box-shadow: 0 0 0px 1px black; border-width: 0px; width:48%;"></textarea><br><br>';
		sci.insertAdjacentElement('afterend', sc);
		sc.oninput= function(event){
			let tst=[...document.querySelectorAll('SECTION.site_sets')];
			if (sc===tst[tst.length-1]){
			chk(sc,0);
			}else{
			chk(sc,1);
			}
		}
		return sc;
}

let chk=function(sci,init){
	let u=sci.children[0];
	let f=sci.children[1];
let sct2=[...document.querySelectorAll('SECTION.site_sets')];
	if (((u.value!="" && f.value!="")&&(sct2.length==1))||((u.value!="" && f.value!="")&&(init!=1)&&(sct2.length>1))){
		forceNewSct(sci);
	}else if((u.value=="" && f.value=="")&&(sct2.length>1)&&(init!=2)){
	sci.remove();
	}
}

sct[0].oninput= function(event){
	chk(sct[0],1);
}


function speak_tag_smpl(el,cancl){
let line=pickText(el);
if(cancl){
	synth.cancel();
}else if(line!=''){
	let selectedVoice=slv.selectedOptions[0].getAttribute('data-name');
	let vce;
	let vix=voices.findIndex(voice => {return voice.name === selectedVoice; }); if (vix>=0){
		vce=voices[vix];
	}else{
		vce=voices[0];
	}

	let speakText = new SpeechSynthesisUtterance(line);
			
		speakText.voice = vce;
			// Set pitch and rate
		speakText.rate = rterg.valueAsNumber;
		//speakText.pitch =1;
		speakText.volume = volSd.valueAsNumber;
		/*speakText.onend = e => {};*/
		synth.speak(speakText);
}
}

plyb.onclick=(event)=>{
	speak_tag_smpl(tstl,false);
}

const getVoices = () => {
voices = synth.getVoices();
  // Loop through voices and create an option for each one
  voices.forEach(voice => {
    // Create option element
    const option = document.createElement('option');
    // Fill option with voice and language
    option.textContent = voice.name + ' (' + voice.lang + ')';

    // Set needed option attributes
    option.setAttribute('data-lang', voice.lang);
    option.setAttribute('data-name', voice.name);
    slv.appendChild(option);	
  });
  setVoice(voice_data);
};


function removeEls(d, array){
	var newArray = [];
	for (let i = 0; i < array.length; i++)
	{
		if (array[i] != d)
		{
			newArray.push(array[i]);
		}
	}
	return newArray;
}

function unDef(v,d,r){
	if(typeof r==='undefined'){
		return (typeof v !=='undefined')?v:d;
	}else{
		return (typeof v !=='undefined')?r:d;
	}
}

function setAddrCSS(vs,addrs){
	let arr=JSON.parse(vs);
	for(let i=0, len=arr.length; i<len; i++){
		let sss=[...document.querySelectorAll('SECTION.site_sets')];
		let ss=sss[i];
		if(i>sss.length-1){
			ss=forceNewSct(sss[sss.length-1]);
		}
		ss.children[(addrs)?0:1].value=arr[i];
	}
	let sss=[...document.querySelectorAll('SECTION.site_sets')];
	sss[sss.length-1].dispatchEvent(new Event('input'));
}

function setVoice(dn){
		let opts=[...slv.options];
		if(dn===''){
			slv.selectedIndex=0;
		}else{
			let ix=opts.findIndex((v)=>{return v.getAttribute('data-name')===dn;}); if(ix>=0){
				slv.selectedIndex=ix;
			}
		}
}

var saver =function(){
		let scts=[...document.querySelectorAll('SECTION.site_sets')];
		let addrs=[];
		let slcs=[];
	let validate = true;	
	for(let k=0, len=scts.length; k<len; k++){

	let lstChk = scts[k].children[0].value.trim();
	let slct = scts[k].children[1].value.trim();
	if(lstChk!=='' && slct!==''){
		if (lstChk.split('/').length != 1)
		{

			if (lstChk.split('://')[0] == "")
			{
				console.warn(lstChk + ' is invalid');
				validate = false;
				k=len-1;
			}

			if (lstChk.split('://')[lstChk.split('://').length + 1] == "")
			{
				console.warn(lstChk + ' is invalid');
				validate = false;
				k=len-1;
			}

			if (lstChk.split('://').join('').split('/').length !== removeEls("", lstChk.split('://').join('').split('/')).length)
			{
				console.warn(lstChk + ' is invalid');
				validate = false;
				k=len-1;
			}

		}
	
		if (validate){
			addrs.push(lstChk);
			slcs.push(slct);
		}
	}

}
	if (validate)
	{
		

			chrome.storage.sync.clear(function() {
		chrome.storage.sync.set(
		{
			addrs_list: JSON.stringify(addrs),
			slc_list: JSON.stringify(slcs),
			v_data: slv.selectedOptions[0].getAttribute('data-name'),
			rate_v: rterg.value,
			vol_v: volSd.value,
		}, function()
		{
			let status = document.getElementById('stats');
			status.innerText = 'Options saved.';
			setTimeout(function()
			{
				status.innerText = '';
			}, 1250);
		});
			});
			
}else{
	alert('Blacklist textarea contents invalid!');
}
	 }
 
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
			voice_data=unDef(items.v_data,'');
			setAddrCSS(unDef(items.addrs_list,'[]'),true);
			setAddrCSS(unDef(items.slc_list,'[]'),false);
			rterg.value = unDef(items.rate_v,"1.2");
			volSd.value = unDef(items.vol_v,"0.5");
			volLbl.innerText= 'Volume: '+volSd.valueAsNumber.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false});
			getVoices();
			if (typeof synth.onvoiceschanged !== 'undefined') {
				synth.onvoiceschanged = getVoices;
			}
			svbt.onclick = () => saver();
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
		vol_v: "0.5"
	}, function(){
		restore_options();
	});
		});
}

restore_options();