const synth = window.speechSynthesis;
var slv=document.getElementById("voice-select");
var rteLbl = document.getElementById('rteLb');
var rterg = document.getElementById('rter');
var volLbl = document.getElementById('volL');
var volSd = document.getElementById('vol');
var tstl=document.getElementById("tst");
var plyb=document.getElementById("ply");
var svbt=document.getElementById("save");
var lg_only=document.getElementById("log_only");
var lg_frms=document.getElementById("log_frm_urls");
var sts=document.getElementById("stats");
var voice_data='';
var voices=[];

function setHeights(sc){
			[...sc.children].forEach((k)=>{
				k.style.height='min-content';
				k.style.height=k.scrollHeight+3;
		});
}

function create_sct(){
		let sc=document.createElement('section');
		sc.style.cssText='display: inline !important;';
		sc.className='site_sets';
		sc.innerHTML='<textarea placeholder="URL (Use asterisks with slashes)" style="box-shadow: 0 0 0px 1px black; border-width: 0px; width:32.5%;"></textarea><textarea placeholder="CSS selector (Do not use any quotation marks)" style="box-shadow: black 0px 0px 0px 1px;border-width: 0px;width: 32.5%;margin-left: 0.16%;"></textarea><textarea placeholder="(el, ln)=>{ // ln=pickText(el); ONLY WRITE FUNCTION BODY IN THIS TEXT BOX!\n\tlet new_line=…;\n\t⋮\n\treturn new_line;\n}" style="box-shadow: black 0px 0px 0px 1px;border-width: 0px;width: 32.5%;margin-left: 0.16%;"></textarea><br><br>';
		return sc;
}

let sc1=create_sct();
sts.insertAdjacentElement('beforebegin', sc1);
setHeights(sc1);

volSd.oninput=function(event){
	synth.cancel();
	volLbl.innerText= 'Volume: '+volSd.valueAsNumber.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false});
}

function pickText(el){
	return (el.innerText===null || typeof el.innerText==='undefined' || (el.innerText==='' && el.value !=='') ? el.value : el.innerText );
}

let sct=[...document.querySelectorAll('SECTION.site_sets')];
function forceNewSct(sci){
		let sc=create_sct();
		sci.insertAdjacentElement('afterend', sc);
		setHeights(sc);
		sc.oninput= function(event){
			let scs=event.target.parentElement;
			setHeights(scs);
			let tst=[...document.querySelectorAll('SECTION.site_sets')];
			if (scs===tst[tst.length-1]){
			chk(scs,0);
			}else{
			chk(scs,1);
			}
		}
		return sc;
}

let chk=function(sci,init){
	let u=sci.children[0];
	let f=sci.children[1];
	let f2=sci.children[2];
let sct2=[...document.querySelectorAll('SECTION.site_sets')];
	if (((u.value!="" && f.value!="")&&(sct2.length==1))||((u.value!="" && f.value!="")&&(init!=1)&&(sct2.length>1))){
		forceNewSct(sci);
	}else if((u.value=="" && f.value==""&& f2.value=="")&&(sct2.length>1)&&(init!=2)){
		sci.remove();
	}
}

sct[0].oninput= function(event){
	chk(sct[0],1);
	setHeights(sct[0]);
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
		if (array[i] !== d)
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

function setAddrCSS(vs,ix){
	let arr=JSON.parse(vs);
	for(let i=0, len=arr.length; i<len; i++){
		let sss=[...document.querySelectorAll('SECTION.site_sets')];
		let ss=sss[i];
		if(i>sss.length-1){
			ss=forceNewSct(sss[sss.length-1]);
		}
		ss.children[ix].value=arr[i];
		setHeights(ss);
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
		let fcns=[];
	let validate = true;	
	for(let k=0, len=scts.length; k<len; k++){

	let lstChk = scts[k].children[0].value.trim();
	let slct = scts[k].children[1].value.trim();
	let fcn = scts[k].children[2].value.trim();
	
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
			fcns.push(fcn);
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
			fcn_list: JSON.stringify(fcns),
			v_data: slv.selectedOptions[0].getAttribute('data-name'),
			rate_v: rterg.value,
			vol_v: volSd.value,
			log_only_v: lg_only.selectedIndex,
			log_frms_v: lg_frms.checked
		}, function()
		{
			sts.innerText = 'Options saved.';
			setTimeout(function()
			{
				sts.innerText = '';
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
			setAddrCSS(unDef(items.addrs_list,'[]'),0);
			setAddrCSS(unDef(items.slc_list,'[]'),1);
			setAddrCSS(unDef(items.fcn_list,'[]'),2);
			rterg.value = unDef(items.rate_v,"1.2");
			volSd.value = unDef(items.vol_v,"0.5");
			lg_only.selectedIndex=unDef(items.log_only_v,0);
			lg_frms.checked=unDef(items.log_frms_v,false);
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
		fcn_list: '[]',
		v_data: '',
		rate_v: "1.2",
		vol_v: "0.5",
		log_only_v: 0,
		log_frms_v: false
	}, function(){
		restore_options();
	});
		});
}

restore_options();