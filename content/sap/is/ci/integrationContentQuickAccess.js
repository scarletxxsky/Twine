let twineNavigationList
let radialMenu
let artifactRequestStarted
let artifactTree
let integrationContentQuickAccessReady = false

function workspaceContentPackagesUrl() {
    return workspaceUrl() + `/ContentEntities.ContentPackages?$expand=Artifacts&$format=json`
}

function apiProxiesUrl() {
    return apiPortalUrl() + `/APIProxies?$format=json&$select=FK_PROVIDERNAME,description,isPublished,life_cycle,name,releaseStatus,state,title,version`
}

function initializeIntegrationContentQuicklinks() {
    fetchArtifacts()
        .then(designtimeResolve => {
            twineNavigationList = document.createElement("ul")
            twineNavigationList.height = "max-content"
            twineNavigationList.style.flexGrow = "1"
            twineNavigationList.id = "__twine-shell--navigationList"
            twineNavigationList.classList.add("sapTntNL", "disableScrollbars", "elementFadeIn", "widthShift")

            if (!sidebarMainContent.classList.contains("sapTntNLCollapsed")) {
                sidebar.appendChild(twineNavigationList)
            }

            let navigationExtensionBase = document.createElement("li")

            twineNavigationList.appendChild(navigationExtensionBase)
            artifactTree = new Tree([{
                title: "Packages",
                meta: {twineContext: "TREE_ROOT", twineContextType: "Package", twineContextRoot: "/shell/design"},
                children: designtimeResolve.contentPackages
            }])
            navigationExtensionBase.appendChild(artifactTree.domInstance)
            integrationContentQuickAccessReady = true

            callXHR("GET", apiProxiesUrl(), null, null, true, {headers: {"Cache-Control": "no-cache, max-age=0"}}).then(apiResolve => {
                let proxyTrunk = JSON.parse(apiResolve).d.results.sort((a,b) => { return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0 })
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
                                shortText: proxy.description
                            },
                            children: null
                        }
                    })
                artifactTree.addTrunks([{
                    title: "API Proxies",
                    meta: {twineContext: "TREE_ROOT", twineContextType: "APIProxy", twineContextRoot: "/shell/configure"},
                    children: proxyTrunk
                }])
            }).catch(apiReject => {
                switch (apiReject.status) {
                    case 500:
                        warn(`APIs could not be loaded`)
                        break;
                    case 403:
                        warn(`User does not have API permissions`)
                        break;
                    case 401:
                        warn(`User session may have expired`)
                        break;
                    default:
                        error(`${apiReject?.reason}: ${apiReject?.statusText}`)
                        break;
                }
            })
    }).catch(designtimeReject => {
        error(`${designtimeReject.reason}: ${designtimeReject.statusText}`)
    })
}

async function fetchArtifacts(parameters) {
    function process(fetchedArtifacts, fromCache) {
        let runStart = window.performance.now()
        artifactRequestStarted = false
        let contentPackages = fetchedArtifacts
        if (!fromCache === true) {
            contentPackages = contentPackages.sort((a,b) => { return (a.DisplayName < b.DisplayName) ? -1 : (a.DisplayName > b.DisplayName) ? 1 : 0 })
                .map(package => {
                    return {
                        title: package.DisplayName,
                        meta: {
                            twineContext: "TREE_BRANCH",
                            twineContextType: "Package",
                            packageId: package.TechnicalName,
                            packageName: package.DisplayName,
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
                            .filter(property => { return Array.isArray(property[1]) })
                            .sort((a, b) => { return (getTypeConversion("type", "priority", a[0]) < getTypeConversion("type", "priority", b[0])) ? -1 : (getTypeConversion("type", "priority", a[0]) < getTypeConversion("type", "priority", b[0])) ? 1 : 0 })
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
                                                artifactId: artifact.Name,
                                                artifactName: artifact.DisplayName,
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
                                    }).sort((a, b) => { return (a.title < b.title) ? -1 : (a.title > b.title) ? 1 : 0 })
                                }
                            })
                    }
                })
            chrome.runtime.sendMessage({
                type: "DESIGNTIME_ARTIFACTS_FETCHED",
                artifacts: contentPackages,
                id: getTenantId()
            })
        }

        elapsedTime += window.performance.now() - runStart
        return {contentPackages: contentPackages}
    }

    if (parameters?.forceRefresh === true) {
        artifactRequestStarted = true
        log("Refreshing artifacts...")
        return new Promise((fetchResolve, fetchReject) => {
            callXHR("GET", workspaceContentPackagesUrl(), null, null, true, {headers: {"Cache-Control": "no-cache, no-store, max-age=0"}}).then(resolve => {
                fetchResolve(process(JSON.parse(resolve).d.results))
            }).catch(reject => {
                artifactRequestStarted = false
                switch (reject.status) {
                    case 500:
                        createToast({message: `Error while updating artifacts.<br>Your session may have expired`})
                        break
                }
                fetchReject({status: reject.status})
            })
        })
    } else {
        artifactRequestStarted = true
        return new Promise((fetchResolve, fetchReject) => {
            chrome.runtime.sendMessage({type: "SAP_IS_DT_ARTIFACT_REQUEST", id: getTenantId()})
                .then(message => {
                    if (message.artifacts == null) throw message
                    info("Using cached artifacts")
                    fetchResolve(process(message.artifacts, true))
                }).catch(response => {
                switch (response.reason) {
                    case "NO_ARTIFACTS_STORED":
                        info("No artifacts cached. Getting artifacts from server")
                        break
                    case "ARTIFACTS_OUTDATED":
                        info("Artifacts outdated. Getting artifacts from server")
                        break
                    default:
                        error("Invalid service worker response: " + response.reason)
                        createToast(response)
                        fetchReject(response.reason)
                }
                callXHR("GET", workspaceContentPackagesUrl(), null, null, true, {headers: {"Cache-Control": "no-cache, no-store, max-age=0"}}).then(resolve => {
                    fetchResolve(process(JSON.parse(resolve).d.results))
                }).catch(reject => {
                    createToast({message: `Error while getting designtime artifacts: ${reject}`})
                    fetchReject({reason: response})
                })
            })
        })
    }
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

function getMouseAction(action, button) {
    let mouseMapping = configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.[action] ?? configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.default
    if (!mouseMapping) return button

    let configButton = (button === 0 ? "left" : button === 2 ? "right" : "other")
    let buttonMapping = mouseMapping[configButton]
    if (buttonMapping < 0 || buttonMapping > 2) return button

    return buttonMapping
}

function getLockedItem(action, id, icon, reason) {
    return {
        actions: [{
            mouse: getMouseAction(action, 0),
            id: id,
            icon: icon,
            title: reason,
            type: "DISABLED",
            callback: () => {}
        }]
    }
}