importScripts('/util/ext.js');

let requestListener = []
let rateLimiters = {
    compareArtifact: {
        lastCall: 0,
        msBetweenCall: 10000
    }
}

chrome.tabs.onRemoved.addListener(function(tabId, info) {
    let requests = Object
        .entries(requestListener)

    requests.forEach(it => {
        it[1].subscribers = it[1].subscribers.filter(subscriber => subscriber.tabId != tabId)
    })

    requests.filter(it => it[1].requestOwner.tabId == tabId)
        .forEach(it => {
            if (it[1].subscribers.length > 0) {
                console.log(`Reassigning ${it[0]} to next subscriber`)
                let newOwner = it[1].subscribers.shift()
                requestListener[it[0]] = {
                    requestStarted: Date.now(),
                    requestOwner: newOwner,
                    subscribers: it[1].subscribers ?? []
                }
                newOwner.sendResponse({status: "reassign"})
            } else {
                console.log(`No subscribers for ${it[0]} left. Request deleted`)
                delete requestListener[it[0]]
            }
        })
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case "SAP_IS_UNIFY_REQUEST":
        case "SAP_IS_READ_ONLY_UNIFY_REQUEST":
            let now = Date.now()
            let request = requestListener?.[`${message.requestType}_${message.tenantId}`]
            if (request) {
                //If the existing requestListener is more than 15 seconds old, reassign the request in case the other one had an exception
                console.log(`Request age: ${now - request.requestStarted}ms`)
                if (Date.now() - request.requestStarted > 15000 && message.type != "SAP_IS_READ_ONLY_UNIFY_REQUEST") {
                    console.log(`Creating request for ${message.requestType}_${message.tenantId}`)
                    requestListener[`${message.requestType}_${message.tenantId}`] = {
                        requestStarted: now,
                        requestOwner: {
                            tabId: sender.tab.id,
                            sendResponse: sendResponse
                        },
                        subscribers: request.subscribers
                    }
                    sendResponse({status: "request"})
                    console.log(`Reassigned requestee for ${message.requestType}_${message.tenantId}`)
                    return false
                } else {
                    console.log(`Adding subscriber for ${message.requestType}_${message.tenantId}`)
                    request.subscribers.push({tabId: sender.tab.id, sendResponse: sendResponse})
                    return true
                }
            } else { //No request running
                readSession([`${message.requestType}_${message.tenantId}`]).then(resolve => {
                    if ((Object.keys(resolve).length === 0) || (now - resolve[`${message.requestType}_${message.tenantId}`].fetchTimestamp > ((message.maxAge * 1000)-500))) {
                        if (message.type != "SAP_IS_READ_ONLY_UNIFY_REQUEST") {
                            console.log(`Creating request for ${message.requestType}_${message.tenantId}`)
                            requestListener[`${message.requestType}_${message.tenantId}`] = {
                                requestStarted: now,
                                requestOwner: {
                                    tabId: sender.tab.id,
                                    sendResponse: sendResponse
                                },
                                subscribers: []
                            }
                            sendResponse({
                                status: "request"
                            })
                        } else {
                            sendResponse({
                                status: "nocache"
                            })
                        }
                    } else {
                        console.log(`Returning cache for ${message.requestType}_${message.tenantId}`)
                        sendResponse({
                            status: "cache",
                            data: resolve[`${message.requestType}_${message.tenantId}`].data,
                            validTo:  resolve[`${message.requestType}_${message.tenantId}`].fetchTimestamp + ((message.maxAge) * 1000)
                        })
                    }
                }).catch(reject => {
                    console.log("Error in processing")
                    console.error(reject)
                    sendResponse({reason: reject})
                })
                return true
            }
        case "SAP_IS_UNIFY_RESOLVE":
            //TODO: Null safe operator for subscribers swallows an occasional edge case that causes errors. Maybe investigate the cause
            console.log(`Request finished for ${message.requestType}_${message.tenantId}. Notifying ${requestListener?.[`${message.requestType}_${message.tenantId}`]?.subscribers.length} subscribers`)
            let fetchTimestamp = Date.now()
            if (message.data) {
                persistSession({
                    [`${message.requestType}_${message.tenantId}`]: {
                        data: message.data,
                        fetchTimestamp: fetchTimestamp,
                        validTo: message.validTo
                    }
                })
                requestListener?.[`${message.requestType}_${message.tenantId}`].subscribers.forEach(it => {
                    try {
                        it.sendResponse({status: "subscribed", data: message.data, validTo: fetchTimestamp})
                    } catch (e) {
                        console.log(e, it)
                    }
                })
            }
            delete requestListener[`${message.requestType}_${message.tenantId}`]
            sendResponse({status: "success"})
            return false
        case "SAP_IS_RATELIMIT_REQUEST": {
            let now = Date.now()
            let lastCallDifference = now - rateLimiters[message.key]?.lastCall
            if (!lastCallDifference) {
                sendResponse({code: 501, message: "Developer missed a thing", explicitMessage: `No rate limiter for ${message.key}`})
            } else if (lastCallDifference < rateLimiters[message.key].msBetweenCall) {
                sendResponse({code: 429, message: `Please wait ${msToTime(rateLimiters[message.key].msBetweenCall - lastCallDifference)} to use this function again`})
            } else {
                rateLimiters[message.key].lastCall = now
                sendResponse({code: 200})
            }
            return false
        }
        case "CFG_REQUEST":
            readSession(["configuration"]).then(session => {
                if (!session.configuration) {
                    //region Local
                    readLocal(["configuration"]).then(local => {
                        if (!local.configuration) {
                            //region Default
                            sendResponse(null)
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
            console.log(message.configuration)
            persistLocal({configuration: message.configuration}).then((resolve) => {
                console.log("local", resolve)
                persistSession({configuration: message.configuration})
                    .then(resolve => {
                        console.log("session", resolve)
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
        case "OPEN_IN_TAB":
            chrome.tabs.create({url: message.url, active: false, index: sender.tab.index + 1})
            return false
        case "OPEN_IN_WINDOW":
            chrome.windows.create({url: message.url, focused: false}).then(() => sendResponse(0)).catch(e => sendResponse(e))
            return false
        case "LOCKS_FETCHED":
            persistSession({[`locks_${message.id}`]: {locks: message.locks, fetchTimestamp: Date.now()}})
            return false
        case "RESET_DATA":
            chrome.storage.local.clear()
            chrome.storage.session.clear()
            return false
        case "LANDSCAPER":
            chrome.tabs.query({url: message.resourceDetails.tenantUrl}).then(tabs => {
                if (tabs.length < 1) {
                    sendResponse({code: 409, message: "You need an open tab on the target tenant", explicitMessage: `Could not get the artifact list for tenant ${message.resourceDetails.tenantUrl}`})
                } else {
                    chrome.tabs.sendMessage(tabs[0].id, message.resourceDetails).then(response => {
                        sendResponse(response)
                    })
                }
            })
            return true
        case "GET_DETAIL":
            if (message.persisted) {
                readLocal([message.key]).then((resolve) => {
                    sendResponse({code: 200, value: resolve})
                })
            } else {
                readSession([message.key]).then((resolve) => {
                    sendResponse({code: 200, value: resolve})
                })
            }
            return true
        case "STORE_DETAIL":
            if (message.persist) {
                persistLocal({[message.key]: message.value}).then((resolve) => {
                    sendResponse({code: 200, value: resolve})
                })
            } else {
                persistSession({[message.key]: message.value}).then((resolve) => {
                    sendResponse({code: 200, value: resolve})
                })
            }
            return true
        default:
            console.error("Uncaught message", message)
            return false
    }
    console.error("Unhandled Message", message.type)
    return false
});

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
        //console.log(`${type}_${details.tabId} (DUPE: ${lastFiredDistance}ms ago)`);
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
        chrome.tabs.create({url:chrome.runtime.getURL("util/update.html")},function(){})
    }
});