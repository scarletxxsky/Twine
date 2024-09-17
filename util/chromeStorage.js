async function persistSync(entries) { return chrome.storage.sync.set(entries) }
async function persistLocal(entries) { return chrome.storage.local.set(entries) }
async function persistSession(entries) { return chrome.storage.session.set(entries) }

async function readSync(keys) { return chrome.storage.sync.get(keys) }
async function readLocal(keys) { return chrome.storage.local.get(keys) }
async function readSession(keys) { return chrome.storage.session.get(keys) }