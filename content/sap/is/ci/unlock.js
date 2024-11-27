let artifactLockWaiting = false, packageLockWaiting = false
let lockPermissions = null

async function startHandleLocks() {
    if (locks != null) {
        if (/\/shell\/design\/contentpackage\/[^\/]+$/.test(window.location.pathname)) {
            let section = window.location.search.split("=")[1] ?? null
            switch (section) {
                case "TAGS":
                    handlePackageLock()
                    break
                case "OVERVIEW":
                    handlePackageLock()
                    break
                case "HEADER":
                    handlePackageLock()
                    break
                case "DOCUMENTS":
                    handlePackageLock()
                    break
                case "ARTIFACTS":
                    handlePackageLock()
                    handleArtifactLocks()
                    break
                default:
                    handlePackageLock()
                    break
            }
        } else if (/\/shell\/design\/contentpackage\/[^\/]+?\/[^\/]+?\/[^\/]+$/.test(window.location.pathname)) {
            handleArtifactLock()
        }
    }
}

function getUnlockButton() {
    return document.getElementById(`__twine_unlock_${window.location.pathname.split("?")[0].split("/").pop()}`)
}

async function handlePackageLock() {
    // Seems to cause problems due to the index of the save button when editing
    /*let packageId = window.location.pathname.split("?")[0].split("/").pop()
    if (!packageLockWaiting && locks.find(it => {
        return it.ArtifactId == packageId
    }) && getUnlockButton() == null) {
        packageLockWaiting = true
        let runStart = window.performance.now()
        waitForElement("[data-help-id='contentpackage_edit_btn_helpid']").then(element => {
            let runStart = window.performance.now()
            packageLockWaiting = false
            let lock = locks.find(it => {
                return it.ArtifactId == packageId
            })
            if (lock != null) {
                let button = createButton({
                    id: `__twine_unlock_${packageId}`,
                    title: "Unlock",
                    onBar: true,
                    transparent: true
                }, function (event) {
                    event.preventDefault()
                    event.stopPropagation()
                    let dialog = createConfirmDialog({
                        actionTitle: "Confirm",
                        actionText: `Do you want to unlock package <span style="color: ${getTypeConversion("type", "displayColor", "Package")}"><b>${lock.ArtifactName}</b></span>?`,
                        confirm: {
                            id: `__twine_unlock_${packageId}_confirm`,
                            title: "Unlock",
                            type: "NEGATIVE",
                            onBar: true
                        },
                        cancel: {id: `__twine_unlock_${packageId}_cancel`, title: "Cancel", onBar: true}
                    }, function () {
                        tryRemoveLock(lock.ResourceId)
                            .then(resolve => {
                                postProcessPageLock(dialog, button, null, lock)
                            }).catch(reject => {
                            dialog.remove()

                            popoverLayerBlocker.style.visibility = "hidden"
                            popoverLayerBlocker.style.display = "none"
                            switch (reject.status) {
                                case 403:
                                    createToast({message: `<p>You don't seem to be authorized to remove locks</p><p><b>Default RoleCollection:</b> PI_Administrator<br><b>Role:</b> AuthGroup_Administrator</p>`})
                                    break
                                case 404:
                                    createToast({message: `<p>Lock does not exist anymore</p>`})
                                    button.querySelector("span > span").firstElementChild.style.display = "inline-block"
                                    button.querySelector("span > span").lastElementChild.style.display = "none"
                                    button.classList.add("elementFadeOut")
                                    locks = locks.filter((it) => {
                                        return it.ResourceId != lock.ResourceId
                                    })
                                    chrome.runtime.sendMessage({
                                        type: "LOCKS_FETCHED",
                                        locks: locks,
                                        id: getTenantId()
                                    })
                                    updateLockCount()
                                    setTimeout(() => {
                                        this.remove()
                                        document.querySelector("[id$='idObjectPageHeaderTitle-subtitle']")?.remove()
                                    }, 1000)
                                    break
                                case 500:
                                    createToast({message: `Error while removing lock.<br>Your session may have expired`})
                                    break
                                default:
                                    createToast({message: `An unexpected error occured when trying to remove the lock<p>${reject}`})
                                    console.log(reject)
                                    break
                            }
                        })
                    }, function (event) {
                        dialog.remove()

                        popoverLayerBlocker.style.visibility = "hidden"
                        popoverLayerBlocker.style.display = "none"
                    })
                    popoverLayer.insertAdjacentElement("beforeend", dialog)

                    popoverLayerBlocker.style.zIndex = "50"
                    popoverLayerBlocker.style.visibility = "visible"
                    popoverLayerBlocker.style.display = "block"
                })
                element.insertAdjacentElement("beforebegin", button)
            }
            elapsedTime += window.performance.now() - runStart
        })
        elapsedTime += window.performance.now() - runStart
    }*/
}

async function handleArtifactLock() {
    // Seems to cause problems due to the index of the save button when editing
    /*let artifactId = window.location.pathname.split("?")[0].split("/").pop()
    let artifactType = window.location.pathname.split("?")[0].split("/").at(-2)
    if (!packageLockWaiting && locks.find(it => {
        return it.ArtifactId == artifactId
    }) && getUnlockButton() == null) {
        packageLockWaiting = true
        let runStart = window.performance.now()

        function waitFor(element) {
            let runStart = window.performance.now()
            packageLockWaiting = false
            let lock = locks.find(it => {
                return it.ArtifactId == artifactId
            })
            if (lock != null) {
                let button = new UnlockElementHelper(lock, false, true, true, function() {
                    setTimeout(() => {
                        this.domInstance.remove()
                        document.querySelector("[id*='PageHeader'][id$='-subtitle']")?.remove()
                    }, 1000)
                })
                element.insertAdjacentElement("beforebegin", button.domInstance)
            }
            elapsedTime += window.performance.now() - runStart
        }

        let xmlView = Object.values(document.querySelectorAll("[id^='__xmlview'][id$=--iflowObjectPageHeader]")).at(-1)
        waitForElement("[data-help-id='contentpackage_edit_btn_helpid']", xmlView).then(element => {
            if (popoverLayerBlocker) {
                setTimeout(function tick() {
                    if (popoverLayerBlocker.style.visibility === "visible") {
                        setTimeout(tick, 1000)
                    } else {
                        if (artifactType === "integrationflows") {
                            setTimeout(waitFor(element), 2500)
                        } else setTimeout(waitFor(element), 500)
                    }
                }, 1000)
            }
        })
        elapsedTime += window.performance.now() - runStart
    }*/
}

async function handleArtifactLocks() {
    // Seems to cause problems due to the index of the save button when editing
    if (!artifactLockWaiting) {
        artifactLockWaiting = true
        waitForElement("table:has(tbody[id*='--artifactTable-'] > tr > td[aria-colindex='6']):has(div[id*='artifactTable-']) > tbody").then((element) => {
            setTimeout(() => {
                let runStart = window.performance.now()
                artifactLockWaiting = false
                let packageId = window.location.pathname.split("?")[0].split("/").pop()
                element.querySelectorAll("tr").forEach(row => {
                    let actionCell = row.querySelector("td[aria-colindex='5']")
                    let artifactName = row.querySelector(`td:nth-of-type(3) > div > div:nth-of-type(1) > div > div:nth-of-type(1) > div:nth-of-type(1) > span`)?.innerText
                    let lock = locks.find(lock => lock.ArtifactName == artifactName && lock.PackageId == packageId)
                    if (lock != null) {
                        let unlockButton = document.getElementById(`__twine_unlock${row.id}`)
                        if (unlockButton === null) {
                            actionCell.insertAdjacentElement("beforeend", createUnlockButton(lock, row.id))
                        }
                    }
                })
                elapsedTime += window.performance.now() - runStart
            }, 800)
        }).catch((reason) => {
            console.log(reason)
        })
    }
}

function createUnlockButton(lock, id) {
    let button = createButton({
        id: `__twine_unlock${id}`,
        icon: "",
        title: "Unlock",
        iconFirst: true
    }, function (event) {
        event.preventDefault()
        event.stopPropagation()
        let dialog = createConfirmDialog({
            actionTitle: "Confirm",
            actionText: `Do you want to unlock ${getTypeConversion("lockType", "displayNameS", lock.ArtifactType).toLowerCase()} <span style="color: ${getTypeConversion("lockType", "displayColor", lock.ArtifactType)}"><b>${lock.ArtifactName}</b></span>?`,
            confirm: {id: `__twine_unlock_${id}_confirm`, title: "Unlock", type: "NEGATIVE", onBar: true},
            cancel: {id: `__twine_unlock_${id}_cancel`, title: "Cancel", onBar: true}
        }, function (event) {
            tryRemoveLock(lock.ResourceId)
                .then(resolve => {
                    dialog.remove()

                    popoverLayerBlocker.style.visibility = "hidden"
                    popoverLayerBlocker.style.display = "none"
                    button.querySelector("span > span").firstElementChild.style.display = "inline-block"
                    button.querySelector("span > span").lastElementChild.style.display = "none"
                    button.classList.add("elementFadeOut")
                    setTimeout(() => {
                        locks = locks.filter((it) => {
                            return it.ResourceId != lock.ResourceId
                        })
                        chrome.runtime.sendMessage({
                            type: "LOCKS_FETCHED",
                            locks: locks,
                            id: getTenantId()
                        })
                        updateLockCount()
                        this.remove()
                        document.getElementById(id).querySelector("td:nth-of-type(3) > div > div:nth-of-type(3) > div > div:nth-of-type(2)")?.remove()
                    }, 1000)
                }).catch(reject => {
                dialog.remove()

                popoverLayerBlocker.style.visibility = "hidden"
                popoverLayerBlocker.style.display = "none"
                switch (reject.status) {
                    case 403:
                        createToast({message: `<p>You don't seem to be authorized to remove locks</p><p><b>Default RoleCollection:</b> PI_Administrator<br><b>Role:</b> AuthGroup_Administrator</p>`})
                        break
                    case 404:
                        createToast({message: `<p>Lock does not exist anymore</p>`})
                        button.querySelector("span > span").firstElementChild.style.display = "inline-block"
                        button.querySelector("span > span").lastElementChild.style.display = "none"
                        button.classList.add("elementFadeOut")
                        locks = locks.filter((it) => {
                            return it.ResourceId != lock.ResourceId
                        })
                        chrome.runtime.sendMessage({
                            type: "LOCKS_FETCHED",
                            locks: locks,
                            id: getTenantId()
                        })
                        updateLockCount()
                        setTimeout(() => {
                            this.remove()
                            document.getElementById(id).querySelector("td:nth-of-type(3) > div > div:nth-of-type(3) > div > div:nth-of-type(2)")?.remove()
                        }, 1000)
                        break
                    case 500:
                        createToast({message: `Error while removing lock.<br>Your session may have expired.`})
                        break
                    default:
                        createToast({message: `An unexpected error occured when trying to remove the lock<p>${reject}`})
                        break
                }
                console.log(reject)
            })
        }, function (event) {
            dialog.remove()

            popoverLayerBlocker.style.visibility = "hidden"
            popoverLayerBlocker.style.display = "none"
        })
        popoverLayer.insertAdjacentElement("beforeend", dialog)

        popoverLayerBlocker.style.zIndex = "50"
        popoverLayerBlocker.style.visibility = "visible"
        popoverLayerBlocker.style.display = "block"
    })
    return button
}

async function createLockReminder() {
    if (checkReminder("lockedArtifacts")) {
        let ownedLocks = locks.filter(it => {
            return it.CreatedBy == loggedInUser?.Name
        }).sort((a, b) => {
            let packageCompare = a.PackageName.localeCompare(b.PackageName)
            let artifactCompare = a.ArtifactType === "INTEGRATION_PACKAGE" ? -1 : b.ArtifactType === "INTEGRATION_PACKAGE" ? 1 : a.ArtifactName.localeCompare(b.ArtifactName)

            if (packageCompare != 0) return packageCompare
            else return artifactCompare
        })
        if (ownedLocks.length > 0 && !tenantVariables.currentTenant.isTrial) {
            createToast({
                message: `Welcome back!<br>Maybe you'd like to remove some of your artifact locks while you are here?<p></p><b>${ownedLocks.sort((a, b) => a.PackageName.localeCompare(b.PackageName)).map(it => {
                    return (it.PackageId == it.ArtifactId ? `Package <span><a style="color: ${getTypeConversion("type", "displayColor", "Package")}" href="/shell/design/contentpackage/${it.PackageId}">${it.PackageName}</a></span>` : `<span><a style="color: ${getTypeConversion("type", "displayColor", "Package")}" href="/shell/design/contentpackage/${it.PackageId}">${it.PackageName}</a></span> - <span><a style="color: ${getTypeConversion("lockType", "displayColor", it.ArtifactType)}" href="/shell/design/contentpackage/${it.PackageId}/${getTypeConversion("lockType", "urlType", it.ArtifactType)}/${it.ArtifactId}">${it.ArtifactName}</a></span>`)
                }).join("<p/>")}</b></br>`
            })
        }
    }
}

async function fetchLocks(parameters) {
    setLocksBusy(true)
    return new Promise((resolve, reject) => {
        if (checkErrorTolerance(4) && checkCloudIntegrationFeature("unlock")) {
            function process(fetchedLocks, fromCache, forceRefresh) {
                let runStart = window.performance.now()
                info("Locks loaded")
                lockRequestStarted = false
                if (forceRefresh === true) {
                    locks.forEach(it => it.removeReferences())
                    log("Refreshed locks from server")
                }
                locks = fetchedLocks.map(it => new Lock(it))
                if (fromCache === false && forceRefresh === false) {
                    createLockReminder()
                }

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
                        createToast({message: `Error while updating locks.<br>Your session may have expired`})
                        break
                    case 403:
                        createToast({message: `Error while updating locks.<br>You don't have the permission to view locks`})
                        break
                    case -1:
                        createToast({message: `Request for locks timed out<br>Please try to refresh locks manually`})
                        break
                    default:
                        createToast({message: `An unhandled error occurred during lock request<br>Please try to refresh locks manually`})
                        break
                }
                setLocksBusy(false, error.reason)
                reject(false)
            }

            function handleSWReject(response) {
                switch (response.reason) {
                    case "NO_LOCKS_STORED":
                        info("No locks cached. Getting locks from server")
                        break
                    case "LOCKS_OUTDATED":
                        info("Locks outdated. Getting locks from server")
                        break
                    default:
                        error("Invalid service worker response: " + response.reason)
                        lockRequestStarted = false
                        setLocksBusy(false, error.reason)
                        reject(false)
                        return
                }
                requestServerLocks(parameters?.forceRefresh === true)
            }

            function requestServerLocks(forceRefresh) {
                callXHR("GET", `https://${window.location.host}/odata/api/v1/IntegrationDesigntimeLocks?$format=json`, null, "*/*", true, {timeout: 25000})
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
                            info("Using cached locks")
                            process(message.locks, true, false)
                        } else {
                            handleSWReject(message)
                        }
                    })
            } else {
                error("Something went really wrong. ")
                reject(false)
            }
        } else reject(true)
    })
}

function tryRemoveLock(resourceId) {
    return callXHR("DELETE", `https://${window.location.host}/odata/api/v1/IntegrationDesigntimeLocks(ResourceId='${resourceId}')`)
}

function postProcessPageLock(dialog, button, artifactType, lock) {
    return new Promise((resolve, reject) => {
        dialog?.remove()

        popoverLayerBlocker.style.visibility = "hidden"
        popoverLayerBlocker.style.display = "none"
        if (button != null) {
            button.querySelector("span > span").firstElementChild.style.display = "inline-block"
            button.querySelector("span > span").lastElementChild.style.display = "none"
            button.classList.add("elementFadeOut")
        }
        setTimeout(() => {
            locks = locks.filter(it => {
                return it.ResourceId != lock.ResourceId
            })
            chrome.runtime.sendMessage({
                type: "LOCKS_FETCHED",
                locks: locks,
                id: getTenantId()
            })
            updateLockCount()
            if (button != null) button.remove()
            if (artifactType === "integrationflows") {
                let subtitle = document.querySelector("[id*='PageHeader'][id$='-subtitle']")
                subtitle.innerText = subtitle.innerText.replace(/(?<= \| |^)Locked.*?(?: \| |$)/, "")
            } else if (artifactType != null) {
                document.querySelector("[id*='PageHeader'][id$='-subtitle']")?.remove()
            }
            resolve(true)
        }, 1000)
    })
}


async function updateIntegrationContentLocks() {
    return new Promise((resolve, reject) => {
        if (checkErrorTolerance(4) && checkCloudIntegrationFeature("integrationContentQuickAccess")) {
            function updateList() {
                debug("Designtime artifact shortcuts built. Updating locks on them")
                //TODO: Optimize (lock sorting, etc..?)
                let packageTrunk = artifactTree.children.find(trunk => trunk.meta.twineContextType === "Package")
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
                    callXHR("DELETE", `https://${window.location.host}/odata/api/v1/IntegrationDesigntimeLocks(ResourceId='${this.ResourceId}')`)
                        .then(resolve => {
                            this.removeReferences()
                            onLockRemoved(this)
                        })
                        .catch(reject => {
                            switch (reject.status) {
                                case 403:
                                    createToast({message: `<p>You don't seem to be authorized to remove locks</p><p><b>Default RoleCollection:</b> PI_Administrator<br><b>Role:</b> AuthGroup_Administrator</p>`})
                                    lockPermissions = false
                                    break
                                case 500:
                                    createToast({message: `Error while removing lock.<br>Your session may have expired`})
                                    break
                                case 404:
                                    createToast({message: `This lock does not exist anymore`})
                                    this.removeReferences()
                                    onLockRemoved(this)
                                default:
                                    createToast({message: `An unexpected error occured while trying to remove the lock<p>${reject}`})
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

function removeUnlockButton() {
    let parts = window.location.pathname.slice(1).split("/")
    let [packageId, artifactId] = [parts[3], parts[5]]

    let lock
    if (artifactId) {
        lock = locks.find(it => {
            return it.PackageId == packageId && it.ArtifactId == artifactId
        })
    } else {
        lock = locks.find(it => {
            return it.PackageId == packageId && it.ArtifactId == packageId
        })
    }
    let reference = lock.references.find(it => {
        return it instanceof UnlockElementHelper
    })
    lock.references.splice(lock.references.indexOf(reference), 1)
    reference.domInstance.remove()
    reference = null
}