let configuration
let artifactTypeConfiguration
let sidebarMainContent
let sidebar
let sidebarCollapsed
let isArtifact
let isPackage
let popoverLayer = null, popoverLayerBlocker = null
let loggedInUser = null
let locks = [], lockRequestStarted = false
let initialized = false
let configVersion = "2024.10.22"

let tenantVariables = {
    configuration: null,
    isTrial: false,
    globalEnvironment: null,
    currentTenantId: window.location.host.split(".integrationsuite")[0],
    currentTenantSystem: window.location.host.split(".integrationsuite")[1].split(".cfapps")[0],
    currentTenantDatacenter: window.location.host.split(".hana.ondemand")[0].split("cfapps.")[1],
    currentTenant: null,
    currentArtifact: {
        artifact: null,
        package: null,
        deepWorkspace: null,
        documentation: null,
        documentationObject: null
    }
}

chrome.runtime.sendMessage({type: "SAP_IS_CFG_REQUEST"}).then(message => {
    init(upgradeConfig(message.configuration))
}).catch(() => {
    createToast()
})
waitForId("sap-ui-static").then(element => {
    popoverLayer = element
    waitForId("sap-ui-blocklayer-popup").then(element => {
        popoverLayerBlocker = element
    })
    processToasts()
})

async function init(storedConfiguration) {
    configuration = storedConfiguration
    await getCsrfToken()

    let artifactColors = configuration?.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.artifactColors
    artifactTypeConfiguration = [{
            type: "IFlow",
            classType: IFlowArtifact,
            urlType: "integrationflows",
            lockType: "INTEGRATION_FLOW",
            operationsType: "IntegrationFlow",
            displayNameS: "Integration Flow",
            displayNameP: "Integration Flows",
            symbol: "",
            displayColor: "#22e",
            priority: 0
        }, {
            type: "default",
            classType: SecureMaterialArtifact,
            urlType: "",
            lockType: "SecureMaterial",
            operationsType: "SecureMaterial",
            displayNameS: "User Credential",
            displayNameP: "User Credentials",
            symbol: "",
            displayColor: "#22e",
            priority: 0
        },  {
            type: "oauth2:default",
            classType: SecureMaterialArtifact,
            urlType: "",
            lockType: "SecureMaterial",
            operationsType: "SecureMaterial",
            displayNameS: "OAuth Credential",
            displayNameP: "OAuth Credentials",
            symbol: "",
            displayColor: "#22e",
            priority: 1
        },   {
            type: "undefined",
            classType: SecureMaterialArtifact,
            urlType: "",
            lockType: "SecureMaterial",
            operationsType: "SecureMaterial",
            displayNameS: "Other Credential",
            displayNameP: "Other Credentials",
            symbol: "",
            displayColor: "#22e",
            priority: 4
        },   {
            type: "secure_param",
            classType: SecureMaterialArtifact,
            urlType: "",
            lockType: "SecureMaterial",
            operationsType: "SecureMaterial",
            displayNameS: "Secure Parameter",
            displayNameP: "Secure Parameters",
            symbol: "",
            displayColor: "#22e",
            priority: 2
        },   {
            type: "openconnectors",
            classType: SecureMaterialArtifact,
            urlType: "",
            lockType: "SecureMaterial",
            operationsType: "SecureMaterial",
            displayNameS: "Open Connector Credential",
            displayNameP: "Open Connector Credentials",
            symbol: "",
            displayColor: "#22e",
            priority: 5
        },    {
            type: "authorization_code",
            classType: SecureMaterialArtifact,
            urlType: "",
            lockType: "SecureMaterial",
            operationsType: "SecureMaterial",
            displayNameS: "OAuth Authorization Code",
            displayNameP: "OAuth Authorization Codes",
            symbol: "",
            displayColor: "#22e",
            priority: 3
        }, {
            type: "Package",
            classType: Branch,
            urlType: "contentpackage",
            lockType: "INTEGRATION_PACKAGE",
            operationsType: "",
            displayNameS: "Package",
            displayNameP: "Packages",
            symbol: "",
            displayColor: "#000000",
            priority: -1
        }, {
            type: "APIProxy",
            classType: Branch,
            urlType: "",
            lockType: "APIProxy",
            operationsType: "",
            displayNameS: "API Proxy",
            displayNameP: "API Proxies",
            symbol: "",
            displayColor: "#000000",
            priority: -1
        }, {
            type: "MessageMapping",
            classType: MessageMappingArtifact,
            urlType: "messagemappings",
            lockType: "MessageMapping",
            operationsType: "MessageMapping",
            displayNameS: "Message Mapping",
            displayNameP: "Message Mappings",
            symbol: "",
            displayColor: "#d90",
            priority: 1
        }, {
            type: "ValueMapping",
            classType: ValueMappingArtifact,
            urlType: "valuemappings",
            lockType: "VALUE_MAPPING",
            operationsType: "ValueMapping",
            displayNameS: "Value Mapping",
            displayNameP: "Value Mappings",
            symbol: "",
            displayColor: "#909",
            priority: 2
        },
        {
            type: "ScriptCollection",
            classType: ScriptCollectionArtifact,
            urlType: "scriptcollections",
            lockType: "ScriptCollection",
            operationsType: "ScriptCollection",
            displayNameS: "Script Collection",
            displayNameP: "Script Collections",
            symbol: "",
            displayColor: "#990",
            priority: 3
        },
        {
            type: "FunctionLibraries",
            classType: FunctionLibraryArtifact,
            urlType: "functionlibraries",
            lockType: "FunctionLibraries",
            operationsType: "FunctionLibraries",
            displayNameS: "Function Library",
            displayNameP: "Function Libraries",
            symbol: "",
            displayColor: "#270",
            priority: 4
        },
        {
            type: "apiportal.APIProxy",
            classType: APIProxyArtifact,
            urlType: "api",
            lockType: "TBD",
            operationsType: "",
            displayNameS: "API Proxy",
            displayNameP: "API Proxies",
            symbol: "",
            displayColor: "#270",
            priority: 0
        },
        {
            type: "DataType",
            classType: DataTypeArtifact,
            urlType: "datatypes",
            lockType: "DataType",
            operationsType: "",
            displayNameS: "Data Type",
            displayNameP: "Data Types",
            symbol: "",
            displayColor: "#27A",
            priority: 5
        },
        {
            type: "MessageType",
            classType: MessageTypeArtifact,
            urlType: "messagetypes",
            lockType: "MessageType",
            operationsType: "",
            displayNameS: "Message Type",
            displayNameP: "Message Types",
            symbol: "",
            displayColor: "#A74",
            priority: 6
        },
        {
            type: "OData Service",
            classType: ODataArtifact,
            urlType: "odataservices",
            lockType: "ODATA_SERVICE",
            operationsType: "",
            displayNameS: "OData API",
            displayNameP: "OData APIs",
            symbol: "",
            displayColor: "#336",
            priority: 7
        },
        {
            type: "RESTAPIProvider",
            classType: RESTArtifact,
            urlType: "restapis",
            lockType: "RESTAPIProvider",
            operationsType: "",
            displayNameS: "REST API",
            displayNameP: "REST APIs",
            symbol: "",
            displayColor: "#363",
            priority: 8
        },
        {
            type: "SOAPAPIProvider",
            classType: SOAPArtifact,
            urlType: "soapapis",
            lockType: "SOAPAPIProvider",
            operationsType: "",
            displayNameS: "SOAP API",
            displayNameP: "SOAP APIs",
            symbol: "",
            displayColor: "#633",
            priority: 9
        },
        {
            type: "ImportedArchives",
            classType: ArchiveArtifact,
            urlType: "importedarchives",
            lockType: "ImportedArchives",
            operationsType: "",
            displayNameS: "Imported Archive",
            displayNameP: "Imported Archives",
            symbol: "",
            displayColor: "#5a5",
            priority: 10
        },
        {
            type: "IntegrationAdapter",
            classType: IntegrationAdapterArtifact,
            urlType: "N/A",
            lockType: "N/A",
            operationsType: "ADAPTER",
            displayNameS: "Integration Adapter",
            displayNameP: "Integration Adapters",
            symbol: "",
            displayColor: "#444",
            priority: 11
        },
        {
            type: "API",
            classType: APIArtifact,
            urlType: "N/A",
            lockType: "N/A",
            operationsType: "N/A",
            displayNameS: "EIC API",
            displayNameP: "EIC APIs",
            symbol: "",
            displayColor: "#f0f",
            priority: 12
        }
    ]
    if (artifactColors) {
        let brokenKeys = []
        Object.entries(artifactColors).forEach(([key, value]) => {
            if (CSS.supports("color", value)) {
                try {
                    let type = artifactTypeConfiguration.find(it => it.type === key)
                    type.displayColor = value ?? type.displayColor
                } catch (e) {
                    brokenKeys.push(key)
                }
            } else brokenKeys.push(key)
        })
    }

    measureInterval = Math.min(Math.max(configuration?.sap?.integrationSuite?.performanceMeasurement?.measureIntervalInSec ?? 15, 15), 1800)
    info(`Performance measure interval set to ${measureInterval}s`)
    setTimedInterval(function() {
        updateRun++
        avgPerfomance = avgPerfomance * (updateRun - 1) / updateRun + (elapsedTime) / updateRun
        elapsedTime = 0.0
        log(`Avg. processing time (${measureInterval}s): ${avgPerfomance.toFixed(4)}ms, ${(avgPerfomance/(measureInterval*10)).toFixed(3)}%`)
    }, measureInterval * 1000)

    chrome.runtime.onMessage.addListener((message, sender) => {
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
                initialized = true
                tenantVariables.globalEnvironment = configuration?.sap?.integrationSuite?.environments?.find(environment => {
                    return environment.tenants.some(tenant => {
                        debug(`${environment.owner} - ${tenant.id}: ID match ${tenant.id == getTenantId()}, System match ${tenant.system == getTenantSystem()}, Datacenter match ${tenant.datacenter == getTenantDatacenter()}, `)
                        if (tenant.id == getTenantId() && tenant.system == getTenantSystem() && tenant.datacenter == getTenantDatacenter()) {
                            tenantVariables.currentTenant = tenant
                            return true
                        }
                    })
                }) ?? getFallbackEnvironment()

                if (checkErrorTolerance(4) && checkCloudIntegrationFeature("unlock")) {
                    fetchLocks()
                        .then(resolve => {
                            updateIntegrationContentLocks()
                            startHandleLocks()
                        }).catch(reject => {
                            /*TODO: Don't know yet if there is anything to do here*/
                        })
                }

                sidebarMainContent = document.getElementById("shell--navigationList")
                sidebar = sidebarMainContent.parentNode
                let sidebarObserver = new MutationObserver(mutations => {
                    setTimeout(() => {
                        addQuicklinks()
                        if (!sidebarMainContent.classList.contains("sapTntNLCollapsed")) {
                            sidebar.appendChild(twineNavigationList)
                        }
                    }, 500)
                })
                sidebarObserver.observe(sidebarMainContent, {
                    attributes: true,
                    attributeFilter: ["class"]
                });

                initializeQuicklinks()
                if (checkCloudIntegrationFeature("integrationContentQuickAccess")) initializeIntegrationContentQuicklinks()
                if (checkIntegrationSuiteFeature("decorations")) initializeDecorations()
                if (checkCloudIntegrationFeature("documentation")) initializeDocumentation()
                break
            case "ARTIFACT_ONLOAD":
                updateArtifactInfo()
                isArtifact = true
                isPackage = false
                startHandleLocks()
                break
            case "PACKAGE_ONLOAD":
                isPackage = true
                isArtifact = false
                startHandleLocks()
                break
            case "PACKAGE_START_EDIT":
            case "PACKAGE_END_EDIT":
            case "PACKAGE_OVERVIEW_ONLOAD":
            case "PACKAGE_DOCUMENTS_ONLOAD":
            case "PACKAGE_ARTIFACTS_ONLOAD":
                startHandleLocks()
                break
            case "ARTIFACT_EDIT":
                removeUnlockButton()
                break
            default:
                break
        }

        elapsedTime += window.performance.now() - runStart
        return false
    })
    return false
}

function getFallbackEnvironment() {
    let environment = {
        owner: "Unknown",
        logo: null,
        tenants: []
    }
    if (getTenantId().length == 13 && getTenantId().endsWith("trial")) {
        environment.tenants.push(configuration.sap.integrationSuite.trialTenantSettings)
    } else if (configuration.sap?.integrationSuite?.undefinedTenantSettings) {
        environment.tenants.push(configuration.sap.integrationSuite.undefinedTenantSettings)
    }
    tenantVariables.currentTenant = environment.tenants[0]
    return environment
}

function workspaceUrl() {
    return `https://${window.location.host}/odata/1.0/workspace.svc`
}

function apiPortalUrl() {
    return `https://${window.location.host}/apiportal/api/1.0/Management.svc`
}
function deepWorkspaceUrl() {
    return `https://${window.location.host}/api/1.0`
}
function publicTenantUrl() {
    return `https://${/*TODO: ADD*/address}/api/v1`
}
function operationsUrl() {
    return `https://${window.location.host}/Operations`
}

function checkErrorTolerance(level) {
    return (tenantVariables?.currentTenant?.errorTolerance ?? -1) >= (level ?? 100)
}

function error(message) {
    console.log(`%c✗ Twine: %c${message}`, "font-weight:bold;color:firebrick", "font-weight:normal;color:inherit")
}

function warn(message) {
    console.log(`%c⚠ Twine: %c${message}`, "font-weight:bold;color:orangered", "font-weight:normal;color:inherit")
}

function log(message, logLevel = 1) {
    if (configuration?.sap?.integrationSuite?.performanceMeasurement?.logLevel ?? 1 >= logLevel)
        console.log(`%c✓ Twine: %c${message}`, "font-weight:bold;color:forestgreen", "font-weight:normal;color:inherit")
}

function info(message, logLevel = 5) {
    if (configuration?.sap?.integrationSuite?.performanceMeasurement?.logLevel ?? 1 >= logLevel)
        console.log(`%cⓘ Twine: %c${message}`, "font-weight:bold;color:royalblue", "font-weight:normal;color:inherit")
}

function debug(message, logLevel = 20) {
    if (configuration?.sap?.integrationSuite?.performanceMeasurement?.logLevel ?? 1 >= Math.min(logLevel, 100))
        console.log(`%c🛠 Twine: %c${message}`, "font-weight:bold;color:darkgoldenrod", "font-weight:normal;color:inherit")
}

function setTimedInterval(intervalFunction, interval) {
    return setInterval(function() {
        let runStart = window.performance.now()
        intervalFunction()
        elapsedTime += window.performance.now() - runStart
    }, interval)
}

function checkIntegrationSuiteFeature(feature) {
    return ((feature != null) ? configuration?.sap?.integrationSuite?.[feature]?.enabled === true : configuration?.sap?.integrationSuite?.enabled === true)
}

function checkCloudIntegrationFeature(feature) {
    return ((feature != null) ? configuration?.sap?.integrationSuite?.cloudIntegration?.[feature]?.enabled === true : configuration?.sap?.integrationSuite?.cloudIntegration?.enabled === true)
}

function checkReminder(reminder) {
    return configuration?.sap?.integrationSuite?.reminders?.[reminder] === true
}

function checkQuicklink(link) {
    return (configuration?.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.[link] === true)
}

function getTypeConversion(inType, outType, value, returnEntry) {
    let type = artifactTypeConfiguration.find(it => it[inType] === value )
    if (returnEntry) {
        return type
    } else {
        return type?.[outType]
    }
}

function getRadialMode() {
    return configuration?.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.radialMenu?.mode ?? "CENTER"
}

function getTenantColor() {
    return tenantVariables.currentTenant.color ?? "black"
}
function getTenantId() {
    return tenantVariables.currentTenantId
}

function getTenantOwner() {
    return tenantVariables.globalEnvironment.owner
}
function getTenantDatacenter() {
    return tenantVariables.currentTenantDatacenter
}

//Reads the system id from the current host
//rcg-rcc-sandbox.integrationsuite-cpi026.cfapps.eu10-002.hana.ondemand.com
function getTenantSystem() {
    return tenantVariables.currentTenantSystem
}

//Reads the display name for the current tenant if configured
function getTenantName() {
    return tenantVariables.currentTenant.name ?? "Unknown"
}

function upgradeConfig(config) {
    if (config == null) {
        log(`No config exists. Creating default config with version ${configVersion}`)
        let defaultConfig = {
            sap: {
                cloudStatus: {
                    hideFunctional: false
                },
                integrationSuite: {
                    cloudIntegration: {
                        integrationContentQuickAccess: {
                            enabled: true,
                            artifactColors: {},
                            radialMenu: {
                                mode: "CENTER"
                            },
                            settings: {
                                removePrefix: false
                            }
                        },
                        mouseMapping: {},
                        quickAccess: {
                            enabled:  true,
                            links: {
                                "certificates": true,
                                "credentials": true,
                                "queues": true,
                                "monitoring": false,
                                "datastores": true,
                                "connectivityTest": false,
                                "checkNamingConventions": false,
                                "locks": false,
                                "stageSwitch": true
                            }
                        },
                        unlock: {
                            enabled: false
                        },
                        documentation: {
                            enabled: false,
                            enableEditingDocumentation: false,
                            aiSummary: false
                        }
                    },
                    decorations: {
                        enabled: true,
                        tenantStage: true,
                        companyLogo: true
                    },
                    environments: [],
                    performanceMeasurement: {
                        enabled: true,
                        logLevel: 19,
                        measureIntervalInSec: 60
                    },
                    reminders: {
                        lockedArtifacts: false
                    },
                    undefinedTenantSettings: {
                        "color": "#800",
                        "errorTolerance": 0,
                        "name": "Unknown",
                        "id": "UNKNOWN/TENANT",
                        "system": "-cpi999",
                        "datacenter": "XY99-000"
                    },
                    trialTenantSettings: {
                        "color": "#808",
                        "errorTolerance": 7,
                        "name": "Trial",
                        "id": "TRIAL/TENANT",
                        "system": "-cpi999",
                        "datacenter": "XY99-000"
                    }
                }
            },
            version: configVersion,
            isConfigured: true
        }
        clipBoardCopy(JSON.stringify(config))
        chrome.runtime.sendMessage({type: "SAP_IS_CFG_INIT", configuration: defaultConfig}).then(response => {
            if (response.status < 0) {
                createToast({message: "There was an error creating a configuration. Check the developer console for possible causes"})
                console.error(response)
            }
        })
        return defaultConfig
    } else if (compareVersion(configVersion, config.version) > 0) {
        log(`Migrating from config version ${config.version} to ${configVersion}`)
        let enableKey = compareVersion(config.version, "2024.10.21") >= 0 ? "enabled" : "_enabled"
        let migrated = {
            sap: {
                cloudStatus: {
                    hideFunctional: config.sap?.cloudStatus?.hideFunctional ?? true
                },
                integrationSuite: {
                    cloudIntegration: {
                        integrationContentQuickAccess: {
                            enabled: config.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.[enableKey] ?? true,
                            artifactColors:
                                Object.entries(config.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.artifactColors ?? {})
                                    .reduce((a, v) => ({ ...a, [v[0]]: tryCoerceColor(v[1])}), {})
                            ,
                            radialMenu: {
                                mode: config.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.radialMenu?.mode ?? "CENTER"
                            },
                            settings: {
                                removePrefix: config.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.settings?.removePrefix ?? false
                            }
                        },
                        mouseMapping: {},
                        quickAccess: {
                            enabled:  config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.[enableKey] ?? true,
                            links: {
                                "certificates": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.certificates ?? true,
                                "credentials": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.credentials ?? true,
                                "queues": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.queues ?? true,
                                "monitoring": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.monitoring ?? false,
                                "datastores": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.datastores ?? true,
                                "connectivityTest": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.connectivityTest ?? false,
                                "checkNamingConventions": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.checkNamingConventions ?? false,
                                "locks": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.locks ?? false,
                                "stageSwitch": config.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.stageSwitch ?? true
                            }
                        },
                        unlock: {
                            enabled: config.sap?.integrationSuite?.cloudIntegration?.unlock?.[enableKey] ?? false
                        },
                        documentation: {
                            enabled: config.sap?.integrationSuite?.cloudIntegration?.documentation?.[enableKey] && config?.sap?.integrationSuite?.cloudIntegration?.documentation?.readDocumentation,
                            enableEditingDocumentation: config.sap?.integrationSuite?.cloudIntegration?.documentation.enableEditingDocumentation ?? false,
                            aiSummary: config.sap?.integrationSuite?.cloudIntegration?.documentation?.aiSummary ?? false
                        }
                    },
                    decorations: {
                        enabled: config.sap?.integrationSuite?.decorations?.[enableKey] ?? true,
                        tenantStage: config.sap?.integrationSuite?.decorations?.tenantStage ?? true,
                        companyLogo: config.sap?.integrationSuite?.decorations?.companyLogo ?? true
                    },
                    environments: config.sap?.integrationSuite?.environments ?? [],
                    performanceMeasurement: {
                        enabled: config.sap?.integrationSuite?.performanceMeasurement?.[enableKey] ?? true,
                        logLevel: config.sap?.integrationSuite?.performanceMeasurement?.logLevel ?? 19,
                        measureIntervalInSec: config.sap?.integrationSuite?.performanceMeasurement?.measureIntervalInSec ?? 60
                    },
                    reminders: {
                        lockedArtifacts: config.sap?.integrationSuite?.reminders?.lockedArtifacts ?? false
                    },
                    undefinedTenantSettings: {
                        "color": configuration?.sap?.integrationSuite?.undefinedTenantSettings?.color ?? "#800",
                        "errorTolerance": configuration?.sap?.integrationSuite?.undefinedTenantSettings?.errorTolerance ?? 0,
                        "name": "Unknown",
                        "id": "UNKNOWN/TENANT",
                        "system": "-cpi999",
                        "datacenter": "XY99-000"
                    },
                    trialTenantSettings: {
                        "color": configuration?.sap?.integrationSuite?.trialTenantSettings?.color ?? "#808",
                        "errorTolerance": configuration?.sap?.integrationSuite?.trialTenantSettings?.errorTolerance ?? 7,
                        "name": "Trial",
                        "id": "TRIAL/TENANT",
                        "system": "-cpi999",
                        "datacenter": "XY99-000"
                    }
                }
            },
            version: configVersion,
            migratedFrom: config?.version
        }
        clipBoardCopy(JSON.stringify(config))
        chrome.runtime.sendMessage({type: "SAP_IS_CFG_MIGRATE", configuration: migrated}).then(response => {
            if (response.status < 0) {
                createToast({message: "There was an error while migrating to a newer configuration.<br>Your old configuration was copied to the clipboard"})
                console.error(response)
            } else {
                createToast({message: "Your configuration was migrated to a newer version.<br>The old configuration was copied to the clipboard. Just in case"})
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