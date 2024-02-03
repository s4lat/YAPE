const INIT_CONFIG = {
    "proxyList": [],
    "currentProxy": -1,
    "proxyEnabled": false
}

chrome.runtime.onInstalled.addListener(() => {
    console.log("[onInstalled] Initializing config...")
    chrome.storage.local.set(INIT_CONFIG).then(() => console.log("[onInstalled] Config initialized!"))
})