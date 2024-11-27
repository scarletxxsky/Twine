let fixedNavigationList
let quicklinks = []

function initializeQuicklinks() {
    let runStart = window.performance.now()
    fixedNavigationList = document.getElementsByClassName("sapTntSideNavigationFixed")[0].querySelector("ul")
    quicklinks.push(createFixedListItem({
        id: "twineSettings",
        title: "Twine Settings",
        descriptiveIcon: "",
        suppressContextMenu: true,
        callback: {
            on: "mousedown",
            function: function(event) {
                preventDefaultAction(event)
                if (event.button == getMouseAction("twineSettings", 0)) {
                } else if (event.button == getMouseAction("twineSettings", 1)) {
                } else {
                }
                let dialog = new SettingsDialog()

                dialog.show()
                return false
            }
        }
    }))
    if (checkCloudIntegrationFeature("quickAccess")) {
        quicklinks.push(
            checkQuicklink("checkNamingConventions") ? createFixedListItem({id: "CheckNamingConventions", title: "Check Naming Conventions", descriptiveIcon: "", disabled: true, suppressContextMenu: true}) : null,
            checkQuicklink("monitoring") ? createFixedListItem({id: "Monitoring", title: "Monitoring", descriptiveIcon: "", url: "/shell/monitoring/Messages", suppressContextMenu: true}) : null,
            checkQuicklink("credentials") ? createFixedListItem({id: "MessageUSage", title: "Message Usage", descriptiveIcon: "", url: "/shell/monitoring/MessageUsage", suppressContextMenu: true}) : null,
            checkQuicklink("runtimeArtifacts") ? createFixedListItem({id: "RuntimeArtifacts", title: "Runtime Artifacts", descriptiveIcon: "", url: "/shell/monitoring/Artifacts", suppressContextMenu: true}) : null,
            checkQuicklink("credentials") ? createFixedListItem({id: "Credentials", title: "Credentials", descriptiveIcon: "", url: "/shell/monitoring/SecurityMaterials", suppressContextMenu: true}) : null,
            checkQuicklink("certificates") ? createFixedListItem({id: "Certificates", title: "Certificates", descriptiveIcon: "", url: "/shell/monitoring/Keystore", suppressContextMenu: true}) : null,
            checkQuicklink("queues") ? createFixedListItem({id: "Queues", title: "Queues", descriptiveIcon: "", url: "/shell/monitoring/MessageQueues", suppressContextMenu: true}) : null,
            checkQuicklink("datastores") ? createFixedListItem({id: "Datastores", title: "Datastores", descriptiveIcon: "\"", url: "/shell/monitoring/DataStores", suppressContextMenu: true}) : null,
            checkQuicklink("connectivityTest") ? createFixedListItem({id: "ConnectivityTest", title: "Connectivity Test", descriptiveIcon: "", url: "/shell/monitoring/Connectivity", suppressContextMenu: true}) : null,
            checkQuicklink("locks") ? createFixedListItem({
                id: "Locks",
                title: lockRequestStarted ? `Locks (<div class="sapMBusyIndicator" style="display: inline-block"><span tabindex="0" class="sapUiBlockLayerTabbable"></span><div class="sapMBusyIndicatorBusyArea sapUiLocalBusy" style="position: relative;"><div class="sapUiBlockLayer  sapUiLocalBusyIndicator sapUiLocalBusyIndicatorSizeMedium sapUiLocalBusyIndicatorFade" alt="" tabindex="0" title="Please wait"><div class="sapUiLocalBusyIndicatorAnimation sapUiLocalBusyIndicatorAnimStandard"><div></div><div></div><div></div></div></div></div><span tabindex="0" class="sapUiBlockLayerTabbable"></span></div>)` : `Locks ${locks.length > 0 ? `(${locks.length})` : "" }`,
                descriptiveIcon: "",
                suppressContextMenu: true,
                callback: {
                    on: "mousedown",
                    function: function(event) {
                        event.preventDefault()
                        event.stopPropagation()
                        if (event.button == getMouseAction("unlock", 1)) {
                            chrome.runtime.sendMessage({
                                type: "OPEN_IN_TAB",
                                url: window.location.protocol + "//" + window.location.host + "/shell/monitoring/DesigntimeLocks"
                            })
                        } else if (event.button == getMouseAction("unlock", 0)) {
                            window.location.assign("/shell/monitoring/DesigntimeLocks")
                        } else {
                            if (lockRequestStarted === true) {
                                createToast({message: "Request for locks already running"})
                                return false
                            }
                            fetchLocks({forceRefresh: true})
                                .then(() => {
                                    updateIntegrationContentLocks()
                                    startHandleLocks()
                                }).catch(reject => {
                                if (reject === true) {
                                    setLocksBusy(false)
                                    createToast({message: `<b>Unlock</b> feature is disabled`})
                                } else {
                                    /*TODO: Should only happen when service worker has an uncaught problem or server returns unhandled code*/
                                }
                            })
                        }
                        return false
                    }
                }
            }) : null
        )

        if (checkQuicklink("stageSwitch")) {
            tenantVariables.globalEnvironment.tenants.filter(it => it.id !== tenantVariables.currentTenant.id).forEach(element => {
                if (tenantVariables.currentTenant.datacenter && !element.datacenter) {
                    createToast({message: `The configuration for <span style="color: ${element.color}">${element.id}</span> is missing the <b>datacenter</b> attribute based on this tenant's configuration`})
                } else if (!tenantVariables.currentTenant.datacenter && element.datacenter) {
                    createToast({message: `The configuration for this tenant is missing the <b>datacenter</b> attribute based on the configuration for tenant <span style="color: ${element.color}">${element.id}</span>`})
                } else {
                    let stage = createFixedListItem({
                        id: element.id,
                        title: `View on ${element.name}`,
                        color: element.color,
                        descriptiveIcon: "",
                        suppressContextMenu: true,
                        callback: {
                            on: "mousedown",
                            function: function(event) {
                                event.preventDefault()
                                event.stopPropagation()
                                let url = window.location.href.replace(new RegExp(String.raw`${tenantVariables.currentTenant.id}`, "g"), element.id)
                                if (tenantVariables.currentTenant.datacenter) {
                                    url = url.replace(/(?<=cfapps\.).*?(?=\.hana)/, element.datacenter).replace(/(?<=\.integrationsuite).*?(?=\.cfapps)/, element.system)
                                }
                                if (getMouseAction("stageSwitch", event.button) == 1) {
                                    chrome.runtime.sendMessage({
                                        type: "OPEN_IN_TAB",
                                        url: url
                                    })
                                } else if (getMouseAction("stageSwitch", event.button) == 0) {
                                    window.location.assign(url)
                                } else {
                                    clipBoardCopy(url)
                                }
                                return false
                            }
                        }
                    })
                    quicklinks.push(stage)
                }
            })
        }

        quicklinks = quicklinks.filter(it => { return it != null })
    }

    addQuicklinks()
    elapsedTime += window.performance.now() - runStart
}

function addQuicklinks() {
    let runStart = window.performance.now()
    fixedNavigationList.classList.remove("legalLinks", "sapTntNLNoIcons")
    fixedNavigationList.removeAttribute("data-sa-ui-render")
    fixedNavigationList.removeAttribute("data-sa-ui")
    fixedNavigationList.textContent = ""
    quicklinks.forEach((it, index) => {
        /*if (true && 0 === index) {
            it.querySelector("div > a").classList.add("rainbow")
        }*/
        fixedNavigationList.insertBefore(it, fixedNavigationList.firstChild)
    })
    elapsedTime += window.performance.now() - runStart
}