'use strict';

try {

async function createOffscreen() {
  await chrome.offscreen.createDocument({
	url: 'offscreen.html',
	reasons: ['BLOBS'],
	justification: 'Keep service worker running',
  }).catch(() => {});
}

function createOffscreen2() {
	if(createOffscreen!==null){
		createOffscreen();
		createOffscreen=null;
	}
}

chrome.runtime.onStartup.addListener(createOffscreen2);
createOffscreen2();

const ATTR = 'data-tts-pt';

function userScriptsReady() {
  try {
    if (!chrome.userScripts || typeof chrome.userScripts.execute !== 'function') return false;
    chrome.userScripts.getScripts().catch(() => {});   // probe without unhandled rejection
    return true;
  } catch (e) { return false; }
}

function buildCode(fcn, jobs) {
  return `
(async () => {
  const ATTR = ${JSON.stringify(ATTR)};
  const JOBS = ${JSON.stringify(jobs)};
  const procText = (el, ln) => {
${fcn}
  };
  const out = [];
  for (const job of JOBS) {
    const el = document.querySelector('[' + ATTR + '="' + job.t + '"]');
    if (el === null) { out.push(null); continue; }
    try {
      const r = await procText(el, job.ln);
      out.push((typeof r === 'undefined' || r === null) ? null : String(r));
    } catch (err) { out.push(null); }
  }
  return out;
})()`;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'tts:procText') return;
  if (sender.id !== chrome.runtime.id || !sender.tab) {
    sendResponse({ ok: false, reason: 'bad sender', values: [] }); return;
  }
  if (!userScriptsReady()) {
    sendResponse({ ok: false, reason: 'userScripts unavailable', values: [] }); return;
  }

  chrome.userScripts.execute({
    target: { tabId: sender.tab.id, frameIds: [sender.frameId] },
    js: [{ code: buildCode(msg.fcn, msg.jobs) }],
    world: 'USER_SCRIPT',
    injectImmediately: true
  }).then(results => {
    const r = results && results[0];
    if (!r || r.error) {
      sendResponse({ ok: false, reason: r ? r.error : 'no result', values: [] });
    } else {
      sendResponse({ ok: true, values: Array.isArray(r.result) ? r.result : [] });
    }
  }).catch(err => sendResponse({ ok: false, reason: String(err), values: [] }));

  return true;   // keep the channel open for the async sendResponse
});

}catch (e) {
  console.error(e);
}