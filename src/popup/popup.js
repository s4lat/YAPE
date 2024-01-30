console.log("JS LOADED")
document.getElementById("setProxyBtn").addEventListener("click", setProxy);
document.getElementById("unsetProxyBtn").addEventListener("click", unsetProxy);

async function setProxy() {
    console.log("[PROXY SET] Setting proxy...")

    const proxyInput = document.getElementById("proxyInput")
    const proxyStr = proxyInput.value
    const proxyUrl = new URL(proxyStr)

    chrome.proxy.settings.set({
            value: {
                mode: 'fixed_servers',
                rules: {
                    singleProxy: {
                        scheme: proxyUrl.protocol.replace(":", ""),
                        host: proxyUrl.hostname,
                        port: Number(proxyUrl.port),
                    },
                    bypassList: ["<local>"]
                }
            },
            scope: 'regular',
        },
        () => {
            console.log(`[PROXY SET] Set proxy to: ${proxyStr}`)
        }
    )

    if (proxyUrl.username !== "") {
        chrome.storage.local.set({
            proxyUsername: proxyUrl.username,
            proxyPassword: proxyUrl.password
        }).then(
            () => {
                chrome.webRequest.onAuthRequired.addListener(authProxy,
                    {urls: ["<all_urls>"]}, ['asyncBlocking']);
            }
        )
    }
}

async function unsetProxy() {
    console.log("[PROXY SET] Unsetting proxy...")

    chrome.proxy.settings.clear({scope: 'regular'}, () => {
        console.log("[PROXY UNSET]")
    })
    chrome.webRequest.onAuthRequired.removeListener(authProxy)
}

async function authProxy(details, callbackFn) {
    const keys = await chrome.storage.local.get(["proxyUsername", "proxyPassword"])
    callbackFn({
        authCredentials: {
            username: keys.proxyUsername,
            password: keys.proxyPassword
        }
    })
}