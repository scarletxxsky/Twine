let dtArtifactMasterRequest
let lockMasterRequest

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
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
        case "SAP_IS_CFG_REQUEST":
            readSession(["configuration"]).then(session => {
                if (!session.configuration) {
                    readLocal(["configuration"]).then(local => {
                        if (!local.configuration) {
                            fetch(chrome.runtime.getURL("util/defaultConfig.json")).then(fetch => {
                                fetch.json().then(defaultConfiguration => {
                                    let configuration =  Object.keys(defaultConfiguration).length == 0 ? null : defaultConfiguration
                                    sendResponse({configuration: configuration})
                                    persistSession({configuration: configuration})
                                    persistLocal({configuration: configuration})
                                }).catch(() => {
                                    sendResponse({configuration: null})
                                })
                            }).catch(() => {
                                sendResponse({configuration: null})
                            })
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
                if (Date.now() - resolve[`locks_${message.id}`].fetchTimestamp > 180000) throw "LOCKS_OUTDATED"
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
        case "OPEN_IN_TAB":
            chrome.tabs.create({url: message.url, active: false, index: sender.tab.index+1})
            return false
        case "LOCKS_FETCHED":
            persistSession({[`locks_${message.id}`]: {locks: message.locks, fetchTimestamp: Date.now()}})
            return false
        case "DESIGNTIME_ARTIFACTS_FETCHED":
            persistSession({[`designtime_artifacts_${message.id}`]: {artifacts: message.artifacts, fetchTimestamp: Date.now()}})
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
                let configuration =  Object.keys(defaultConfiguration).length == 0 ? null : defaultConfiguration
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SAPUI5_ROUTER_EVENT') {
        console.log('Received SAPUI5 Router Event:', message.details);
        // Handle the router event, e.g., log it or send it to a server
    }
});

/*chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
    } else if (details.reason == "update") {
        chrome.tabs.create({url: "util/changelog.md", active: true})
    }
});*/

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

async function persistSync(entries) { return chrome.storage.sync.set(entries) }
async function persistLocal(entries) { return chrome.storage.local.set(entries) }
async function persistSession(entries) { return chrome.storage.session.set(entries) }

async function readSync(keys) { return chrome.storage.sync.get(keys) }
async function readLocal(keys) { return chrome.storage.local.get(keys) }
async function readSession(keys) { return chrome.storage.session.get(keys) }
