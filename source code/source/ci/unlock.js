let lockPermissions = null

async function fetchLocks(parameters) {
    setLocksBusy(true)
    return new Promise((resolve, reject) => {
        if (checkErrorTolerance(4) && checkCloudIntegrationFeature("unlock")) {
            function process(fetchedLocks, fromCache, forceRefresh) {
                let runStart = window.performance.now()
                info("Request finished (Locks)")
                lockRequestStarted = false
                if (forceRefresh === true) {
                    locks.forEach(it => it.removeReferences())
                    log("Refreshed locks from server")
                }
                locks = fetchedLocks.map(it => new Lock(it))

                if (!fromCache === true) chrome.runtime.sendMessage({
                    type: "LOCKS_FETCHED",
                    locks: locks,
                    id: getTenantId()
                })
                updateLockCount()
                elapsedTime += window.performance.now() - runStart
                resolve()
            }

            function handleXHRReject(error) {
                console.log(error)
                lockRequestStarted = false
                switch (error.status) {
                    case 500:
                        createToast("Error while updating locks.<br>Your session may have expired", {className: "twineReject"})
                        break
                    case 403:
                        createToast("Error while updating locks.<br>You don't have the permission to view locks", {className: "twineWarning"})
                        break
                    case -1:
                        createToast("Request for locks timed out<br>Please try to refresh locks manually", {className: "twineReject"})
                        break
                    default:
                        createToast("An unhandled error occurred during lock request<br>Please try to refresh locks manually", {className: "twineReject"})
                        break
                }
                setLocksBusy(false, error.reason)
                reject(false)
            }

            function handleSWReject(response) {
                switch (response.reason) {
                    case "NO_LOCKS_STORED":
                        info("No locks cached")
                        break
                    case "LOCKS_OUTDATED":
                        info("Locks outdated")
                        break
                    default:
                        error("Invalid service worker response")
                        console.error(response)
                        lockRequestStarted = false
                        setLocksBusy(false, error.reason)
                        reject(false)
                        return
                }
                requestServerLocks(parameters?.forceRefresh === true)
            }

            function requestServerLocks(forceRefresh) {
                callXHR("GET", `https://${window.location.host}/odata/api/v1/IntegrationDesigntimeLocks?$format=json`, null, "*/*", false, {timeout: 25000})
                    .then(response => {
                        process(JSON.parse(response).d.results, false, forceRefresh)
                    }).catch(error => {
                    handleXHRReject(error)
                })
            }

            if (parameters?.forceRefresh === true) {
                lockRequestStarted = true
                log("Refreshing locks...")
                requestServerLocks(parameters?.forceRefresh === true)
            } else if (locks.length == 0 && !lockRequestStarted && checkErrorTolerance(4)) {
                lockRequestStarted = true
                chrome.runtime.sendMessage({type: "SAP_IS_LOCK_REQUEST", id: getTenantId()})
                    .then(message => {
                        if (message.locks != null) {
                            info("Cached response (Locks)")
                            process(message.locks, true, false)
                        } else {
                            handleSWReject(message)
                        }
                    })
            } else {
                error("Something went really wrong.")
                reject(false)
            }
        } else reject(true)
    })
}

async function createLockReminder() {
    let now = Date.now()
    if (checkReminder("lockedArtifacts") && (now - 86400000) > (await getDetail("reminderLockedArtifacts", storageLevel.PERSIST, storageAssociation.TENANT) ?? 0) && tenantVariables.currentTenant.isTrial === false) {
        let ownedLocks = locks.filter(it => {
            return it.CreatedBy == loggedInUser?.Name
        }).sort((a, b) => {
            let packageCompare = a.PackageName.localeCompare(b.PackageName)
            let artifactCompare = a.ArtifactType === "INTEGRATION_PACKAGE" ? -1 : b.ArtifactType === "INTEGRATION_PACKAGE" ? 1 : a.ArtifactName.localeCompare(b.ArtifactName)

            if (packageCompare != 0) return packageCompare
            else return artifactCompare
        })
        if (ownedLocks.length > 0) {
            createToast(`Welcome back!<br>Maybe you'd like to remove some of your artifact locks while you are here?<p></p><b>${ownedLocks.sort((a, b) => a.PackageName.localeCompare(b.PackageName)).map(it => {
                    return (it.PackageId == it.ArtifactId ? `Package <span><a style="color: ${getTypeConversion("type", "displayColor", "designtimeArtifacts")}" href="/shell/design/contentpackage/${it.PackageId}">${it.PackageName}</a></span>` : `<span><a style="color: ${getTypeConversion("type", "displayColor", "designtimeArtifacts")}" href="/shell/design/contentpackage/${it.PackageId}">${it.PackageName}</a></span> - <span><a style="color: ${getTypeConversion("lockType", "displayColor", it.ArtifactType)}" href="/shell/design/contentpackage/${it.PackageId}/${getTypeConversion("lockType", "urlType", it.ArtifactType)}/${it.ArtifactId}">${it.ArtifactName}</a></span>`)
                }).join("<p/>")}</b></br>`)
            storeDetail("reminderLockedArtifacts", now, storageLevel.PERSIST, storageAssociation.TENANT)
        }
    }
}

async function updateIntegrationContentLocks() {
    return new Promise((resolve, reject) => {
        if (checkErrorTolerance(4) && checkCloudIntegrationFeature("integrationContentQuickAccess")) {
            function updateList() {
                debug("Designtime artifact shortcuts built. Updating locks on them")
                let packageTrunk = integrationContent.designtimeArtifacts.tree.children[0]
                locks.sort((a,b) => a.PackageName.localeCompare(b.PackageName)).forEach(lock => {
                    let domReference
                    if (lock.PackageId === lock.ArtifactId) {
                        domReference = packageTrunk.childArtifacts.find(it => it.meta.packageId === lock.PackageId)
                    } else {
                        domReference  = packageTrunk.childArtifacts.find(it => it.meta.packageId === lock.PackageId)
                            .flatList()
                            .find(it => {
                                if (lock.artifactId == "PR043_API001_REST_Call") {
                                }
                                return it.meta.artifactId == lock.ArtifactId &&
                                    getTypeConversion("type", "lockType", it.meta.twineContextType) === lock.ArtifactType
                            })
                    }
                    try {
                        domReference.setLock(lock)
                    } catch (e) {
                        //TODO: For some reason certain artifacts can't be found (Happened with REST API). Due to no error handling the rest of the locks can than not be assigned/searched for
                        //throw new Error()
                    }
                })
            }
            if (!integrationContentQuickAccessReady) {
                debug("Waiting for designtime artifact shortcuts")
                setTimeout(function tick() {
                    let runStart = window.performance.now()
                    if (integrationContentQuickAccessReady) {
                        updateList()
                        elapsedTime += window.performance.now() - runStart
                    } else {
                        setTimeout(tick, 1000)
                    }
                }, 1500)
            } else {
                let runStart = window.performance.now()
                updateList()
                elapsedTime += window.performance.now() - runStart
            }
            resolve(true)
        } else {
            resolve(false)
        }
    })
}

function updateLockCount() {
    let quickLinkLocks = document.getElementById("__twine_FooterListElement_Locks")
    if (quickLinkLocks != null) quickLinkLocks.querySelector("div > a > span:nth-of-type(2)").innerHTML = `Locks (${locks.length})`
}

function setLocksBusy(busy, message) {
    let quickLinkLocks = document.getElementById("__twine_FooterListElement_Locks")
    if (quickLinkLocks != null) {
        if (busy) {
            quickLinkLocks.querySelector("div > a > span:nth-of-type(2)").innerHTML = `Locks (<div class="sapMBusyIndicator" style="display: inline-block"><span tabindex="0" class="sapUiBlockLayerTabbable"></span><div class="sapMBusyIndicatorBusyArea sapUiLocalBusy" style="position: relative;"><div class="sapUiBlockLayer  sapUiLocalBusyIndicator sapUiLocalBusyIndicatorSizeMedium sapUiLocalBusyIndicatorFade" alt="" tabindex="0" title="Please wait"><div class="sapUiLocalBusyIndicatorAnimation sapUiLocalBusyIndicatorAnimStandard"><div></div><div></div><div></div></div></div></div><span tabindex="0" class="sapUiBlockLayerTabbable"></span></div>)`
        } else {
            if (message) quickLinkLocks.querySelector("div > a > span:nth-of-type(2)").innerHTML = `Locks (${message})`
            else quickLinkLocks.querySelector("div > a > span:nth-of-type(2)").innerHTML = `Locks`
        }
    }
}

async function onLockRemoved(lock) {
    //todo: All roads lead to rome, some of them lead through america
    locks = locks.filter(it => { return it.ResourceId != lock.ResourceId })
    updateLockCount()
    chrome.runtime.sendMessage({
        type: "LOCKS_FETCHED",
        locks: locks.map(it => it.getDereferenced()),
        id: getTenantId()
    })
}

class Lock {
    PackageId
    PackageName

    ArtifactId
    ArtifactName
    ArtifactType

    CreatedBy
    CreatedAt

    ResourceId

    references = []

    constructor(apiLock) {
        this.PackageId = apiLock.PackageId
        this.PackageName = apiLock.PackageName
        this.ArtifactId = apiLock.ArtifactId
        this.ArtifactName = apiLock.ArtifactName
        this.ArtifactType = apiLock.ArtifactType
        this.CreatedBy = apiLock.CreatedBy
        this.CreatedAt = apiLock.CreatedAt
        this.ResourceId = apiLock.ResourceId
        this.Owned = apiLock.CreatedBy == loggedInUser?.Name
    }

    tryRemove() {
        let dialog = new Dialog("Confirm Unlock")
            .withContent(new SimpleElement(`<div style="padding: 0.75rem">Do you want to unlock ${getTypeConversion("lockType", "displayNameS", this.ArtifactType).toLowerCase()} <span style="color: ${getTypeConversion("lockType", "displayColor", this.ArtifactType)}"><b>${this.ArtifactName}</b></span>?</div>`))
            .withOptions([
                new Button("Unlock", "NEGATIVE", null, false, false, true, () => {
                    callXHR("DELETE", `https://${window.location.host}/odata/api/v1/IntegrationDesigntimeLocks(ResourceId='${this.ResourceId}')`, null, null, true)
                        .then(resolve => {
                            this.removeReferences()
                            onLockRemoved(this)
                        })
                        .catch(reject => {
                            switch (reject.status) {
                                case 403:
                                    createToast(`You don't seem to be authorized to remove locks</p><p><b>Default RoleCollection:</b> PI_Administrator<br><b>Role:</b> AuthGroup_Administrator</p>`, {className: "twineWarning"})
                                    lockPermissions = false
                                    break
                                case 500:
                                    createToast(`Error while removing lock.<br>Your session may have expired`, {className: "twineReject"})
                                    break
                                case 404:
                                    createToast(`This lock does not exist anymore`, {className: "twineWarn"})
                                    this.removeReferences()
                                    onLockRemoved(this)
                                    break
                                default:
                                    createToast(`An unexpected error occured while trying to remove the lock<p>${reject}`, {className: "twineReject"})
                                    break
                            }
                            console.log(reject)
                        })
                        .finally(() => {
                            dialog.domInstance.remove()
                            popoverLayerBlocker.style.visibility = "hidden"
                            popoverLayerBlocker.style.display = "none"
                        })
                })
            ])
        dialog.show()
    }

    removeReferences() {
        this.references.forEach(it =>
            it.onLockRemoved()
        )
    }

    getDereferenced() {
        //Just drop unnecessary keys
        return {
            PackageId: this.PackageId,
            PackageName: this.PackageName,
            ArtifactId: this.ArtifactId,
            ArtifactName: this.ArtifactName,
            ArtifactType: this.ArtifactType,
            CreatedBy: this.CreatedBy,
            CreatedAt: this.CreatedAt,
            ResourceId: this.ResourceId
        }
    }
}