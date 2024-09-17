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

let tenantVariables = {
    configuration: null,
    isTrial: false,
    globalEnvironment: null,
    currentTenantId: window.location.host.split(".integrationsuite")[0],
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
    init(message)
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

async function init(message) {
    configuration = message.configuration
    if (configuration?.sap?.integrationSuite?.cloudIntegration == null) {
        let errors = validateConfig()
        createToast({message: `You managed to import a faulty config or to delete the default one.<p><b>Congratulations!</b></p><br><p>These are the identified errors</p>${errors.join('<br>')}`})
    }
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
            type: "Package",
            classType: Branch,
            urlType: "contentpackage",
            lockType: "INTEGRATION_PACKAGE",
            operationsType: "",
            displayNameS: "Package",
            displayNameP: "Packages",
            symbol: "",
            displayColor: "#000000DE",
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
            displayColor: "#000000DE",
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

        if (brokenKeys.length > 0)
            createToast({message: `The following display colors for artifact types are unknown or invalid: <p>${brokenKeys.map(it => "<b>" + it + "</b>").join("<br>")}</p>Feel free to be annoyed by this message, until you fix your configuration`})
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

        switch (message.type) {
            case "SESSION_CHANGE":
                switch (message.changeType) {
                    case "LOCK_DELETED":
                        break
                    default:
                        break
                }
                break
            case "CONFIGURATION_CHANGE":
                break
            case "GENERAL_ONLOAD":
                if (initialized) {
                    debug("Already initialized")
                    elapsedTime += window.performance.now() - runStart
                    return
                }
                initialized = true
                log(`Workflow started ${configuration != null ? "with" : "without" } configuration`)
                tenantVariables.globalEnvironment = configuration?.sap?.integrationSuite?.environments?.find(environment => {
                    return environment.tenants.some(tenant => {
                        if (tenant.id == getTenantId()) {
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

                if (checkCloudIntegrationFeature("quickAccess")) initializeQuicklinks(sidebarCollapsed)
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
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/SAP_2011_logo.svg/320px-SAP_2011_logo.svg.png",
        tenants: []
    }
    if (configuration) {
        if (getTenantId().length == 13 && getTenantId().endsWith("trial")) {
            tenantVariables.isTrial = true
            if (configuration.sap?.integrationSuite?.trialForceEnabled === true) {
                environment.tenants.push({
                    "color": "#808",
                    "errorTolerance": 7,
                    "name": "Trial",
                    "forceEnable": true
                })
            } else if (configuration.sap?.integrationSuite?.trialTenantSettings) {
                environment.tenants.push(configuration.sap.integrationSuite.trialTenantSettings)
            } else if (configuration.sap?.integrationSuite?.undefinedTenantSettings) {
                environment.tenants.push(configuration.sap.integrationSuite.undefinedTenantSettings)
            } else {
                environment.tenants.push({
                    "color": "#800",
                    "errorTolerance": 0,
                    "name": "Trial"
                })
            }
        } else if (configuration.sap?.integrationSuite?.undefinedTenantSettings) {
            environment.tenants.push(configuration.sap.integrationSuite.undefinedTenantSettings)
        } else {
            environment.tenants.push({
                "color": "#800",
                "errorTolerance": 0,
                "name": "Únknown"
            })
        }
    } else {
        environment.tenants.push({
            "color": "#800",
            "errorTolerance": 0,
            "name": "Unknown"
        })
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
    return ((feature != null) ? configuration?.sap?.integrationSuite?.[feature]?._enabled === true : configuration?.sap?.integrationSuite?._enabled === true) || tenantVariables.currentTenant.forceEnable === true
}

function checkCloudIntegrationFeature(feature) {
    return ((feature != null) ? configuration?.sap?.integrationSuite?.cloudIntegration?.[feature]?._enabled === true : configuration?.sap?.integrationSuite?.cloudIntegration?._enabled === true) || tenantVariables.currentTenant.forceEnable === true
}

function checkReminder(reminder) {
    return configuration?.sap?.integrationSuite?.reminders?.[reminder] === true
}

function checkQuicklink(link) {
    return (configuration?.sap?.integrationSuite?.cloudIntegration?.quickAccess?.links?.[link] === true) || tenantVariables.currentTenant.forceEnable === true
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
    return configuration?.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.radialMenu?.mode
}

function getTenantColor() {
    return tenantVariables.currentTenant.color ?? "black"
}
function getTenantId() {
    return tenantVariables.currentTenantId
}
function getTenantName() {
    return tenantVariables.currentTenant.name ?? "Unknown"
}

function validateConfig() {
    let errors = []
    if (Array.isArray(configuration)) {
        errors.push("Your config is an array")
    } else {
        if (Object.keys(configuration).length === 0) {
            errors.push("The config is completely empty")
        } else {
            if (configuration.sap?.integrationSuite?.cloudIntegration == null) errors.push("JSON Path <span style='color: #36a'>$.sap.integrationSuite.cloudIntegration</span> is empty")
        }
    }
    return errors
}


/*
<div class="sapMDialog sapMDialog-CTX sapMPopup-CTX sapMMessageDialog sapUiShd sapUiUserSelectable sapMDialogOpen" style="position: absolute; visibility: visible; z-index: 70 !important; left: 5%; right: 5%; top: 5%; bottom: 5%; display: block; margin: auto !important;">
                <span class="sapMDialogFirstFE"></span>
                <header>
                    <div class="sapMDialogTitleGroup">
                        <div class="sapMIBar sapMIBar-CTX sapMBar sapMContent-CTX sapMBar-CTX sapMHeader-CTX sapMBarTitleAlignAuto">
                            <div class="sapMBarLeft sapMBarContainer sapMBarEmpty"></div>
                            <div class="sapMBarMiddle">
                                <div class="sapMBarPH sapMBarContainer" style="width: 100%;">
                                    <h1 class="sapMTitle sapMTitleStyleAuto sapMTitleNoWrap sapUiSelectable sapMTitleMaxWidth sapMDialogTitle sapMBarChild">
                                        <span dir="auto">Tenant Configuration</span>
                                    </h1>
                                </div>
                            </div>
                            <div class="sapMBarRight sapMBarContainer sapMBarEmpty"></div>
                        </div>
                        <span class="sapUiInvisibleText"></span>
                    </div>
                </header>
                <section class="sapMDialogSection sapUiScrollDelegate disableScrollbars" style="overflow: auto;">

                <div class="sapMTabContainer sapUiResponsiveContentPadding sapUiResponsivePadding--header">
                <div class="sapMTabStripContainer sapUi-Std-PaddingXL">
                    <div class="sapMTabStrip sapContrastPlus">
                        <div class="sapMTSLeftOverflowButtons"></div>
                        <div class="sapMTSTabsContainer sapUiScrollDelegate" tabindex="0" style="overflow: hidden;">
                            <div class="sapMTSTabs">
                                <div class="sapMTabStripItem sapMTabStripItemSelected" tabindex="-1">
                                    <div class="sapMTSTexts">
                                        <div class="sapMTabStripItemAddText"></div>
                                        <div class="sapMTabStripItemLabel">Development</div>
                                    </div>
                                    <div class="sapMTSItemCloseBtnCnt">
                                        <button tabindex="-1" title="Close" class="sapMBtnBase sapMBtn sapMTabStripSelectListItemCloseBtn">
                                            <span class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnIconFirst sapMBtnTransparent">
                                                <span data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapMBtnCustomIcon sapMBtnIcon sapMBtnIconLeft" style="font-family: SAP-icons;"></span>
                                            </span>
                                            <span class="sapUiInvisibleText">Close</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="sapMTabStripItem sapMTabStripItemModified" tabindex="-1">
                                    <div class="sapMTSTexts">
                                        <div class="sapMTabStripItemAddText"></div>
                                        <div class="sapMTabStripItemLabel">
                                            Quality Assurance
                                            <span class="sapMTabStripItemModifiedSymbol"></span>
                                        </div>
                                    </div>
                                    <div class="sapMTSItemCloseBtnCnt">
                                        <button tabindex="-1" title="Close" class="sapMBtnBase sapMBtn sapMTabStripSelectListItemCloseBtn">
                                            <span class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnIconFirst sapMBtnTransparent">
                                                <span data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapMBtnCustomIcon sapMBtnIcon sapMBtnIconLeft" style="font-family: SAP-icons;"></span>
                                            </span>
                                            <span class="sapUiInvisibleText">Close</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="sapMTabStripItem" tabindex="-1">
                                    <div class="sapMTSTexts">
                                        <div class="sapMTabStripItemAddText"></div>
                                        <div class="sapMTabStripItemLabel">Production</div>
                                    </div>
                                    <div class="sapMTSItemCloseBtnCnt">
                                        <button tabindex="-1" title="Close" class="sapMBtnBase sapMBtn sapMTabStripSelectListItemCloseBtn">
                                            <span class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnIconFirst sapMBtnTransparent">
                                                <span data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapMBtnCustomIcon sapMBtnIcon sapMBtnIconLeft" style="font-family: SAP-icons;"></span>
                                            </span>
                                            <span class="sapUiInvisibleText">Close</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="sapMTSRightOverflowButtons"></div>
                        <div class="sapMTSTouchArea">
                            <div tabindex="-1" class="sapMSlt sapMSltIconOnly sapMSltAutoAdjustedWidth sapMSltWithIcon sapMSltHoverable sapMSltWithArrow sapMTSOverflowSelect" style="max-width: 2.5rem;">
                                <div tabindex="0" title="Opened Tabs" class="sapUiPseudoInvisibleText sapMSltHiddenSelect"></div>
                                <input name="" value="" tabindex="-1" class="sapUiPseudoInvisibleText">
                                <span title="Opened Tabs" class="sapMSltLabel sapUiPseudoInvisibleText"></span>
                                <span data-sap-ui-icon-content="" title="Opened Tabs" class="sapMSltIcon sapUiIcon sapUiIconMirrorInRTL" style="font-family: SAP-icons;"></span>
                            </div>
                            <button title="Add New Tab" class="sapMBtnBase sapMBtn sapMTSAddNewTabBtn">
                                <span class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnIconFirst sapMBtnTransparent">
                                    <span data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapMBtnCustomIcon sapMBtnIcon sapMBtnIconLeft" style="font-family: SAP-icons;"></span>
                                </span>
                                <span class="sapUiInvisibleText">Add New Tab</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="sapMTabContainerContent sapMTabContainerContentList">
                    <div class="sapMTabContainerInnerContent">
                        <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                            <span class="sapMLabelTextWrapper">
                                <bdi>Tenant URL:</bdi>
                            </span>
                            <span data-colon=":" class="sapMLabelColonAndRequired"></span>
                        </span>
                        <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput" style="width: 100%;display: flex;justify-content: space-between;align-items: baseline;"><div class="sapMInputDescriptionWrapper" style="width: max-content;">
                                <span class="sapMInputDescriptionText" style="padding-left: 0">https://</span>
                            </div>
                            <div class="sapMInputBaseContentWrapper" style="width: auto;">
                                <input value="dummy-is-dev" type="text" autocomplete="off" class="sapMInputBaseInner">
                            </div>
                        <div class="sapMInputDescriptionWrapper" style="width: max-content;">
                                <span class="sapMInputDescriptionText">.integrationsuite.cfapps.</span>
                            </div><div class="sapMInputBaseContentWrapper" style="width: auto;">
                                <input value="eu20-001" type="text" autocomplete="off" class="sapMInputBaseInner">
                            </div><div class="sapMInputDescriptionWrapper" style="width: max-content;">
                                <span class="sapMInputDescriptionText">.hana.ondemand.com</span>
                            </div></div>
                        <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                            <span class="sapMLabelTextWrapper">
                                <bdi>Tenant Tag:</bdi>
                            </span>
                            <span data-colon=":" class="sapMLabelColonAndRequired"></span>
                        </span>
                        <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput" style="width: 100%;">
                            <div class="sapMInputBaseContentWrapper" style="width: 100%;">
                                <input value="Doe" type="text" autocomplete="off" class="sapMInputBaseInner">
                            </div>
                        </div>
                        <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                            <span class="sapMLabelTextWrapper">
                                <bdi>Salary:</bdi>
                            </span>
                            <span data-colon=":" class="sapMLabelColonAndRequired"></span>
                        </span>
                        <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription" style="width: 100%;">
                            <div class="sapMInputBaseContentWrapper" style="width: 50%;">
                                <input value="1455.22" type="text" autocomplete="off" class="sapMInputBaseInner">
                            </div>
                            <div class="sapMInputDescriptionWrapper" style="width: 20%;">
                                <span class="sapMInputDescriptionText">EUR</span>
                            </div>
                        <div class="sapMInputBaseContentWrapper" style="width: 25%;">
                                <input type="color" id="html5colorpicker" onchange="clickColor(0, -1, -1, 5)" value="#ff0000" style="width:100%;">
                            </div></div>
                    </div>
                </div>
            </div></section>
                <footer class="sapMDialogFooter">
                    <div class="sapMIBar sapMTBInactive sapMTB sapMTBNewFlex sapMTBStandard sapMTB-Auto-CTX sapMOTB sapMTBNoBorders sapMIBar-CTX sapMFooter-CTX">
                        <div class="sapMTBSpacer sapMTBSpacerFlex sapMBarChild sapMBarChildFirstChild"></div>
                    <button class="sapMBtnBase sapMBtn elementFadeIn sapMBarChild"><span class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnInverted sapMBtnText"><span class="sapMBtnContent"><div class="sapMBusyIndicator" style="display: none"><span tabindex="0" class="sapUiBlockLayerTabbable"></span><div class="sapMBusyIndicatorBusyArea sapUiLocalBusy" style="position: relative;"><div class="sapUiBlockLayer  sapUiLocalBusyIndicator sapUiLocalBusyIndicatorSizeMedium sapUiLocalBusyIndicatorFade" alt="" tabindex="0" title="Please wait"><div class="sapUiLocalBusyIndicatorAnimation sapUiLocalBusyIndicatorAnimStandard"><div></div><div></div><div></div></div></div></div><span tabindex="0" class="sapUiBlockLayerTabbable"></span></div><bdi title="Save">Save</bdi></span></span></button><button class="sapMBtnBase sapMBtn elementFadeIn sapMBarChild"><span class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnDefault sapMBtnText"><span class="sapMBtnContent"><div class="sapMBusyIndicator" style="display: none"><span tabindex="0" class="sapUiBlockLayerTabbable"></span><div class="sapMBusyIndicatorBusyArea sapUiLocalBusy" style="position: relative;"><div class="sapUiBlockLayer  sapUiLocalBusyIndicator sapUiLocalBusyIndicatorSizeMedium sapUiLocalBusyIndicatorFade" alt="" tabindex="0" title="Please wait"><div class="sapUiLocalBusyIndicatorAnimation sapUiLocalBusyIndicatorAnimStandard"><div></div><div></div><div></div></div></div></div><span tabindex="0" class="sapUiBlockLayerTabbable"></span></div><bdi title="Close">Close</bdi></span></span></button></div>
                </footer>
                <span class="sapMDialogLastFE"></span>
            </div>
* */