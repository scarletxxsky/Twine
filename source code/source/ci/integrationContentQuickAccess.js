let twineNavigationList
let radialMenu
let radialMenuDetailDisplay
let artifactRequestStarted
let integrationContentQuickAccessReady = false

//todo: Replace constants with artifactTypeConfiguration references
let integrationContent = {
    designtimeArtifacts: {
        errorTolerance: 1,
        id: "designtimeArtifacts",
        listId: "artifactListIntegration",
        title: "Integrations",
        rootPath: "/shell/design",
        content: [],
        maxAge: 60,
        lastTimestamp: 0,
        treeIndex: 0,
        updateInterval: null
    },
    runtimeArtifacts: {
        errorTolerance: 1,
        id: "runtimeArtifacts",
        listId: "artifactListIntegration",
        title: "Integrations",
        rootPath: "/shell/monitoring/Artifacts",
        content: [],
        maxAge: 60,
        lastTimestamp: 0,
        treeIndex: -1,
        updateInterval: null
    },
    apiProxies: {
        errorTolerance: 1,
        id: "apiProxies",
        listId: "artifactListAPI",
        title: "API Proxies",
        rootPath: "/shell/configure",
        content: [],
        maxAge: 60,
        lastTimestamp: 0,
        treeIndex: 1,
        updateInterval: null
    },
    secureMaterials: {
        errorTolerance: 1,
        id: "secureMaterials",
        listId: "artifactListCredentials",
        title: "Secure Materials",
        rootPath: "/shell/monitoring/SecurityMaterials",
        content: [],
        maxAge: 60,
        lastTimestamp: 0,
        treeIndex: 2,
        updateInterval: null
    },
    customFolder: {
        errorTolerance: 0,
        id: "customFolder",
        listId: "artifactListShortcuts",
        title: "Shortcuts",
        rootPath: "#",
        content: [],
        maxAge: 60,
        lastTimestamp: null,
        treeIndex: 3
    }
}

function workspaceContentPackagesUrl() {
    return workspaceUrl() + `/ContentEntities.ContentPackages?$expand=Artifacts&$format=json`
}

function apiProxiesUrl() {
    return apiPortalUrl() + `/APIProxies?$expand=proxyEndPoints,targetEndPoints,apiProducts,proxyEndPoints/virtualhosts,proxyEndPoints/routeRules,deploymentInfo,targetEndPoints/properties,targetEndPoints/additionalApiProviders&$format=json`
}

function rebuildTree(id) {
    let runStart = window.performance.now()
    if (integrationContent[id].treeIndex == -1) return
    if (integrationContent[id].tree != null) integrationContent[id].tree.domInstance.innerHTML = ""
    if (configuration.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.[integrationContent[id].listId] != true) return
    integrationContent[id].tree = new Tree([
        {
            title: integrationContent[id].title,
            meta: {twineContext: "TREE_ROOT", twineContextType: id, twineContextRoot: integrationContent[id].rootPath},
            children: integrationContent[id].content,
            id: id,
            age: integrationContent[id].lastTimestamp
        }]
    )
    if (id == "designtimeArtifacts") {
        updateRuntimeArtifacts()
    }

    twineNavigationList.insertBefore(integrationContent[id].tree.domInstance, twineNavigationList.childNodes[integrationContent[id].treeIndex])

    elapsedTime += window.performance.now() - runStart
}

async function initializeIntegrationContent() {
    let runStart = window.performance.now()
    twineNavigationList = document.createElement("ul")
    twineNavigationList.height = "max-content"
    twineNavigationList.style.flexGrow = "1"
    twineNavigationList.id = "__twine-shell--navigationList"
    twineNavigationList.classList.add("sapTntNL", "elementFadeIn", "widthShift", "noFocus")

    if (!sidebarMainContent.classList.contains("sapTntNLCollapsed")) {
        sidebar.appendChild(twineNavigationList)
    }

    if (checkErrorTolerance(2)) {
        if (configuration.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.artifactListIntegration) buildIntegrationArtifacts()
        if (configuration.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.artifactListAPI) buildApiProxies()
        if (configuration.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.artifactListCredentials) buildSecureMaterials()
    }

    if (configuration.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.artifactListShortcuts) await buildCustomShortcuts().then(updateCustomShortcuts)

    elapsedTime += window.performance.now() - runStart
}

function buildIntegrationArtifacts() {
    integrationContent.designtimeArtifacts.tree = new Tree()
    twineNavigationList.insertBefore(integrationContent.designtimeArtifacts.tree.domInstance, twineNavigationList.childNodes[integrationContent.designtimeArtifacts.treeIndex])
    integrationContent.designtimeArtifacts.tree.setBusy(true, "Waiting for Packages")

    fetchArtifacts().then(() => {
        let runStart = window.performance.now()
        integrationContent.designtimeArtifacts.lastTimestamp = Date.now()
        updateArtifacts()
        integrationContentQuickAccessReady = true

        integrationContent.designtimeArtifacts.tree.setBusy(true, "Waiting for Runtime Artifacts")
        fetchRuntimeArtifacts().then(() => {
            integrationContent.runtimeArtifacts.lastTimestamp = Date.now()
            updateRuntimeArtifacts()

            integrationContent.designtimeArtifacts.updateInterval = setTimeout(function tickRuntime() {
                fetchRuntimeArtifacts().then(() => {
                    integrationContent.runtimeArtifacts.lastTimestamp = Date.now()
                    integrationContent.designtimeArtifacts.updateInterval = setTimeout(tickRuntime, integrationContent.runtimeArtifacts.maxAge * 1000)
                    //updateRuntimeArtifacts()
                })
            }, integrationContent.runtimeArtifacts.maxAge * 1000)
        })

        integrationContent.runtimeArtifacts.updateInterval = setTimeout(function tickDesigntime() {
            fetchArtifacts().then(() => {
                integrationContent.designtimeArtifacts.lastTimestamp = Date.now()
                //updateArtifacts()

                integrationContent.runtimeArtifacts.updateInterval = setTimeout(tickDesigntime, integrationContent.designtimeArtifacts.maxAge * 1000)
            })
        }, integrationContent.designtimeArtifacts.maxAge * 1000)
        elapsedTime += window.performance.now() - runStart
    }).catch(reject => {
        switch (reject.status) {
            case 500:
                warn(`Packages could not be loaded`)
                createToast("Could not update designtime artifacts. Your session may have expired", {className: "twineReject"})
                break;
            case 403:
                createToast("Your user does not seem to have permission to access integration content", {className: "twineReject"})
                break;
            case 401:
                warn(`User session may have expired`)
                break;
            case -1:
                createToast("Designtime artifact request timed out", {className: "twineReject"})
                break
            default:
                createToast("Could not update designtime artifacts", {className: "twineReject"})
                error("Could not update designtime artifacts")
                console.error(reject)
                break;
        }
    }).finally(() => {
        integrationContent.designtimeArtifacts.tree.setBusy(false, "")
    })
}

function buildApiProxies() {
    integrationContent.apiProxies.tree = new Tree()
    twineNavigationList.insertBefore(integrationContent.apiProxies.tree.domInstance, twineNavigationList.childNodes[integrationContent.apiProxies.treeIndex])
    integrationContent.apiProxies.tree.setBusy(true, "Waiting for API Proxies")
    fetchProxies().then(() => {
        let runStart = window.performance.now()
        integrationContent.apiProxies.lastTimestamp = Date.now()
        integrationContent.apiProxies.tree.addTrunks([{
            title: "API Proxies",
            meta: {
                twineContext: "TREE_ROOT",
                twineContextType: "apiProxies",
                twineContextRoot: "/shell/configure"
            },
            children: integrationContent.apiProxies.content,
            id: "apiProxies",
            age: integrationContent.apiProxies.lastTimestamp
        }])

        integrationContent.apiProxies.updateInterval = setTimeout(function tickApiProxies() {
            fetchProxies().then(() => {
                integrationContent.apiProxies.lastTimestamp = Date.now()

                integrationContent.apiProxies.updateInterval = setTimeout(tickApiProxies, integrationContent.apiProxies.maxAge * 1000)
            })
        }, integrationContent.designtimeArtifacts.maxAge * 1000)
        elapsedTime += window.performance.now() - runStart
    }).finally(() => {
        integrationContent.apiProxies.tree.setBusy(false, "")
    })
}

function buildSecureMaterials() {
    integrationContent.secureMaterials.tree = new Tree()
    twineNavigationList.insertBefore(integrationContent.secureMaterials.tree.domInstance, twineNavigationList.childNodes[integrationContent.secureMaterials.treeIndex])
    integrationContent.secureMaterials.tree.setBusy(true, "Waiting for Secure Materials")
    fetchSecureMaterials().then(() => {
        integrationContent.secureMaterials.lastTimestamp = Date.now()
        integrationContent.secureMaterials.tree.addTrunks([{
            title: "Secure Materials",
            meta: {
                twineContext: "TREE_ROOT",
                twineContextType: "secureMaterials",
                twineContextRoot: "/shell/monitoring/SecurityMaterials"
            },
            children: integrationContent.secureMaterials.content,
            id: "secureMaterials",
            age: integrationContent.secureMaterials.lastTimestamp
        }])

        integrationContent.secureMaterials.updateInterval = setTimeout(function tickSecureMaterials() {
            fetchSecureMaterials().then(() => {
                integrationContent.secureMaterials.lastTimestamp = Date.now()

                integrationContent.secureMaterials.updateInterval = setTimeout(tickSecureMaterials, integrationContent.secureMaterials.maxAge * 1000)
            })
        }, integrationContent.designtimeArtifacts.maxAge * 1000)
    }).catch(e => {
        console.error(e)
    }).finally(() => {
        integrationContent.secureMaterials.tree.setBusy(false, "")
    })
}

async function buildCustomShortcuts() {
    let shortcuts = []
    for (shortcut of (configuration.overrides?.folders?.customFolder ?? []).concat(configuration.overrides?.environments?.[getTenantOwner()]?.folders?.customFolder ?? []).concat(configuration.overrides?.tenants?.[getTenantId()]?.folders?.customFolder ?? [])) {
        shortcuts.push(await async function () {
            try {
                let color = shortcut.color ? await resolveDynamic(shortcut.color) : getTypeConversion("type", "displayColor", "customShortcut") ?? getTypeConversion("type", "displayColor", "customShortcut")
                let background = await resolveDynamic(shortcut.background)
                return {
                    meta: {
                        title: shortcut.title,
                        twineContext: "TREE_LEAF",
                        twineContextType: "customShortcut",
                        url: shortcut.url,
                        value: shortcut.value,
                        dynamic: shortcut.dynamic,
                        macro: shortcut.macro,
                        search: shortcut.search,
                        color: color,
                        background: background
                    }
                }
            } catch (e) {
                console.error(e)
                return null
            }
        }())
    }
    integrationContent.customFolder.content = shortcuts.filter(it => it != null)/*await Promise.all((configuration.overrides?.folders?.customFolder ?? []).concat(configuration.overrides?.tenants?.[getTenantId()]?.folders?.customFolder ?? []).map(async it => {
        return {
            meta: {
                twineContext: "TREE_LEAF",
                twineContextType: "customShortcut",
                title: it.title,
                url: it.url,
                value: it.value,
                dynamic: it.dynamic,
                macro: it.macro,
                search: it.search,
                color: await resolveDynamic(it.color) ?? getTypeConversion("type", "displayColor", "customShortcut")
            },
            title: it.title
        }
    }))*/
}

function updateCustomShortcuts() {
    try {
        integrationContent.customFolder.tree = new Tree()
        integrationContent.customFolder.tree.setBusy(true, "Building Custom Shortcuts")
        twineNavigationList.insertBefore(integrationContent.customFolder.tree.domInstance, twineNavigationList.childNodes[integrationContent.customFolder.treeIndex])
        /*integrationContent.customFolder.tree.addTrunks([{
            title: "Shortcuts",
            meta: {twineContext: "TREE_ROOT", twineContextType: "customFolder", twineContextRoot: "#"},
            id: "customFolder",
            age: integrationContent.customFolder.lastTimestamp,
            children: [{...configuration.overrides?.folders ?? {}, ...configuration.overrides?.tenants?.[getTenantId()]?.folders ?? {}}.map(it => {
                return {}
            })]}
        ])*/
        integrationContent.customFolder.tree.addTrunks([{
                title: "Shortcuts",
                meta: {twineContext: "TREE_ROOT", twineContextType: "customFolder", twineContextRoot: "#"},
                children: integrationContent.customFolder.content,
                id: "customFolder",
                age: integrationContent.customFolder.lastTimestamp
            }]
        )
    } catch (e) {
        createToast("Couldn't add custom shortcuts", {className: "twineReject"})
    } finally {
        integrationContent.customFolder.tree.setBusy(false, "")
    }
}

async function fetchArtifacts(parameters) {
    artifactRequestStarted = true
    let response = await chrome.runtime.sendMessage({
        type: "SAP_IS_UNIFY_REQUEST",
        requestType: "designtimeArtifacts",
        tenantId: getTenantUid(),
        maxAge: integrationContent.designtimeArtifacts.maxAge
    })

    let runStart = window.performance.now()
    if (response.status == "request" || response.status == "reassign" || parameters?.forceRefresh === true) {
        /*if (integrationContent.designtimeArtifacts.content.length > 0 && !UserActivation.isActive && response.status != "reassign") {
            info("User inactive. Skipping request (Designtime Artifacts)")
            return
        }*/
        return callXHR("GET", workspaceContentPackagesUrl(), null, null, false, {headers: {"Cache-Control": "no-cache, no-store, max-age=0"}}).then(resolve => {
            let runStart = window.performance.now()
            artifactRequestStarted = false
            let contentPackages = JSON.parse(resolve).d.results
            contentPackages = contentPackages.sort((a, b) => {
                return (a.DisplayName < b.DisplayName) ? -1 : (a.DisplayName > b.DisplayName) ? 1 : 0
            })
                .map(package => {
                    return {
                        title: package.DisplayName,
                        meta: {
                            twineContext: "TREE_BRANCH",
                            twineContextType: "designtimeArtifacts",
                            packageId: package.TechnicalName,
                            packageName: package.DisplayName,
                            artifactId: package.TechnicalName,
                            artifactName: package.DisplayName,
                            artifactProducts: package.Products?.toLowerCase().split(",") ?? [],
                            artifactIndustries: package.Industries?.toLowerCase().split(",") ?? [],
                            artifactLoB: package.LineOfBusiness?.toLowerCase().split(",") ?? [],
                            artifactKeywords: package.Keywords?.toLowerCase().split(",") ?? [],
                            search: [...new Set([
                                package.DisplayName.replaceAll(/[\s_\-:()\[\]]/g, "").toLowerCase(),
                                package.TechnicalName.replaceAll(/[\s_\-:()\[\]]/g, "").toLowerCase()
                            ])].join("_"),
                            shortText: package.ShortText,
                            registryId: package.reg_id
                        },
                        children: (package.Artifacts.results.length > 0 ? Object.entries(
                            Array.prototype.reduce.call(package.Artifacts.results, (data, artifact) => {
                                if (!data[artifact.Type]) {
                                    data[artifact.Type] = []
                                }
                                data[artifact.Type].push(artifact);
                                return data
                            }, {})
                        ) : [])
                            .filter(property => {
                                return Array.isArray(property[1])
                            })
                            .sort((a, b) => {
                                return (getTypeConversion("type", "priority", a[0]) < getTypeConversion("type", "priority", b[0])) ? -1 : (getTypeConversion("type", "priority", a[0]) < getTypeConversion("type", "priority", b[0])) ? 1 : 0
                            })
                            .map(typeList => {
                                return {
                                    title: getTypeConversion("type", "displayNameP", typeList[0]),
                                    meta: {
                                        twineContext: "TREE_IBRANCH",
                                        twineContextType: typeList[0],
                                        packageId: package.TechnicalName
                                    },
                                    children: typeList[1].map(artifact => {
                                        return {
                                            title: artifact.DisplayName,
                                            meta: {
                                                twineContext: "TREE_LEAF",
                                                twineContextType: typeList[0],
                                                packageId: package.TechnicalName,
                                                packageName: package.DisplayName,
                                                packageRegistryId: package.reg_id,
                                                artifactId: artifact.Name,
                                                artifactName: artifact.DisplayName,
                                                createdAt: artifact.CreatedAt,
                                                createdBy: artifact.CreatedBy,
                                                modifiedAt: artifact.ModifiedAt,
                                                modifiedBy: artifact.ModifiedBy,
                                                version: artifact.Version,
                                                search: [...new Set([
                                                    package.DisplayName.replaceAll(/[\s_\-:()\[\]]/g, "").toLowerCase(),
                                                    package.TechnicalName.replaceAll(/[\s_\-:()\[\]]/g, "").toLowerCase(),
                                                    artifact.Name.replaceAll(/[\s_\-:()\[\]]/g, "").toLowerCase(),
                                                    artifact.DisplayName.replaceAll(/[\s_\-:()\[\]]/g, "").toLowerCase()
                                                ])].join("_"),
                                                shortText: artifact.Description,
                                                registryId: artifact.reg_id
                                            },
                                            children: null
                                        }
                                    }).sort((a, b) => {
                                        return (a.title < b.title) ? -1 : (a.title > b.title) ? 1 : 0
                                    })
                                }
                            })
                    }
                })
            chrome.runtime.sendMessage({
                type: "SAP_IS_UNIFY_RESOLVE",
                requestType: "designtimeArtifacts",
                tenantId: getTenantUid(),
                data: contentPackages
            })

            integrationContent.designtimeArtifacts.content = contentPackages
            info("Request finished (Designtime Artifacts)")
            elapsedTime += window.performance.now() - runStart
        }).catch(reject => {
            let runStart = window.performance.now()
            artifactRequestStarted = false
            switch (reject.status) {
                case 500:
                    createToast("Could not update designtime artifacts. Your session may have expired", {className: "twineReject"})
                    break
                case 403:
                    createToast("Your user does not seem to have permission to access integration content", {className: "twineReject"})
                    break
                case 401:
                    warn(`User session may have expired`)
                    break;
                case -1:
                    createToast("Designtime artifact request timed out", {className: "twineReject"})
                    break
                default:
                    createToast("An exception occured while trying to build the artifact list", {className: "twineReject"})
                    error("Could not build artifact list")
                    console.error(reject)
                    break
            }
            elapsedTime += window.performance.now() - runStart
        })
    } else if (response.status == "subscribed") {
        info("Passive response (Designtime Artifacts)")
        integrationContent.designtimeArtifacts.content = response.data
    } else if (response.status == "cache") {
        info("Cached response (Designtime Artifacts)")
        integrationContent.designtimeArtifacts.content = response.data
    }

    elapsedTime += window.performance.now() - runStart
}

function updateArtifacts() {
    let runStart = window.performance.now()

    integrationContent.designtimeArtifacts.tree.setBusy(true, "Processing Artifacts")
    integrationContent.designtimeArtifacts.tree.addTrunks([{
        title: "Integrations",
        meta: {
            twineContext: "TREE_ROOT",
            twineContextType: "designtimeArtifacts",
            twineContextRoot: "/shell/design"
        },
        children: integrationContent.designtimeArtifacts.content,
        id: "designtimeArtifacts",
        age: integrationContent.designtimeArtifacts.lastTimestamp
    }])

    elapsedTime += window.performance.now() - runStart
}

async function fetchRuntimeArtifacts() {
    let response = await chrome.runtime.sendMessage({
        type: "SAP_IS_UNIFY_REQUEST",
        requestType: "runtimeArtifacts",
        tenantId: getTenantUid(),
        maxAge: integrationContent.runtimeArtifacts.maxAge
    })

    let runStart = window.performance.now()
    if (response.status == "request" || response.status == "reassign") {
        /*if (integrationContent.runtimeArtifacts.content.length > 0 && !UserActivation.isActive && response.status != "reassign") {
            info("User inactive. Skipping request (Runtime Artifacts)")
            return
        }*/
        return callXHR("GET", runtimeArtifactsUrl(), null, null, false, {headers: {"Cache-Control": "no-cache, no-store, max-age=0"}}).then(result => {
            let runStart = window.performance.now()
            let runtimeArtifactsXml = Array.from(getDocument(result).querySelectorAll("artifactInformations"))
            let runtimeArtifacts = runtimeArtifactsXml.map(it => {
                let id = it.querySelector("symbolicName").innerHTML
                return {
                    title: it.querySelector("name").innerHTML,
                    meta: {
                        twineContext: "TREE_LEAF",
                        twineContextType: getTypeConversion("operationsType", "type", it.querySelector('tags[name="SAP-BundleType"]').innerHTML),
                        deployState: it.querySelector("deployState").innerHTML,
                        deployedBy: it.querySelector(`tags[name="deployed.by"]`)?.getAttribute("value"),
                        deployedOn: it.querySelector(`tags[name="deployed.on"]`)?.getAttribute("value"),
                        artifactId: id,
                        runtimeId: it.querySelector("id").innerHTML,
                        runtimeSearch: id.replaceAll(/[\s_\-()\[\]]|(?<!^):/g, "").toLowerCase(),
                        tenantId: it.querySelector("tenantId").innerHTML,
                        version: it.querySelector("version").innerHTML,
                        symbolicName: it.querySelector("symbolicName").innerHTML.toUpperCase(),
                        runtimeLocationId: it.querySelector("runtimeLocationId").innerHTML
                    },
                    children: null
                }
            })

            chrome.runtime.sendMessage({
                type: "SAP_IS_UNIFY_RESOLVE",
                requestType: "runtimeArtifacts",
                tenantId: getTenantUid(),
                data: runtimeArtifacts
            })

            integrationContent.runtimeArtifacts.content = runtimeArtifacts
            info("Request finished (Runtime Artifacts)")
            elapsedTime += window.performance.now() - runStart
        }).catch(reject => {
            if (reject.status == 500) {
                console.error(reject)
                createToast("Could not update runtime artifacts.<br>Seems like your session expired", {className: "twineWarning"})
            }
        })
    } else if (response.status == "subscribed") {
        info("Passive response (Runtime Artifacts)")
        integrationContent.runtimeArtifacts.content = response.data
    } else if (response.status == "cache") {
        info("Cached response (Runtime Artifacts)")
        integrationContent.runtimeArtifacts.content = response.data
    }

    elapsedTime += window.performance.now() - runStart
}

function updateRuntimeArtifacts() {
    let runStart = window.performance.now()

    let designtimeItems = integrationContent.designtimeArtifacts.tree.flatList("designtimeArtifacts")

    integrationContent.runtimeArtifacts.content.forEach(it => {
        let artifact = designtimeItems.find(dt => dt.meta.artifactId == it.meta.artifactId)
        if (artifact) {
            artifact.runtimeMeta = it.meta
        }
    })

    elapsedTime += window.performance.now() - runStart
}

let onboarded = true
async function fetchProxies(parameters) {
    let response = await chrome.runtime.sendMessage({
        type: "SAP_IS_UNIFY_REQUEST",
        requestType: "apiProxies",
        tenantId: getTenantUid(),
        maxAge: integrationContent.apiProxies.maxAge
    })

    let runStart = window.performance.now()
    if (response.status == "request" || response.status == "reassign" || parameters?.forceRefresh === true) {
        if (!onboarded) {
            return
        }
        /*if (integrationContent.apiProxies.content.length > 0 && !UserActivation.isActive && response.status != "reassign") {
            info("User inactive. Skipping request (API Proxies)")
            return
        }*/
        return callXHR("GET", apiProxiesUrl(), null, null, false, {headers: {"Cache-Control": "no-cache, max-age=0"}}).then(apiResolve => {
            let runStart = window.performance.now()

            let proxyTrunk = JSON.parse(apiResolve).d.results.sort((a, b) => {
                return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0
            })
                .map(proxy => {
                    return {
                        title: proxy.title,
                        meta: {
                            twineContext: "TREE_LEAF",
                            twineContextType: proxy.__metadata.type,
                            packageId: proxy.name,
                            packageName: proxy.title,
                            artifactId: proxy.name,
                            artifactName: proxy.title,
                            search: [...new Set([
                                proxy.title.replaceAll(/[\s_\-:()\[\]]/g, "").toLowerCase(),
                                proxy.name.replaceAll(/[\s_\-:()\[\]]/g, "").toLowerCase()
                            ])].join("_"),
                            shortText: proxy.description,
                            version: proxy.version,
                            revision: proxy.revisionName,
                            endpoints: proxy.proxyEndPoints?.results.map(it => it.base_path),
                            virtualHost: proxy.proxyEndPoints?.results[0].virtualhosts?.results.map(it => it.virtual_host)[0],
                            virtualPort: proxy.proxyEndPoints?.results[0].virtualhosts?.results.map(it => it.virtual_port)[0],
                            changedAt: proxy.life_cycle.changedAt,
                            changedBy: proxy.life_cycle.changedBy,
                        },
                        children: null
                    }
                })
            chrome.runtime.sendMessage({
                type: "SAP_IS_UNIFY_RESOLVE",
                requestType: "apiProxies",
                tenantId: getTenantUid(),
                data: proxyTrunk
            })

            integrationContent.apiProxies.content = proxyTrunk
            info("Request finished (API Proxies)")
            elapsedTime += window.performance.now() - runStart
        }).catch(async reject => {
            switch (reject.status) {
                case 500:
                    await callXHR("GET", onboardingStatusUrl(), null, null, false).then(resolve => {
                        if (JSON.parse(resolve)[0]?.onBoardingStatus == "ONBOARDED") {
                            createToast("Could not update API Proxies. Your session may have expired", {className: "twineReject"})
                        } else {
                            info("API management has not finished onboarding")
                        }
                    }).catch(reject => {
                        switch (reject.status) {
                            case 500:
                                info("API Management is not onboarded")
                                onboarded = false
                                chrome.runtime.sendMessage({
                                    type: "SAP_IS_UNIFY_RESOLVE",
                                    requestType: "apiProxies",
                                    tenantId: getTenantUid(),
                                    data: []
                                })
                                break
                        }
                    })
                    warn(`API Proxies could not be loaded`)
                    break;
                case 403:
                    warn(`User does not have API permissions`)
                    break
                case 401:
                    warn(`User session may have expired`)
                    break
                case -1:
                    createToast("API Proxy request timed out", {className: "twineReject"})
                    break
                default:
                    createToast("Could not update API Proxies", {className: "twineReject"})
                    error("Could not update API Proxies")
                    console.error(reject)
                    break
            }
            elapsedTime += window.performance.now() - runStart
        })
    } else if (response.status == "subscribed") {
        info("Passive response (API Proxies)")
        integrationContent.apiProxies.content = response.data
        if (integrationContent.apiProxies.content.length != 0) {
            onboarded = true
        }
    } else if (response.status == "cache") {
        info("Cached response (API Proxies)")
        integrationContent.apiProxies.content = response.data
        if (integrationContent.apiProxies.content.length != 0) {
            onboarded = true
        }
    }

    elapsedTime += window.performance.now() - runStart
}

function hasNamingConventions(artifactType) {
    let convention = tenantVariables.currentTenant?.naming?.[artifactType]
    if (!convention || !convention?.Prefix) {
        convention = tenantVariables.currentTenant?.naming?.Common
        if (!convention || !convention?.Prefix) return false
    }

    return {pattern: convention.Prefix, replacement: convention.Replacement ?? ""}
}

function removePrefix(artifactName, artifactType) {
    if (configuration?.sap?.integrationSuite?.cloudIntegration?.integrationContentQuickAccess?.settings?.removePrefix === true) {
        let namingConventions = hasNamingConventions(artifactType)
        if (!namingConventions) return artifactName
        return artifactName.replace(new RegExp(namingConventions.pattern, "i"), namingConventions.replacement ?? "")
    }

    return artifactName
}

function getLockedItem(action, id, icon, reason, radialIndex) {
    return {
        radialIndex: radialIndex ?? -1,
        actionId: id,
        actions: [{
            mouse: getMouseAction(action, 0),
            id: id,
            icon: icon,
            title: reason,
            type: "DISABLED",
            callback: () => {
            }
        }]
    }
}

function updateArtifactListColors() {
    let artifactList = integrationContent.designtimeArtifacts.tree.flatList("designtimeArtifacts")
    artifactList.forEach(it => {
        it.domInstance.style.color = getTypeConversion("type", "displayColor", it.meta.twineContextType)
    })
    integrationContent.designtimeArtifacts.tree.children[0].childArtifacts
        .forEach(it => {
            it.childArtifacts.forEach(child => {
                child.domInstance.style.color = getTypeConversion("type", "displayColor", child.meta.twineContextType)
            })
        })
}

let refreshGradient = [
    [0, [0, 192, 0]],
    [50, [192, 160, 0]],
    [90, [192, 0, 0]],
    [100, [0, 0, 0]]
]
setTimeout(function tick() {
    let runStart = window.performance.now()
    let now = new Date().getTime();
    Object.values(integrationContent)
        .filter(it => it.handle != null)
        .forEach(it => {
            let delta = now - it.lastTimestamp;
            it.handle.style.color = getGradientColor(refreshGradient, Math.trunc(Math.min(delta / (it.maxAge * 1000) * 100, 100)))
        })
    setTimeout(tick, 2000)
    elapsedTime += window.performance.now() - runStart
}, 2000);