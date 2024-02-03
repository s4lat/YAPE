const addProxyBtn = document.getElementById("addProxyBtn");
const proxyInput = document.getElementById("proxyInput");
const proxyList = document.getElementById("proxyList");


addProxyBtn.addEventListener("click", addProxy);
proxyInput.addEventListener("input", () => {
    const proxyStr = proxyInput.value;
    console.log("INPUT")
    try {
        new URL(proxyStr)
        addProxyBtn.disabled = false
    } catch (err) {
        addProxyBtn.disabled = true
    }
});

chrome.storage.local.get(null, (items) => {
    drawProxyList(items["proxyList"])
})

chrome.storage.local.onChanged.addListener((changes) => {
    if ("proxyList" in changes) {
        drawProxyList(changes["proxyList"].newValue)
    }
})

function drawProxyList(proxies){
    const proxyListElements = []
    for (const proxy of proxies) {
        const el = document.createElement("li")
        proxyListElements.push(
            el.innerText = `${proxy.scheme}://${proxy.host}/`
        )
        proxyListElements.push(document.createElement("br"))
    }

    proxyList.replaceChildren(...proxyListElements)
}

async function addProxy() {
    let proxyUrl;
    try {
        proxyUrl = new URL(proxyInput.value)
    } catch (e) {
        addProxyBtn.disabled = true
        return
    }

    chrome.storage.local.get(["proxyList"], (items) => {
        items["proxyList"].push({
            scheme: proxyUrl.protocol.replace(":", ""),
            login: proxyUrl.username,
            password: proxyUrl.password,
            host: proxyUrl.hostname,
            port: Number(proxyUrl.port)
        })
        chrome.storage.local.set(items, () => {
            console.log("[addProxy] Pushed new proxy to proxyList!")
            proxyInput.value = ""
        })
    })
}

async function setProxy() {
    console.log("[PROXY SET] Setting proxy...")

    const proxyStr = proxyInput.value
    try {
        const proxyUrl = new URL(proxyStr)
    } catch (err) {

    }

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