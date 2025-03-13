let configuration
let sidebarMainContent
let sidebarMainRoot
let sidebar
let popoverLayer = null, popoverLayerBlocker = null
let loggedInUser = null
let locks = [], lockRequestStarted = false
let initialized = false
let configVersion = "2025.03.12.0"
let csrfToken = null
let integrationSuiteConfiguration = null
let displayedArtifactDetails = null
let subaccountBaseUrl = null
let settingsDialog

let sapDefault = {
    textColor: "#1d2d3e"
}

let debugFlag = false
let regexOnly = false
let showUnimplemented = false

//No access to an EIC, so it's existence will be ignored for now
let cloudRuntimeOnly
let twineStatic

let tenantVariables = {
    configuration: null,
    isTrial: false,
    globalEnvironment: null,
    currentTenantId: window.location.host.split(".integrationsuite")[0],
    currentTenantSystem: window.location.host.split(".integrationsuite")[1].split(".cfapps")[0],
    currentTenantDatacenter: window.location.host.split(".hana.ondemand")[0].split("cfapps.")[1],
    currentTenant: null,
    currentArtifact: {
        artifact: null, package: null, deepWorkspace: null, documentation: null, documentationObject: null
    }
}

let artifactTypeConfiguration = [{
    type: "designtimeArtifacts",
    classType: Branch,
    urlType: "contentpackage",
    lockType: "INTEGRATION_PACKAGE",
    operationsType: "",
    displayNameS: "Designtime Artifact",
    displayNameP: "Designtime Artifacts",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: -1
}, {
    type: "IFlow",
    classType: IFlowArtifact,
    runtimeObjectType: IntegrationFlowRuntimeArtifact,
    designtimeObjectType: IntegrationFlowDesigntimeArtifact,
    urlType: "integrationflows",
    lockType: "INTEGRATION_FLOW",
    operationsType: "IntegrationFlow",
    entityType: "iflows", //Differs from url type
    displayNameS: "Integration Flow",
    displayNameP: "Integration Flows",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 0
}, {
    type: "MessageMapping",
    classType: MessageMappingArtifact,
    runtimeObjectType: MessageMappingRuntimeArtifact,
    designtimeObjectType: MessageMappingDesigntimeArtifact,
    urlType: "messagemappings",
    lockType: "MessageMapping",
    entityType: "messagemappings",
    operationsType: "MessageMapping",
    displayNameS: "Message Mapping",
    displayNameP: "Message Mappings",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 1
}, {
    type: "ValueMapping",
    classType: ValueMappingArtifact,
    runtimeObjectType: ValueMappingRuntimeArtifact,
    designtimeObjectType: ValueMappingDesigntimeArtifact,
    urlType: "valuemappings",
    lockType: "VALUE_MAPPING",
    entityType: "valuemappings",
    operationsType: "ValueMapping",
    displayNameS: "Value Mapping",
    displayNameP: "Value Mappings",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 2
}, {
    type: "ScriptCollection",
    classType: ScriptCollectionArtifact,
    runtimeObjectType: ScriptCollectionRuntimeArtifact,
    designtimeObjectType: ScriptCollectionDesigntimeArtifact,
    urlType: "scriptcollections",
    lockType: "ScriptCollection",
    entityType: "scriptcollections",
    operationsType: "ScriptCollection",
    displayNameS: "Script Collection",
    displayNameP: "Script Collections",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 3
}, {
    type: "FunctionLibraries",
    classType: FunctionLibraryArtifact,
    runtimeObjectType: FunctionLibraryRuntimeArtifact,
    designtimeObjectType: FunctionLibraryDesigntimeArtifact,
    urlType: "functionlibraries",
    lockType: "FunctionLibraries",
    entityType: "scriptcollections", //Deploy is the same as Script Collection but requires an empty(?) json object
    operationsType: "FunctionLibraries",
    displayNameS: "Function Library",
    displayNameP: "Function Libraries",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 4
}, {
    type: "DataType",
    classType: DataTypeArtifact,
    runtimeObjectType: DataTypeRuntimeArtifact,
    designtimeObjectType: DataTypeDesigntimeArtifact,
    urlType: "datatypes",
    lockType: "DataType",
    entityType: "NOT DEPLOYABLE",
    operationsType: "",
    displayNameS: "Data Type",
    displayNameP: "Data Types",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 5
}, {
    type: "MessageType",
    classType: MessageTypeArtifact,
    runtimeObjectType: MessageTypeRuntimeArtifact,
    designtimeObjectType: MessageTypeDesigntimeArtifact,
    urlType: "messagetypes",
    lockType: "MessageType",
    entityType: "NOT DEPLOYABLE",
    operationsType: "",
    displayNameS: "Message Type",
    displayNameP: "Message Types",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 6
}, {
    type: "OData Service",
    classType: ODataArtifact,
    urlType: "odataservices",
    lockType: "ODATA_SERVICE",
    entityType: "odata",
    operationsType: "",
    displayNameS: "OData API",
    displayNameP: "OData APIs",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 7
}, {
    type: "RESTAPIProvider",
    classType: RESTArtifact,
    urlType: "restapis",
    lockType: "RESTAPIProvider",
    operationsType: "",
    displayNameS: "REST API",
    displayNameP: "REST APIs",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 8
}, {
    type: "SOAPAPIProvider",
    classType: SOAPArtifact,
    urlType: "soapapis",
    lockType: "SOAPAPIProvider",
    operationsType: "",
    displayNameS: "SOAP API",
    displayNameP: "SOAP APIs",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 9
}, {
    type: "ImportedArchives",
    classType: ArchiveArtifact,
    urlType: "importedarchives",
    lockType: "ImportedArchives",
    entityType: "scriptcollections", //Deploy is the same as Script Collection but requires an empty(?) json object
    operationsType: "",
    displayNameS: "Imported Archive",
    displayNameP: "Imported Archives",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 10
}, {
    type: "IntegrationAdapter",
    classType: IntegrationAdapterArtifact,
    urlType: "N/A",
    lockType: "N/A",
    operationsType: "ADAPTER",
    displayNameS: "Integration Adapter",
    displayNameP: "Integration Adapters",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 11
}, {
    type: "API",
    classType: APIArtifact,
    urlType: "Don't Know",
    lockType: "Don't Know",
    operationsType: "Don't Know",
    displayNameS: "EIC API",
    displayNameP: "EIC APIs",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 12
}, {
    type: "apiProxies", //THIS IS NOT THE API PROXY ARTIFACT, IT'S THE BRANCH TYPE
    classType: Branch,
    urlType: "",
    lockType: "N/A",
    operationsType: "",
    displayNameS: "API Proxy",
    displayNameP: "API Proxies",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: -1
}, {
    type: "secureMaterials",
    classType: Branch,
    urlType: "",
    lockType: "N/A",
    operationsType: "",
    displayNameS: "Secure Material",
    displayNameP: "Secure Materials",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: -1
}, {
    type: "apiportal.APIProxy",
    classType: APIProxyArtifact,
    urlType: "api",
    lockType: "N/A",
    operationsType: "",
    displayNameS: "API Proxy",
    displayNameP: "API Proxies",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 0
}, {
    type: "default",
    classType: SecureMaterialArtifact,
    urlType: "",
    lockType: "N/A",
    operationsType: "SecureMaterial",
    displayNameS: "User Credential",
    displayNameP: "User Credentials",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 1
}, {
    type: "oauth2:default",
    classType: SecureMaterialArtifact,
    landscapeType: UnknownArtifact,
    urlType: "",
    lockType: "N/A",
    operationsType: "SecureMaterial",
    displayNameS: "OAuth2 Credential",
    displayNameP: "OAuth2 Credentials",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 2
}, {
    type: "secure_param",
    classType: SecureMaterialArtifact,
    urlType: "",
    lockType: "N/A",
    operationsType: "SecureMaterial",
    displayNameS: "Secure Parameter",
    displayNameP: "Secure Parameters",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 3
}, {
    type: "authorization_code",
    classType: SecureMaterialArtifact,
    urlType: "",
    lockType: "N/A",
    operationsType: "SecureMaterial",
    displayNameS: "Authorization Code",
    displayNameP: "Authorization Codes",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 4
}, {
    type: "undefined", //Known Hosts
    classType: SecureMaterialArtifact,
    urlType: "",
    lockType: "N/A",
    operationsType: "SecureMaterial",
    displayNameS: "Known Hosts",
    displayNameP: "Known Hosts",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 1000
}, {
    type: "openconnectors",
    classType: SecureMaterialArtifact,
    urlType: "",
    lockType: "N/A",
    operationsType: "SecureMaterial",
    displayNameS: "Open Connector Credential",
    displayNameP: "Open Connector Credentials",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 5
}, {
    type: "successfactors",
    classType: SecureMaterialArtifact,
    urlType: "",
    lockType: "N/A",
    operationsType: "SecureMaterial",
    displayNameS: "Successfactor Credential",
    displayNameP: "Successfactors Credentials",
    symbol: "",
    displayColor: sapDefault.textColor,
    priority: 5
}, {
    type: "customFolder",
    classType: Branch,
    urlType: "N/A",
    lockType: "N/A",
    operationsType: "N/A",
    displayNameS: "Custom Folder",
    displayNameP: "Custom Folder",
    displayColor: sapDefault.textColor,
    symbol: "",
    priority: -1
}, {
    type: "customShortcut",
    classType: CustomShortcut,
    urlType: "N/A",
    lockType: "N/A",
    operationsType: "N/A",
    displayNameS: "Custom Shortcut",
    displayNameP: "Custom Shortcuts",
    displayColor: sapDefault.textColor,
    symbol: "N/A",
    priority: -1
}]

chrome.runtime.sendMessage({type: "SAP_IS_CFG_REQUEST"}).then(message => {
    init(upgradeConfig(message.configuration))
}).catch(e => {
    console.error(e)
    createToast("An error occured while starting Twine", {className: "twineReject"})
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let runStart = window.performance.now()
    debug(message.type)
    switch (message.type) {
        case "SESSION_CHANGE":
            switch (message.changeType) {
                case "LOCK_DELETED":
                    break
                default:
                    break
            }
            break
        case "ISTUDIO_DASHBOARD_ONLOAD":
            break
        case "CONFIGURATION_CHANGED":
            break
        case "DESIGNTIME_ARTIFACTS_CHANGED":
            break
        case "GENERAL_ONLOAD":
            if (initialized) {
                debug("Already initialized")
                elapsedTime += window.performance.now() - runStart
                return
            }
            if (false && debugFlag) document.addEventListener("mouseover", function (e) {
                let runStart = window.performance.now()
                if (e.altKey) {
                    if (!(e.target instanceof SVGElement)) {
                        if (e.target.childElementCount == 0 && e.target.innerText.length > 0) {
                            if (e.target.innerText.trim().length > 0) {
                                console.log(e.target.innerText)
                            }
                        }
                    } else {
                        //Ignore for now
                        /*
                        console.log("SVG Element")
                        if (e.target.nodeName == "rect") {
                            console.log(e.target, e.target.parentElement, e.target.parentElement?.nextElementSibling, e.target.parentElement?.nextElementSibling?.childNodes)
                            //console.log(e.target.parentElement?.nextElementSibling?.childNodes.map(() => { return e.target.innerText }).join(" "), e.target)
                        } else if (e.target.nodeName == "tspan") {
                            console.log(e.target.parentElement.childNodes.map(() => { return e.target.innerText }).join(" "))
                        }*/
                    }
                }
                elapsedTime += window.performance.now() - runStart
            })
            let carousel = document.querySelector("div > div[id$=--homePageCarousel]")
            if (carousel) carousel.style.display = "none"

            if (checkErrorTolerance(4) && checkCloudIntegrationFeature("unlock")) {
                fetchLocks().then(resolve => {
                    updateIntegrationContentLocks()
                    createLockReminder()
                }).catch(reject => {
                    console.error(reject)
                    /*TODO: Don't know yet if there is anything to do here*/
                })
            }

            sidebarMainContent = document.getElementById("shell--navigationList")
            sidebarMainRoot = document.getElementById("shell--sideNavigationMenu")
            sidebar = sidebarMainContent.parentNode

            let sidebarObserver = new MutationObserver(mutations => {
                updateAsideBackground()
                setTimeout(() => {
                    addQuicklinks()
                    if (!sidebarMainContent.classList.contains("sapTntNLCollapsed")) {
                        sidebar.appendChild(twineNavigationList)
                    }
                }, 500)
            })
            sidebarObserver.observe(sidebarMainContent, {
                attributes: true, attributeFilter: ["class"]
            });

            initializeQuicklinks()
            if (checkCloudIntegrationFeature("integrationContentQuickAccess")) initializeIntegrationContent()
            if (checkIntegrationSuiteFeature("decorations")) initializeDecorations()
            //if (checkCloudIntegrationFeature("documentation")) initializeDocumentation()
            initialized = true
            break
        case "ARTIFACT_ONLOAD":
        case "PACKAGE_ONLOAD":
        case "PACKAGE_OVERVIEW_ONLOAD":
        case "PACKAGE_DOCUMENTS_ONLOAD":
        case "PACKAGE_ARTIFACTS_ONLOAD":
            break
        case "PACKAGE_START_EDIT":
        case "PACKAGE_END_EDIT":
            break
        case "XTENANT_RUNTIME_ARTIFACT_DOWNLOAD":
            fetchRuntimeArtifactContent(message.runtimeId).then(response => {
                sendResponse(response)
            })
            return true
        case "XTENANT_DESIGNTIME_ARTIFACT_DOWNLOAD":
            getWorkspaceArtifactExplicitDownload(message.packageId, message.designtimeId).then(response => {
                response.arrayBuffer().then(array => {
                    sendResponse({
                        data: [...new Uint8Array(array)],
                        contentType: "application/zip"
                    })
                })
            })
            return true
        default:
            break
    }

    elapsedTime += window.performance.now() - runStart
    return false
})

waitForId("sap-ui-static").then(element => {
    popoverLayer = element
    twineStatic = createElementFrom(`
        <div id="__twine-staticElement">
            <div id="__twine-staticElement-Helper" style="display: none">
                <a id="__twine-staticElement-Helper-Download"></a>
            </div>
            <div id="__twine-staticElement-DiffDisplay" style="display: none">
                <div style='background: #f1f1f1; position:fixed; padding: 10px; display: flex; align-items: normal; flex-direction: column' id="__twine-staticElement-DiffDisplay-Header">
                    <div>
                        <span style='font-weight: bold; font-size: xx-large; cursor: pointer; margin-right: 10px' id="__twine-staticElement-DiffDisplay-Header-Close">&times;</span> 
                        <span style='font-weight: bold; font-size: x-large; cursor: pointer; margin-right: 10px' id="__twine-staticElement-DiffDisplay-Header-Popout">⭷</span> 
                        <span style='/*opacity: 0.5; */font-weight: bold; font-size: x-large; cursor: default; margin-right: 10px' id="__twine-staticElement-DiffDisplay-Header-Download">⭳</span> 
                        <span style='color: red;' id="__twine-staticElement-DiffDisplay-Header-SourceRole">Local Values</span>&nbsp;<=>&nbsp;
                        <span style='color: green;' id="__twine-staticElement-DiffDisplay-Header-TargetRole">Values on other artifact</span>&nbsp;|&nbsp;
                        <span style='font-weight: bold' id="__twine-staticElement-DiffDisplay-Header-DifferenceCount"></span>
                    </div>
                    <div id="__twine-staticElement-DiffDisplay-Header-Meta">
                        <div style="font-weight: bold" id="__twine-staticElement-DiffDisplay-Header-Meta-Artifact"></div>
                        <div id="__twine-staticElement-DiffDisplay-Header-Meta-Note"></div>
                    </div>
                </div>
                <div id="__twine-staticElement-DiffDisplay-View">
                    <pre id="__twine-staticElement-DiffDisplay-View-Content"></pre>
                    <div id="__twine-staticElement-DiffDisplay-View-Canvas"></div>
                    <span style='font-weight: bold; font-size: x-large; cursor: pointer; margin-right: 10px' id="__twine-staticElement-DiffDisplay-View-Previous">￩</span> 
                    <span style='font-weight: bold; font-size: x-large; cursor: pointer; margin-right: 10px' id="__twine-staticElement-DiffDisplay-View-Next">￫</span> 
                    <div id="__twine-staticElement-DiffDisplay-View-ContentList">
                        <div id="__twine-staticElement-DiffDisplay-View-ContentList-Content"></div>
                    </div>
                </div>
            </div>
        </div>
    `)
    diffDisplay = twineStatic.querySelector("#__twine-staticElement-DiffDisplay")
    diffDisplay.addEventListener("contextmenu", e => {
        e.preventDefault();
        e.stopPropagation();
        return false
    })

    popoverLayer.insertAdjacentElement("beforeend", twineStatic)
    waitForId("sap-ui-blocklayer-popup").then(element => {
        popoverLayerBlocker = element
    })
})

async function init(storedConfiguration) {
    configuration = storedConfiguration
    debugFlag = configuration.overrides?.debug === true
    regexOnly = configuration.overrides?.regexOnlySearch === true
    showUnimplemented = configuration.overrides?.showUnimplemented === true

    getCurrentEnvironment()


    debug(`Error Tolerance: ${tenantVariables?.currentTenant?.errorTolerance}`)

    if (checkErrorTolerance(2)) {
        csrfToken = await getCsrfToken()

        let runStart = window.performance.now()
        let response = await chrome.runtime.sendMessage({
            type: "SAP_IS_UNIFY_REQUEST",
            requestType: "tenantInfo",
            tenantId: getTenantUid(),
            maxAge: 3600000
        })

        if (response.status == "request" || response.status == "reassign") {
            callXHR("GET", navigationInfoUrl(), null, null, false, {headers: {"Cache-Control": "no-cache, no-store, max-age=0"}}).then(resolve => {
                let runStart = window.performance.now()
                variables.subaccountBasePath = "https://cockpit.btp.cloud.sap/cockpit/#" + JSON.parse(resolve).cloudCockpit?.split("#")[1]
                chrome.runtime.sendMessage({
                    type: "SAP_IS_UNIFY_RESOLVE",
                    requestType: "tenantInfo",
                    tenantId: getTenantUid(),
                    data: variables.subaccountBasePath
                })
                elapsedTime += window.performance.now() - runStart
            }).catch(reject => {
                console.error(reject)
            })
        } else if (response.status == "subscribed") {
            info("Passive response (Subaccount Path)")
            variables.subaccountBasePath = response.data
        } else if (response.status == "cache") {
            info("Cached response (Subaccount Path)")
            variables.subaccountBasePath = response.data
        }


        if (checkReminder("versionUpdates")) {
            integrationSuiteConfiguration = JSON.parse(await getIntegrationSuiteEnvironmentConfiguration())
            let isVersion = integrationSuiteConfiguration.filter(it => it.key == "capabilityVersions").find(it => it.value.capabilityName.includes("CLOUD_INTEGRATION_RUNTIME"))?.value?.capabilityVersion
            if (!isVersion) {
                createToast("Could not determine integration suite version", {className: "twineWarning"})
            } else {
                let lastIsVersion = await getDetail("isVersionUpgrade", storageLevel.PERSIST, storageAssociation.TENANT)
                let camelUpdateDismissed = await getDetail("camelUpdateDismissed", storageLevel.PERSIST, storageAssociation.TENANT)
                storeDetail("isVersionUpgrade", isVersion, storageLevel.PERSIST, storageAssociation.TENANT)

                if (compareVersion(isVersion, lastIsVersion) > 0) {
                    createToast(`Your integration suite was upgraded to version ${isVersion}.`)
                }

                if (!camelUpdateDismissed && getVersionComponents(isVersion)[0] >= 8) {
                    createToast(`This Integration Suite may be running on an updated Camel Version<br>Click this notification to dismiss it for this tenant<br><br><i>This is <b>not</b> a notification issued by SAP</i>`, {
                        className: "twineWarning",
                        onClick: () => {
                            storeDetail("camelUpdateDismissed", true, storageLevel.PERSIST, storageAssociation.TENANT)
                        },
                        duration: -1
                    })
                }
            }
        }

        callXHR("GET", runtimeLocationListUrl(), null, null, false, null).then(response => {
            let runtimeLocations = getDocument(response).querySelectorAll("runtimeLocations")
            cloudRuntimeOnly = runtimeLocations.length == 1 && (runtimeLocations[0].querySelector("typeId").innerHTML == "sapcloudintegration")
        })

        elapsedTime += window.performance.now() - runStart
    }

    updateArtifactTypes()

    measureInterval = Math.min(Math.max(configuration?.sap?.integrationSuite?.performanceMeasurement?.measureIntervalInSec ?? 15, 15), 1800)
    info(`Performance measurement interval set to ${measureInterval}s`)
    setTimedInterval(function () {
        updateRun++
        avgPerfomance = avgPerfomance * (updateRun - 1) / updateRun + (elapsedTime) / updateRun
        elapsedTime = 0.0
        log(`Avg. processing time (${measureInterval}s): ${avgPerfomance.toFixed(4)}ms, ${(avgPerfomance / (measureInterval * 10)).toFixed(3)}%`)
    }, measureInterval * 1000)

    debug("Service Connection initialized")
    return false
}

function getFallbackEnvironment() {
    let environment = {
        owner: "Unknown", logo: null, tenants: []
    }
    if (getTenantId().length == 13 && getTenantId().endsWith("trial")) {
        environment.tenants.push(configuration.sap.integrationSuite.trialTenantSettings)
        tenantVariables.currentTenant.isTrial = true
    } else if (configuration.sap?.integrationSuite?.undefinedTenantSettings) {
        environment.tenants.push(configuration.sap.integrationSuite.undefinedTenantSettings)
    }
    tenantVariables.currentTenant = environment.tenants[0]
    return environment
}

function uiBaseUrl() {
    return `https://${window.location.host}`
}

function workspaceUrl() {
    return `${uiBaseUrl()}/odata/1.0/workspace.svc`
}

function apiPortalUrl() {
    return `${uiBaseUrl()}/apiportal/api/1.0/Management.svc`
}

function deepWorkspaceUrl() {
    return `${uiBaseUrl()}/api/1.0`
}


function checkErrorTolerance(level) {
    return (tenantVariables?.currentTenant?.errorTolerance ?? -1) >= (level ?? 100)
}

function error(message) {
    console.log(`%c✗ Twine: %c${message}`, "font-weight:bold;color:firebrick", "font-weight:normal;color:inherit")
}

function warn(message) {
    console.log(`%c⚠ Twine: %c${message}`, "font-weight:bold;color:orange", "font-weight:normal;color:inherit")
}

function log(message, logLevel = 1) {
    if (configuration?.sap?.integrationSuite?.performanceMeasurement?.logLevel ?? 1 >= logLevel) console.log(`%c✓ Twine: %c${message}`, "font-weight:bold;color:forestgreen", "font-weight:normal;color:inherit")
}

function info(message, logLevel = 5) {
    if ((configuration?.sap?.integrationSuite?.performanceMeasurement?.logLevel ?? 1) >= logLevel) console.log(`%cⓘ Twine: %c${message}`, "font-weight:bold;color:royalblue", "font-weight:normal;color:inherit")
}

function debug(message, logLevel = 20) {
    if ((configuration?.sap?.integrationSuite?.performanceMeasurement?.logLevel ?? 1) >= Math.min(logLevel, 100)) console.log(`%c🛠 Twine: %c${message}`, "font-weight:bold;color:rebeccapurple", "font-weight:normal;color:inherit")
}

function setTimedInterval(intervalFunction, interval) {
    return setTimeout(function tick() {
        let runStart = window.performance.now()
        intervalFunction()
        setTimeout(tick, interval)
        elapsedTime += window.performance.now() - runStart
    }, interval)
}

function checkIntegrationSuiteFeature(feature) {
    return ((feature != null) ? configuration?.sap?.integrationSuite?.[feature]?.enabled === true : configuration?.sap?.integrationSuite?.enabled === true)
}

function checkCloudIntegrationFeature(feature) {
    return ((feature != null) ? configuration?.sap?.integrationSuite?.cloudIntegration?.[feature]?.enabled === true : configuration?.sap?.integrationSuite?.cloudIntegration?.enabled === true)
}

function checkQuicklink(link) {
    return (configuration?.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.[link] === true)
}

function checkReminder(reminder) {
    return configuration?.sap?.integrationSuite?.reminders?.[reminder] === true
}

function getTypeConversion(inType, outType, value, returnEntry) {
    let type = artifactTypeConfiguration.find(it => it[inType] === value)
    if (returnEntry) {
        return type
    } else {
        return type?.[outType]
    }
}

function getUrlPath(context, artifactIdentifier, contextIdentifier, artifactContext) {
    return ("/" + context + "/" + (contextIdentifier ? contextIdentifier + "/" : "") + (artifactContext ? artifactContext + "/" : "") + artifactIdentifier)
}

function getRadialMode() {
    return configuration?.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.radialMenu?.mode ?? "CENTER"
}

function getTenantColor(tenantId) {
    return configuration.overrides?.tenants?.[tenantId ?? getTenantId()]?.displayColor ?? tenantVariables.currentTenant.color ?? sapDefault.textColor
}

function getTenantId() {
    return tenantVariables.currentTenantId
}

function getTenantOwner(tenantId) {
    return tenantVariables.globalEnvironment.owner
}

function getTenantDatacenter() {
    return tenantVariables.currentTenantDatacenter
}

function getTenantSystem() {
    return tenantVariables.currentTenantSystem
}

function getTenantUid() {
    return getTenantId() + getTenantSystem() + getTenantDatacenter()
}

//Reads the display name for the current tenant if configured
function getTenantName() {
    return tenantVariables.currentTenant.name ?? "Unknown"
}

function getStyledStageText(text, stage) {
    return `<span style='color: ${stage.color}; font-weight: bold;'>${text}</span>`
}

function getMouseAction(action, button) {
    let mouseMapping = configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.[action]
    if (!mouseMapping) return button

    let configButton = (button === 0 ? "left" : button === 2 ? "right" : "other")
    let buttonMapping = mouseMapping[configButton]
    if (buttonMapping < 0 || buttonMapping > 2) return button
    return buttonMapping
}

function updateArtifactTypes(artifactTypes = configuration?.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.artifactTypes) {
    if (artifactTypes == null) return

    artifactTypeConfiguration.forEach(entry => {
        const value = artifactTypes[entry.type];
        if (value) {
            if (value.color) entry.displayColor = tryCoerceColor(value.color);
            if (value.priority) entry.priority = value.priority;
        }
    });

    if (configuration?.overrides?.artifactTypes) {
        Object.entries(configuration.overrides.artifactTypes).forEach(entry => {
            let found = false
            artifactTypeConfiguration.forEach(artifactType => {
                if (artifactType.type == entry[0]) {
                    found = true
                    if (entry[1].priority) artifactType.priority = entry[1].priority;
                    if (entry[1].entityType) artifactType.entityType = entry[1].entityType;
                    if (entry[1].urlType) artifactType.urlType = entry[1].urlType;
                    if (entry[1].lockType) artifactType.lockType = entry[1].lockType;
                    if (entry[1].operationsType) artifactType.operationsType = entry[1].operationsType;
                    if (entry[1].displayNameS) artifactType.displayNameS = entry[1].displayNameS;
                    if (entry[1].displayNameP) artifactType.displayNameP = entry[1].displayNameP;
                    if (entry[1].symbol) artifactType.symbol = entry[1].symbol;
                    if (entry[1].displayColor) artifactType.displayColor = tryCoerceColor(entry[1].displayColor);
                }
            })
            if (!found) {
                let customType = {type: entry[0], ...entry[1]}
                let classType = customType.classType.replaceAll(/\s/g, "").toLowerCase()
                if (classType.startsWith("integration")) customType.classType = GenericIntegrationArtifact
                else if (classType.startsWith("security")) customType.classType = SecureMaterialArtifact
                if (!customType.symbol) customType.symbol = ""
                artifactTypeConfiguration.push(customType);
            }
        })
    }
}

function upgradeConfig(config) {
    if (config == null) {
        log(`No config exists. Creating default config with version ${configVersion}`)
        chrome.runtime.sendMessage({type: "SAP_IS_CFG_INIT", configuration: defaultConfiguration}).then(response => {
            if (response.status < 0) {
                createToast("There was an error creating a configuration. Check the developer console for possible causes", {className: "twineReject"})
                console.error(response)
            }
        })
        return defaultConfiguration
    } else if (compareVersion(configVersion, config.version) > 0) {
        log(`Migrating from config version ${config.version} to ${configVersion}`)
        let migrated = {
            sap: {
                integrationSuite: {
                    cloudIntegration: {
                        integrationContentQuickAccess: {
                            enabled: config.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.enabled ?? true,
                            artifactListIntegration: config.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.artifactListIntegration ?? true,
                            artifactListAPI: config.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.artifactListAPI ?? true,
                            artifactListCredentials: config.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.artifactListCredentials ?? true,
                            artifactListShortcuts: config.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.artifactListShortcuts ?? true,
                            artifactTypes: Object.fromEntries(
                                Object.entries(config.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.artifactColors ?? {}).map(it =>
                                    [it[0], {
                                        color: tryCoerceColor(it[1]),
                                        priority: getTypeConversion("type", "priority", it[0])
                                    }]
                                )
                            ),
                            radialMenu: {
                                mode: config.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.radialMenu?.mode ?? "CENTER"
                            },
                            settings: {
                                removePrefix: config.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.settings?.removePrefix ?? false
                            }
                        },
                        mouseMapping: config.sap?.integrationSuite?.cloudIntegration?.mouseMapping ?? {},
                        quickAccess: {
                            enabled: config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.enabled ?? true,
                            links: {
                                "certificates": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.certificates ?? true,
                                "credentials": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.credentials ?? true,
                                "queues": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.queues ?? true,
                                "monitoring": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.monitoring ?? false,
                                "datastores": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.datastores ?? true,
                                "connectivityTest": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.connectivityTest ?? false,
                                "checkNamingConventions": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.checkNamingConventions ?? false,
                                "locks": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.locks ?? false,
                                "stageSwitch": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.stageSwitch ?? true,
                                "messageUsage": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.messageUsage ?? true,
                                "runtimeArtifacts": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.runtimeArtifacts ?? true
                            }
                        },
                        unlock: {
                            enabled: config.sap?.integrationSuite?.cloudIntegration?.unlock?.enabled ?? false
                        }/*,
                        documentation: {
                            enabled: config.sap?.integrationSuite?.cloudIntegration?.documentation?.enabled && config?.sap?.integrationSuite?.cloudIntegration?.documentation?.readDocumentation,
                            enableEditingDocumentation: config.sap?.integrationSuite?.cloudIntegration?.documentation.enableEditingDocumentation ?? false,
                            aiSummary: config.sap?.integrationSuite?.cloudIntegration?.documentation?.aiSummary ?? false
                        }*/
                    }, decorations: {
                        enabled: config.sap?.integrationSuite?.decorations?.enabled ?? true,
                        tenantStage: config.sap?.integrationSuite?.decorations?.tenantStage ?? true,
                        tenantStageAside: config.sap?.integrationSuite?.decorations?.tenantStageAside ?? false,
                        tenantStageHeader: config.sap?.integrationSuite?.decorations?.tenantStageHeader ?? false,
                        companyLogo: config.sap?.integrationSuite?.decorations?.companyLogo ?? true
                    }, environments: config.sap?.integrationSuite?.environments.map(environment => {
                        try {
                            environment.tenants?.forEach(tenant => {
                                if (tenant.errorTolerance == 7) tenant.errorTolerance = 6
                                else if (tenant.errorTolerance == 5) tenant.errorTolerance = 4
                                else if (tenant.errorTolerance == 3) tenant.errorTolerance = 2
                                else if (tenant.errorTolerance == 0) tenant.errorTolerance = 1
                                else if (tenant.errorTolerance == 1) tenant.errorTolerance = 2
                            })
                        } catch (e) {
                            console.error(e)
                        }
                        return environment
                    }) ?? [], performanceMeasurement: {
                        enabled: config.sap?.integrationSuite?.performanceMeasurement?.enabled ?? true,
                        logLevel: config.sap?.integrationSuite?.performanceMeasurement?.logLevel ?? 4,
                        measureIntervalInSec: config.sap?.integrationSuite?.performanceMeasurement?.measureIntervalInSec ?? 60
                    }, reminders: {
                        lockedArtifacts: config.sap?.integrationSuite?.reminders?.lockedArtifacts ?? false,
                        versionUpdates: config.sap?.integrationSuite?.reminders?.versionUpdates ?? true
                    }, undefinedTenantSettings: {
                        "color": config?.sap?.integrationSuite?.undefinedTenantSettings?.color ?? "#800",
                        "errorTolerance": Math.max(config?.sap?.integrationSuite?.undefinedTenantSettings?.errorTolerance ?? 1, 1),
                        "name": "Unknown",
                        "id": "UNKNOWN/TENANT",
                        "system": "-cpi999",
                        "datacenter": "XY99-000"
                    }, trialTenantSettings: {
                        "color": config?.sap?.integrationSuite?.trialTenantSettings?.color ?? "#808",
                        "errorTolerance": Math.min(config?.sap?.integrationSuite?.trialTenantSettings?.errorTolerance ?? 6, 6),
                        "name": "Trial",
                        "id": "TRIAL/TENANT",
                        "system": "-cpi999",
                        "datacenter": "XY99-000"
                    }
                }
            }, version: configVersion, migratedFrom: config?.version, overrides: config.overrides ?? {
                "debug": config?.overrides?.debug ?? false,
                "artifactTypes": config?.overrides?.artifactTypes ?? {},
                "shortcuts": config?.overrides?.shortcuts ?? {},
                "tenants": config?.overrides?.tenants ?? {
                    "your-tenant-id": {
                        "constant": {},
                        "folders": {
                            "customFolder": [
                                {
                                    "search": "transport",
                                    "title": "TMS",
                                    "url": "https://bilsteingroup-is-devqa.ts.cfapps.eu20.hana.ondemand.com/main/webapp/index.html"
                                }
                            ]
                        }
                    }
                },
                "environment": {
                    "your-environment-owner": {
                        "constant": {}
                    }
                },
                "disableRatelimits": config?.overrides?.disableRatelimits ?? false,
                "regexOnlySearch": config?.overrides?.regexOnlySearch ?? false,
                "constant": config?.overrides?.constant ?? {},
                "folder": {
                    "description": "Use 'customFolder' to add custom shortcuts and macros. You can find instructions on how to create these, by clicking the button right next to the save button (bottom right).",
                    "customFolder": [
                        {
                            "search": "monitoring",
                            "title": "Monitoring",
                            "url": "shell/monitoring/Messages"
                        },
                        {
                            "dynamic": true,
                            "search": "monitoring24hams",
                            "title": "Monitoring (24H)",
                            "url": "{{var(monitoringBasePath)}}/%7B%22status%22%3A%22ALL%22,%22packageId%22%3A%22ALL%22,%22type%22%3A%22ALL%22,%22time%22%3A%22PAST24%22,%22useAdvancedFields%22%3Afalse%7D"
                        },
                        {
                            "dynamic": true,
                            "search": "monitoringweekendams",
                            "title": "Monitoring (Weekend)",
                            "url": "{{var(monitoringBasePath)}}/%7B%22status%22%3A%22ALL%22,%22packageId%22%3A%22ALL%22,%22type%22%3A%22ALL%22,%22time%22%3A%22CUSTOM%22,%22from%22%3A%22{{date(last_friday,T16:00:00)}}%22,%22to%22%3A%22{{date(last_monday,T08:00:00)}}%22,%22useAdvancedFields%22%3Afalse%7D"
                        },
                        {
                            "color": "{{tenant(color)}}",
                            "search": "cloudconnectorcc",
                            "macro": "{{var(subaccountBasePath)}}{{open($0/connectivity)}}",
                            "title": "CCs (BTP)"
                        },
                        {
                            "macro": "{{pingCC}}",
                            "search": "pingcloudconnectorcc",
                            "title": "Ping CC in Adapter"
                        }
                    ]
                }
            }
        }
        clipBoardCopy(JSON.stringify(config))
        chrome.runtime.sendMessage({type: "SAP_IS_CFG_MIGRATE", configuration: migrated}).then(response => {
            if (response.status < 0) {
                createToast("There was an error while migrating to a newer configuration.<br>Your old configuration was copied to the clipboard", {className: "twineReject"})
                console.error(response)
            } else {
                createToast(`Your Twine configuration was migrated from version ${config.version} to ${configVersion}<br>The old configuration was copied to the clipboard. Just in case 🤞`)
            }
        }).catch(e => {
            console.error(e)
        })
        return migrated
    } else {
        info(`Starting with existing configuration`)
        return config
    }
}

async function checkRateLimit(key) {
    if (configuration.overrides?.disableRatelimits === true) return {
        code: 200,
        message: "Rate limits disabled through overrides"
    }
    return await chrome.runtime.sendMessage({type: "SAP_IS_RATELIMIT_REQUEST", key: key})
}

async function storeDetail(name, detail, level = storageLevel.SESSION, association = storageAssociation.TENANT) {
    let detailId = `${name}_${association == storageAssociation.TENANT ? getTenantUid() : association == storageAssociation.LANDSCAPE ? getTenantOwner() : "GLOBAL"}`
    return chrome.runtime.sendMessage({
        type: "STORE_DETAIL",
        key: detailId,
        value: detail,
        persist: level === storageLevel.PERSIST
    }).then().catch(e => {
        console.error(e)
        if (configuration?.sap?.integrationSuite?.performanceMeasurement?.logLevel ?? 1 >= 100) {
            createToast(`Could not persist detail ${name}`, {className: "twineReject"})
        }
    })
}

async function getDetail(name, level = storageLevel.SESSION, association = storageAssociation.TENANT) {
    let detailId = `${name}_${association == storageAssociation.TENANT ? getTenantUid() : association == storageAssociation.LANDSCAPE ? getTenantOwner() : "GLOBAL"}`
    return chrome.runtime.sendMessage({
        type: "GET_DETAIL",
        key: detailId,
        persisted: level === storageLevel.PERSIST
    }).then(detail => {
        return detail.value?.[detailId]
    }).catch(e => {
        console.error(e)
        if (configuration?.sap?.integrationSuite?.performanceMeasurement?.logLevel ?? 1 >= 100) {
            createToast(`Could not get detail ${name}`, {className: "twineReject"})
        }
    })
}

function getCurrentEnvironment() {
    tenantVariables.globalEnvironment = configuration?.sap?.integrationSuite?.environments?.find((environment, envIndex) => {
        return environment?.tenants?.some((tenant, tenantIndex) => {
            debug(`${environment.owner} - ${tenant.id}: ID match ${tenant.id == getTenantId()}, System match ${tenant.system == getTenantSystem()}, Datacenter match ${tenant.datacenter == getTenantDatacenter()}`, 70)
            if (tenant.id == getTenantId()) {
                tenantVariables.currentTenant = tenant
                if (tenant.system == getTenantSystem() && tenant.datacenter == getTenantDatacenter()) {
                    return true
                } else {
                    let datacenterValid = tenant.datacenter == getTenantDatacenter()
                    let systemValid = tenant.system == getTenantSystem()
                    let toastString = `Invalid${!datacenterValid && !systemValid ? " datacenter and system" : !systemValid ? " system" : " datacenter"}`
                    createToast(`${toastString}<br>Please click this toast to update ${!datacenterValid && !systemValid ? "them" : "it"} with the current url`, {
                        duration: -1, style: {textAlign: "center"}, className: "twineWarning", onClick: () => {
                            configuration.sap.integrationSuite.environments[envIndex].tenants[tenantIndex].system = getTenantSystem()
                            configuration.sap.integrationSuite.environments[envIndex].tenants[tenantIndex].datacenter = getTenantDatacenter()
                            persistConfigChange(configuration)
                        }
                    })
                }
                return true
            }
        })
    }) ?? getFallbackEnvironment()
}

const storageLevel = Object.freeze({
    SESSION: false,
    PERSIST: true
});

const storageAssociation = Object.freeze({
    TENANT: Symbol("tenant"),
    LANDSCAPE: Symbol("landscape"),
    GLOBAL: Symbol("global")
});

const LOGLEVEL = Object.freeze({
    TRACE: "TRACE",
    INFO: "INFO",
    DEBUG: "DEBUG"
})

let defaultConfiguration = {
    sap: {
        integrationSuite: {
            cloudIntegration: {
                integrationContentQuickAccess: {
                    enabled: true,
                    artifactListIntegration: true,
                    artifactListAPI: true,
                    artifactListCredentials: true,
                    artifactListShortcuts: true,
                    artifactColors: {}, artifactTypes: {}, radialMenu: {
                        mode: "CENTER"
                    }, settings: {
                        removePrefix: false
                    }
                }, mouseMapping: {}, quickAccess: {
                    enabled: true, links: {
                        "certificates": true,
                        "credentials": true,
                        "queues": true,
                        "monitoring": false,
                        "datastores": true,
                        "connectivityTest": false,
                        "checkNamingConventions": false,
                        "locks": false,
                        "messageUsage": false,
                        "stageSwitch": true
                    }
                }, unlock: {
                    enabled: false
                }
            }, decorations: {
                enabled: true, tenantStage: true, tenantStageAside: false, tenantStageHeader: false, companyLogo: true
            }, environments: [], performanceMeasurement: {
                enabled: true, logLevel: 4, measureIntervalInSec: 60
            }, reminders: {
                lockedArtifacts: false,
                versionUpdates: true
            }, undefinedTenantSettings: {
                "color": "#800",
                "errorTolerance": 1,
                "name": "Unknown",
                "id": "UNKNOWN/TENANT",
                "system": "-cpi999",
                "datacenter": "XY99-000"
            }, trialTenantSettings: {
                "color": "#808",
                "errorTolerance": 6,
                "name": "Trial",
                "id": "TRIAL/TENANT",
                "system": "-cpi999",
                "datacenter": "XY99-000"
            }
        }
    }, version: configVersion, isConfigured: true, overrides: {
        "debug":  false,
        "artifactTypes": {},
        "shortcuts": {},
        "tenants": {
            "your-tenant-id": {
                "constant": {},
                "folders": {
                    "customFolder": []
                }
            }
        },
        "environment": {
            "your-environment-owner": {
                "constant": {}
            }
        },
        "constant": {},
        "folders": {
            "description": "Use 'customFolder' to add custom shortcuts and macros. You can find instructions on how to create these, by clicking the button right next to the save button (bottom right).",
            "customFolder": [
                {
                    "search": "monitoring",
                    "title": "Monitoring",
                    "url": "shell/monitoring/Messages"
                },
                {
                    "dynamic": true,
                    "search": "monitoring24hams",
                    "title": "Monitoring (24H)",
                    "url": "{{var(monitoringBasePath)}}/%7B%22status%22%3A%22ALL%22,%22packageId%22%3A%22ALL%22,%22type%22%3A%22ALL%22,%22time%22%3A%22PAST24%22,%22useAdvancedFields%22%3Afalse%7D"
                },
                {
                    "dynamic": true,
                    "search": "monitoringweekendams",
                    "title": "Monitoring (Weekend)",
                    "url": "{{var(monitoringBasePath)}}/%7B%22status%22%3A%22ALL%22,%22packageId%22%3A%22ALL%22,%22type%22%3A%22ALL%22,%22time%22%3A%22CUSTOM%22,%22from%22%3A%22{{date(last_friday,T16:00:00)}}%22,%22to%22%3A%22{{date(last_monday,T08:00:00)}}%22,%22useAdvancedFields%22%3Afalse%7D"
                },
                {
                    "color": "{{tenant(color)}}",
                    "search": "cloudconnectorcc",
                    "macro": "{{var(subaccountBasePath)}}{{open($0/connectivity)}}",
                    "title": "CCs (BTP)"
                },
                {
                    "macro": "{{pingCC}}",
                    "search": "pingcloudconnectorcc",
                    "title": "Ping CC in Adapter"
                }
            ]
        }
    }
}

async function persistConfigChange(newConfig) {
    await chrome.runtime.sendMessage({type: "CFG_CHANGE", configuration: newConfig}).then(resolve => {
        if (resolve.status && resolve.status < 0) {
            error("Couldn't save configuration")
            console.error(resolve)
            createToast("Couldn't save<br>Please check the developer console for possible causes", {className: "twineReject"})
        } else {
            configuration = newConfig
            info(resolve.message)
            log("Configuration saved successfully")
            createToast("Saved!<br>Most changes need a refresh to take effect", {className: "twineAccept"})
        }
    })
}