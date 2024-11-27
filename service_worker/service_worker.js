let requestListener = []

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case "SAP_IS_UNIFY_REQUEST":
            let request = requestListener?.[`${message.requestType}_${message.tenantId}`]
            if (request) { //Request running
                //If the existing requestListener is more than 25 seconds old, create a new one
                //todo: Reassign the requestOwner if the tab is closed before finishing
                if (request.requestStarted > 25000) {
                    console.log(`Creating unifiable request for ${message.requestType}_${message.tenantId}`)
                    requestListener[`${message.requestType}_${message.tenantId}`] = {
                        requestStarted: Date.now(),
                        requestOwner: sender.id,
                        subscribers: request.subscribers
                    }
                    sendResponse({
                        status: "request"
                    })
                } else {
                    console.log(`Adding subscriber for request ${message.requestType}_${message.tenantId}`)
                    request.subscribers.push(sendResponse)
                }
                return true
            } else { //No request running
                readSession([`${message.requestType}_${message.tenantId}`]).then(resolve => {
                    if ((Object.keys(resolve).length === 0) || (Date.now() - resolve[`${message.requestType}_${message.tenantId}`].fetchTimestamp > ((message.maxAge ?? 60) * 1000))) {
                        console.log(`Creating unifiable request for ${message.requestType}_${message.tenantId}`)
                        requestListener[`${message.requestType}_${message.tenantId}`] = {
                            requestStarted: Date.now(),
                            requestOwner: sender.id,
                            subscribers: []
                        }
                        sendResponse({
                            status: "request"
                        })
                    } else {
                        console.log(`Returning cache for ${message.requestType}_${message.tenantId}`)
                        sendResponse({
                            status: "cache",
                            [message.requestType]: resolve[`${message.requestType}_${message.tenantId}`][message.requestType]
                        })
                    }
                }).catch(reject => {
                    console.log("Error in processing")
                    console.log(reject)
                    sendResponse({reason: reject})
                })
                return true
            }
        case "SAP_IS_UNIFY_RESOLVE":
            console.log(`Request finished for ${message.requestType}_${message.tenantId}`)
            if (message.data) {
                persistSession({
                    [`${message.requestType}_${message.tenantId}`]: {
                        [message.requestType]: message.data,
                        fetchTimestamp: Date.now()
                    }
                })
                requestListener?.[`${message.requestType}_${message.tenantId}`].subscribers.forEach(it => {
                    try {
                        it({status: "subscribed", data: message.data})
                    } catch (e) {
                        console.log(e, it)
                    }
                })
            }
            delete requestListener[`${message.requestType}_${message.tenantId}`]
            console.log(`Deleted request for ${message.requestType}_${message.tenantId}`)
            sendResponse({status: "success"})
        case "CFG_REQUEST":
            readSession(["configuration"]).then(session => {
                if (!session.configuration) {
                    //region Local
                    readLocal(["configuration"]).then(local => {
                        if (!local.configuration) {
                            //region Default
                            fetch(chrome.runtime.getURL("util/defaultConfig.json")).then(fetch => {
                                fetch.json().then(defaultConfiguration => {
                                    sendResponse({configuration: defaultConfiguration})
                                    persistSession({configuration: configuration})
                                    persistLocal({configuration: configuration})
                                    return true
                                }).catch(() => {
                                    sendResponse({configuration: null})
                                })
                            }).catch(() => {
                                console.error("Could not read default configuration")
                                sendResponse({configuration: null})
                            })
                            //endregion Default
                        } else {
                            sendResponse({configuration: local.configuration})
                            persistSession({configuration: local.configuration})
                        }
                    })
                    //region Local
                } else {
                    sendResponse({configuration: session.configuration})
                }
            })
            return true
        case "SAP_IS_CFG_MIGRATE":
        //And notify other tabs, maybe?
        case "SAP_IS_CFG_INIT":
            persistLocal({configuration: message.configuration}).then((resolve) => {
                persistSession({configuration: message.configuration})
                    .then(resolve => {
                        sendResponse({status: 0, response: resolve})
                    })
                    .catch(reject => {
                        console.log(reject)
                        sendResponse({status: -1, response: reject})
                    })
            }).catch((reject) => {
                console.log(reject)
                sendResponse({status: -1, response: reject})
            })
            return true
        case "CFG_CHANGE":
            persistLocal({configuration: message.configuration}).then((resolve) => {
                persistSession({configuration: message.configuration})
                    .then(resolve => {
                        sendResponse({status: 0, message: "Session configuration updated", response: resolve})
                    })
                    .catch(reject => {
                        console.log(reject)
                        sendResponse({status: -1, message: "Couldn't update session configuration", response: reject})
                    })
            }).catch((reject) => {
                console.log(reject)
                sendResponse({status: -1, message: "Couldn't persist configuration", response: reject})
            })
            return true
        case "SAP_IS_CFG_REQUEST":
            readSession(["configuration"]).then(session => {
                if (!session.configuration) {
                    readLocal(["configuration"]).then(local => {
                        if (!local.configuration) {
                            sendResponse({configuration: null})
                        } else {
                            sendResponse({configuration: local.configuration})
                            persistSession({configuration: local.configuration})
                        }
                    })
                } else {
                    sendResponse({configuration: session.configuration})
                }
            })
            return true
        case "SAP_IS_LOCK_REQUEST":
            readSession([`locks_${message.id}`]).then(resolve => {
                if (Object.keys(resolve).length === 0) throw "NO_LOCKS_STORED"
                if (Date.now() - resolve[`locks_${message.id}`].fetchTimestamp > 1800000) throw "LOCKS_OUTDATED"
                sendResponse({locks: resolve[`locks_${message.id}`].locks})
            }).catch(reject => {
                sendResponse({reason: reject})
            })
            return true
        case "SAP_IS_DT_ARTIFACT_REQUEST":
            readSession([`designtime_artifacts_${message.id}`]).then(resolve => {
                if (Object.keys(resolve).length === 0) throw "NO_ARTIFACTS_STORED"
                if (Date.now() - resolve[`designtime_artifacts_${message.id}`].fetchTimestamp > 30000) throw "ARTIFACTS_OUTDATED"
                sendResponse({artifacts: resolve[`designtime_artifacts_${message.id}`].artifacts})
            }).catch(reject => {
                sendResponse({reason: reject})
            })
            return true
        case "SAP_IS_SECMAT_REQUEST":
            readSession([`secure_materials_${message.id}`]).then(resolve => {
                if (Object.keys(resolve).length === 0) throw "NO_SECURE_MATERIALS_STORED"
                if (Date.now() - resolve[`secure_materials_${message.id}`].fetchTimestamp > 1800000) throw "SECURE_MATERIALS_OUTDATED"
                sendResponse({secureMaterials: resolve[`secure_materials_${message.id}`].secureMaterials})
            }).catch(reject => {
                sendResponse({reason: reject})
            })
            return true
        case "OPEN_IN_TAB":
            chrome.tabs.create({url: message.url, active: false, index: sender.tab.index + 1})
            return false
        case "LOCKS_FETCHED":
            persistSession({[`locks_${message.id}`]: {locks: message.locks, fetchTimestamp: Date.now()}})
            return false
        case "SECMAT_FETCHED":
            persistSession({
                [`secure_materials_${message.id}`]: {
                    secureMaterials: message.secureMaterials,
                    fetchTimestamp: Date.now()
                }
            })
            return false
        case "DESIGNTIME_ARTIFACTS_FETCHED":
            persistSession({
                [`designtime_artifacts_${message.id}`]: {
                    artifacts: message.artifacts,
                    fetchTimestamp: Date.now()
                }
            })
            chrome.tabs.query({url: `https://${message.id}.integrationsuite.cfapps.${message.server}.hana.ondemand.com/*`}).then(tabs => {
                tabs.forEach(it => {
                    chrome.tabs.sendMessage(it.id, {type: "DESIGNTIME_ARTIFACTS_CHANGED", artifacts: message.artifacts})
                })
            })
            return false
        case "RESET_DATA":
            chrome.storage.local.clear()
            chrome.storage.session.clear()
            return false
        default:
            console.error("Uncaught message", message)
            return false
    }
});

function getDefaultConfig() {
    return new Promise((resolve, reject) => {
        fetch(chrome.runtime.getURL("util/defaultConfig.json")).then(defaultConfiguration => {
            fetch.text().then(defaultConfiguration => {
                let configuration = Object.keys(defaultConfiguration).length == 0 ? null : defaultConfiguration
                persistSession({configuration: configuration})
                persistLocal({configuration: configuration})
                resolve({configuration: configuration})
            }).catch(() => {
                reject({reason: "ERROR"})
            })
        }).catch(() => {
            reject({reason: "ERROR"})
        })
    })
}

let eventLastFired = {}, minimumFireDistance = 800
/*
* Contexts:
* 36221725 = Isuite_news_and_announcements
* 36221787 = isuite_home
* 36221744 = cpides_design_package_overview
* 36221797 = cpides_design_package_artifacts
* 36221812 = cpides_design_package_documents
* 36221795 = cpides_design_overview
* */
chrome.webRequest.onResponseStarted.addListener(function (details) {
    switch (true) {
        case /\/api\/1.0\/workspace\/.*\/artifacts\/.*\/entities\/.*\/.*\/.*\?lockinfo=true&webdav=LOCK$/.test(details.url):
            triggerISEvent(details, "ARTIFACT_ONLOAD")
            if (/iflows\/.*\?lockinfo=true&webdav=LOCK$/.test(details.url)) {
                triggerISEvent(details, "IFLOW_ONLOAD")
            } else if (/messagemappings\/.*\?lockinfo=true&webdav=LOCK$/.test(details.url)) {
                triggerISEvent(details, "MMAP_ONLOAD")
            } else if (/valuemappings\/.*\?lockinfo=true&webdav=LOCK$/.test(details.url)) {
                triggerISEvent(details, "VALMAP_ONLOAD")
            } else if (/scriptcollections\/.*\?lockinfo=true&webdav=LOCK$/.test(details.url)) {
                triggerISEvent(details, "SCRIPTCOLLECTION_ONLOAD")
            } else if (/functionlibraries\/.*\?lockinfo=true&webdav=LOCK$/.test(details.url)) {
                triggerISEvent(details, "FUNCTIONLIB_ONLOAD")
            } else if (/datatypes\/.*\?lockinfo=true&webdav=LOCK$/.test(details.url)) {
                triggerISEvent(details, "DATATYPE_ONLOAD")
            } else if (/odataservices\/.*\?lockinfo=true&webdav=LOCK$/.test(details.url)) {
                triggerISEvent(details, "ODATAAPI_ONLOAD")
            }
            break
        case /manageTenant\/api\/1\.0\/preferences$/.test(details.url):
            //case /manageTenant\/static\/istudio\/com\/sap\/it\/spc\/webui\/commons\/library-preload\.js$/.test(details.url):
            triggerISEvent(details, "GENERAL_ONLOAD")
            break
        case /\/api\/1.0\/workspace\/[^\/]+\?lockinfo=true&webdav=LOCK/.test(details.url):
            triggerISEvent(details, "PACKAGE_ONLOAD")
            break
        case /\/api\/1.0\/workspace\/[^\/]+\?webdav=LOCK/.test(details.url):
            triggerISEvent(details, "PACKAGE_START_EDIT")
            break
        case /\/api\/1.0\/workspace\/[^\/]+\?webdav=UNLOCK/.test(details.url):
            triggerISEvent(details, "PACKAGE_END_EDIT")
            break
        case /context\?id=36221787$/.test(details.url):
            triggerISEvent(details, "ISTUDIO_DASHBOARD_ONLOAD")
            break
        case /context\?id=36221795$/.test(details.url):
            triggerISEvent(details, "ISTUDIO_DESIGN_ONLOAD")
            break
        case /context\?id=36221744$/.test(details.url):
            //case /^https:\/\/help\.sap\.com.*cpides_design_package_overview/.test(details.url):
            triggerISEvent(details, "PACKAGE_OVERVIEW_ONLOAD")
            break
        case /context\?id=36221797$/.test(details.url):
            //case /^https:\/\/help\.sap\.com.*cpides_design_package_artifacts/.test(details.url):
            triggerISEvent(details, "PACKAGE_ARTIFACTS_ONLOAD")
            break
        case /context\?id=36221812$/.test(details.url):
            //case /^https:\/\/help\.sap\.com.*cpides_design_package_documents/.test(details.url):
            triggerISEvent(details, "PACKAGE_DOCUMENTS_ONLOAD")
            break
        case /context\?id=36221805$/.test(details.url):
            triggerISEvent(details, "RESOURCE_CONSUMPTION_ONLOAD")
            break
        case /.*\/.*\?webdav=CLOSE$/.test(details.url):
            triggerISEvent(details, "ARTIFACT_CLOSE")
            break
        case /workspace\/artifacts\/accesspolicy$/.test(details.url):
            triggerISEvent(details, "ARTIFACT_EDIT")
            break
        default:
            break
    }
    return false
}, {urls: ["https://help.sap.com/*", "https://*.hana.ondemand.com/*"]})


function triggerISEvent(details, type, specificMinimumFireDistance) {
    let now = performance.now()
    let lastFiredDistance = now - (eventLastFired[`${type}_${details.tabId}`] ?? 0)
    if (eventLastFired[`${type}_${details.tabId}`] != null && lastFiredDistance < (specificMinimumFireDistance ?? minimumFireDistance)) {
        console.log(`${type}_${details.tabId} (DUPE: ${lastFiredDistance}ms ago)`);
    } else {
        console.log(`${type}_${details.tabId}`);
        eventLastFired[`${type}_${details.tabId}`] = now
        chrome.tabs.sendMessage(details.tabId, {type: type})
    }
}

async function persistSync(entries) {
    return chrome.storage.sync.set(entries)
}

async function persistLocal(entries) {
    return chrome.storage.local.set(entries)
}

async function persistSession(entries) {
    return chrome.storage.session.set(entries)
}

async function readSync(keys) {
    return chrome.storage.sync.get(keys)
}

async function readLocal(keys) {
    return chrome.storage.local.get(keys)
}

async function readSession(keys) {
    return chrome.storage.session.get(keys)
}


chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
    } else if (details.reason == "update") {
        //chrome.tabs.create({url:chrome.runtime.getURL("util/update.html")},function(){})
    }
});