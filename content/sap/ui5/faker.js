let toastBuffer = []
let toastIsVisible = false, mouseOverToast = false


function createFixedListItem(parameters) {
    let flItem = createElementFrom(`
        <li id="__twine_FooterListElement_${parameters.id}" class="elementFadeIn noSelect">
            <div class="sapTntNLI sapTntNLIFirstLevel">
                <a id="____twine_FooterListElement_${parameters.id}" title="${parameters.title}" tabindex="-1">
                    <span data-sap-ui-icon-content="${parameters.descriptiveIcon}" class="sapUiIcon sapTntNLIIcon sapUiIconMirrorInRTL" style="font-family: SAP-icons; ${parameters.color != null ? `color: ${parameters.color}` : ""}"></span>
                    <span class="sapMText sapTntNLIText sapMTextNoWrap" style="text-align: left; ${parameters.color != null ? `color: ${parameters.color}` : ""}">${parameters.title}</span>
                    <span role="presentation" class="sapTntNLISelectionIndicator sapUiIcon sapUiIconMirrorInRTL" style="font-family: SAP-icons;"></span>
                    <span class="sapUiHiddenPlaceholder"></span>
                </a>
            </div>
        </li>
    `)
    if (parameters.disabled === true) {
        flItem.classList.toggle("disabledListItem")
    }
    if (parameters.suppressContextMenu) {
        flItem.addEventListener("contextmenu", e => { e.preventDefault(); e.stopPropagation(); return false })
    }

    if (parameters.callback != null) {
        flItem.addEventListener(parameters.callback.on, function(event) { parameters.callback.function(event) })
    } else {
        flItem.addEventListener("mousedown", function(event) {
            event.preventDefault()
            event.stopPropagation()
            if (event.button == getMouseAction("fixedItem", 1)) {
                chrome.runtime.sendMessage({
                    type: "OPEN_IN_TAB",
                    url: window.location.protocol+"//"+window.location.host+parameters.url
                })
            } else if (event.button == getMouseAction("fixedItem", 0)) {
                window.location.replace(parameters.url)
            }
            return false
        })
    }

    return flItem
}

function createButton(parameters, callback) {
    let button = document.createElement("button")
    let buttonInner = document.createElement("span")
    let buttonContent = document.createElement("span")
    button.id = parameters.id
    button.classList.add("sapMBtnBase", "sapMBtn", "elementFadeIn")

    buttonInner.classList.add("sapMBtnInner", "sapMBtnHoverable", "sapMFocusable")

    switch (parameters.type) {
        case "POSITIVE":
            (parameters.iconFirst ? buttonContent : buttonInner).classList.add("sapMBtnAccept")
            if (parameters.transparent === true) {
                buttonInner.style.setProperty('background', '#0000', 'important')
                buttonInner.style.setProperty('border', '#0000', 'important')
            }
            break
        case "NEGATIVE":
            buttonInner.classList.add("sapMBtnReject")
            if (parameters.transparent === true) {
                buttonInner.style.setProperty('background', '#0000', 'important')
                buttonInner.style.setProperty('border', '#0000', 'important')
            }
            break
        case "WARNING":
            button.style.border = "#dd6100"
            buttonInner.style.background = "#fff3b8"
            if (parameters.iconFirst) {
                buttonContent.style.color = "#e76500"
            } else {
                buttonInner.style.color = "#e76500"
            }
            break
        case "DISABLED":
            button.classList.add("sapMBtnDisabled")
            if (parameters.transparent === true) {
                buttonInner.style.setProperty('background', '#0000', 'important')
                buttonInner.style.setProperty('border', '#0000', 'important')
            }
            button.disabled = true
            break
        default:
            (parameters.iconFirst ? buttonContent : buttonInner).classList.add("sapMBtnDefault")
            break
    }
    if (parameters.onBar) button.classList.add("sapMBarChild")
    buttonContent.innerHTML = `<div class="sapMBusyIndicator" style="display: none"><span tabindex="0" class="sapUiBlockLayerTabbable"></span><div class="sapMBusyIndicatorBusyArea sapUiLocalBusy" style="position: relative;"><div class="sapUiBlockLayer  sapUiLocalBusyIndicator sapUiLocalBusyIndicatorSizeMedium sapUiLocalBusyIndicatorFade" role="progressbar" alt="" tabindex="0" title="Please wait"><div class="sapUiLocalBusyIndicatorAnimation sapUiLocalBusyIndicatorAnimStandard"><div></div><div></div><div></div></div></div></div><span tabindex="0" class="sapUiBlockLayerTabbable"></span></div>`

    if (parameters.iconFirst) {
        button.title = parameters.title ?? "Missing Title"
        buttonInner.classList.add("sapMBtnIconFirst")
        buttonContent.setAttribute("data-sap-ui-icon-content", parameters.icon)
        buttonContent.classList.add("sapUiIcon", "sapUiIconMirrorInRTL", "sapMBtnCustomIcon", "sapMBtnIcon", "sapMBtnIconLeft")
        buttonContent.style.fontFamily = "SAP-icons"

    } else {
        buttonInner.classList.add("sapMBtnText")
        buttonContent.classList.add("sapMBtnContent")

        let bdi = document.createElement("bdi")
        bdi.title = parameters.title ?? "Missing Title"
        bdi.innerHTML = parameters.title ?? "Missing Text"
        buttonContent.appendChild(bdi)
    }
    button.appendChild(buttonInner)
    buttonInner.appendChild(buttonContent)

    button.addEventListener("click", callback)

    return button
}

function processToasts() {
    if (popoverLayer && toastBuffer.length != 0 && !toastIsVisible) {
        let toast = toastBuffer.shift()
        if (toast) {
            toastIsVisible = true
            setTimeout(() => {
                setTimeout(function wait() {
                    if (mouseOverToast) {
                        setTimeout(wait, 1000)
                    } else {
                        toast.classList.add("elementFadeOut")
                        setTimeout(function wait() {
                            toast.remove()
                            mouseOverToast = false
                            toastIsVisible = false
                            processToasts()
                        }, 500)
                    }
                })
            }, 1500 + toast.querySelector("span").innerText.length * 55)
            popoverLayer.insertBefore(toast, null)
        }
    }
}

function createToast(parameters) {
    let toast = createElementFrom(`
        <div class="sapMMessageToast sapUiSelectable sapContrast sapContrastPlus elementFadeIn" role="alert" style="max-width: max-content !important; position: absolute; visibility: visible; z-index: 80; display: block; bottom: 20px; left: 0; right: 0; margin-left: auto; margin-right: auto;">
            <span tabIndex="0" class="sapMMessageToastHiddenFocusable" style="max-width: 40%; width: auto !important;"/>${parameters.message ?? `There's no message here, unfortunately.<br>But if there was, it would probably be this.<p><b>${parameters}</b></p><i>Kindly report this. Thank you!</i>`} 
        </div>
    `)

    toast.addEventListener("click", (e) => {
        toast.classList.add("elementFadeOut")
        setTimeout(() => {
            toast.remove()
            mouseOverToast = false
            toastIsVisible = false
            processToasts()
        }, 500)
    })
    toast.addEventListener("mouseover", () => {
        mouseOverToast = true
    })
    toast.addEventListener("mouseout", () => {
        mouseOverToast = false
    })

    toastBuffer.push(toast)
    processToasts()
}

function createDocumentationSaveButton() {
    let button = createElementFrom(`
        <button id="__twine-saveDocumentation" data-sap-ui="__twine-data" title="Save Documentation" class="sapMBtnBase sapMBtn spcHeaderActionButton">
            <span id="__twine-saveDocumentation-inner" class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnText sapMBtnTransparent">
                <span id="__twine-saveDocumentation-content" class="sapMBtnContent">
                    <bdi id="__twine-saveDocumentation-BDI-content">Save Documentation</bdi>
                </span>
            </span>
            <span id="__twine-saveDocumentation-tooltip" class="sapUiInvisibleText">Save Documentation</span>
        </button>`)

    button.disabled = true
    button.addEventListener("click", (event) => {
        if (tenantVariables.currentArtifact.documentation != null) {
            try {
                this.disabled = true
                callXHR("PUT", "https://f65f8e15trial.integrationsuite-trial.cfapps.us10-001.hana.ondemand.com/api/1.0/package/6bd05ecfa5e943769d45b9bbfd22f5f4/documents/30160d6313494bce966b6668895473a5?webdav=UNLOCK", null, null, true).then((resolve, reject) => {
                    if (true /*Documentation exists already*/) {
                        //Lock artifact ?webdav=LOCK
                        callXHR("PUT", "https://f65f8e15trial.integrationsuite-trial.cfapps.us10-001.hana.ondemand.com/api/1.0/package/6bd05ecfa5e943769d45b9bbfd22f5f4/documents/30160d6313494bce966b6668895473a5?lockinfo=true&webdav=LOCK", null, null, true).then((resolve, reject) => {
                            callXHR("PUT", "https://f65f8e15trial.integrationsuite-trial.cfapps.us10-001.hana.ondemand.com/api/1.0/package/6bd05ecfa5e943769d45b9bbfd22f5f4/documents/30160d6313494bce966b6668895473a5?webdav=LOCK", null, null, true).then((resolve, reject) => {
                                if (resolve) {
                                    let formDataBoundary = generateFormDataBoundary()
                                    callFetch("POST", "https://f65f8e15trial.integrationsuite-trial.cfapps.us10-001.hana.ondemand.com/api/1.0/package/6bd05ecfa5e943769d45b9bbfd22f5f4/documents", getFormData(formDataBoundary), formDataBoundary).then((resolve, reject) => {
                                        console.log(resolve, reject)
                                        callXHR("PUT", "https://f65f8e15trial.integrationsuite-trial.cfapps.us10-001.hana.ondemand.com/api/1.0/package/6bd05ecfa5e943769d45b9bbfd22f5f4/documents/30160d6313494bce966b6668895473a5?webdav=UNLOCK", null, null, true).then((resolve, reject) => {
                                            console.log(resolve, reject)
                                        })
                                    })
                                } else {
                                    callXHR("PUT", "https://f65f8e15trial.integrationsuite-trial.cfapps.us10-001.hana.ondemand.com/api/1.0/package/6bd05ecfa5e943769d45b9bbfd22f5f4/documents/30160d6313494bce966b6668895473a5?webdav=UNLOCK", null, null, true).then((resolve, reject) => {
                                        console.log(resolve, reject)
                                    })
                                }
                            })
                        })
                    } else {
                        let formDataBoundary = generateFormDataBoundary()
                        callFetch("POST", deepWorkspaceDocumentsUrl(), getFormData(formDataBoundary), formDataBoundary).then((resolve, reject) => {
                        })
                    }
                })
            } catch (e) {
                console.error(e)
                this.disabled = true
            }
        } else {
        }
    })
}

function createDocumentationEditButton() {
    let button = document.createElementNS("http://www.w3.org/2000/svg", "g")
    button.id = "__twine-editDocumentation"
    button.classList.add("sapGalileiContextButton")
    button.style.opacity = "0.7"
    button.focusable = false
    button.innerHTML = `
        <title>Edit Documentation</title>
        <rect class="sapGalileiContextButtonOuter" stroke-width="1" fill="#758ca4" x="16" y="-16" width="32" height="32" rx="16" ry="16"/>
        <rect class="sapGalileiContextButtonInner" stroke="none" fill="#ffffff" x="17" y="-15" width="30" height="30" rx="15" ry="15"/>
        <text class="sapGalileiContextButtonIcon" fill="#0064d9" cursor="default" x="24" y="7" font-size="16px" font-family="SAP-icons" galilei:width="16" galilei:height="16"></text>
    `
    button.addEventListener("click", () => {
    })
    button.stepId = document.getElementsByClassName("sapGalileiSelected")[0].id.split("BPMNShape_")[1]

    return button
}

function createConfirmDialog(parameters, confirmCallback, cancelCallback) {
    let confirmButton = createButton(parameters.confirm, confirmCallback)
    let cancelButton = createButton(parameters.cancel, cancelCallback)
    let dialog = createElementFrom(`
        <div class="sapMDialog sapMDialog-CTX sapMPopup-CTX sapMMessageDialog sapUiShd sapUiUserSelectable sapMDialogOpen" style="position: absolute; visibility: visible; z-index: 70; max-width: 40%; max-height: 20%; top: 20%; left: 30%; right: 30%; display: block;">
            <span class="sapMDialogFirstFE"></span>
            <header>
                <div class="sapMDialogTitleGroup">
                    <div class="sapMIBar sapMIBar-CTX sapMBar sapMContent-CTX sapMBar-CTX sapMHeader-CTX sapMBarTitleAlignAuto">
                        <div class="sapMBarLeft sapMBarContainer sapMBarEmpty"></div>
                        <div class="sapMBarMiddle">
                            <div class="sapMBarPH sapMBarContainer" style="width: 100%;">
                                <h1 class="sapMTitle sapMTitleStyleAuto sapMTitleNoWrap sapUiSelectable sapMTitleMaxWidth sapMDialogTitle sapMBarChild">
                                    <span dir="auto">${parameters.actionTitle ?? "Missing Title"}</span>
                                </h1>
                            </div>
                        </div>
                        <div class="sapMBarRight sapMBarContainer sapMBarEmpty"></div>
                    </div>
                    <span class="sapUiInvisibleText"></span>
                </div>
            </header>
            <section class="sapMDialogSection sapUiScrollDelegate" style="overflow: auto;">
                <div class="sapMDialogScroll">
                    <div class="sapMDialogScrollCont">
                        <span dir="auto" class="sapMText sapUiSelectable sapMTextMaxWidth" style="text-align: left;">${parameters.actionText}</span>
                    </div>
                </div>
            </section>
            <footer class="sapMDialogFooter">
                <div class="sapMIBar sapMTBInactive sapMTB sapMTBNewFlex sapMTBStandard sapMTB-Auto-CTX sapMOTB sapMTBNoBorders sapMIBar-CTX sapMFooter-CTX">
                    <div class="sapMTBSpacer sapMTBSpacerFlex sapMBarChild sapMBarChildFirstChild"></div>
                </div>
            </footer>
            <span class="sapMDialogLastFE"></span>
        </div>
    `)

    let footer = dialog.querySelector("div > footer > div")
    footer.insertAdjacentElement("beforeend", confirmButton)
    footer.insertAdjacentElement("beforeend", cancelButton)

    return dialog
}

function createRadialAvatarMashup(parameters) {
    let menuItem = document.createElement("div");
    let doubleAction = getRadialMode() === "DOUBLEACTION"

    if (parameters.item.actions == null) {
        menuItem.classList.add("radialEmpty")
    } else {
        let mainAction = parameters.item.actions.find((it, index) => {
            return it.mouse == parameters.button
        }) ?? {
            icon: "", title: "Unused", type: "DISABLED", callback: () => {}
        }
        let actionIndex = parameters.item.actions.indexOf(mainAction)
        menuItem.className = "radialMenu-action radialMenu-item";
        menuItem.innerHTML = `
        <div class="sapMFlexItemAlignAuto sapMFlexBoxBGTransparent sapMFlexItem" style="order: 0; flex: 0 1 auto; min-height: auto; min-width: auto; z-index: 90">
            <span style="width: 50px; height: 50px; font-size: 1.125rem; display: block !important" class="sapFAvatar sapFAvatarCustom sapFAvatarIcon sapFAvatarCircle radialMenu-action">
                <span data-sap-ui-icon-content="${mainAction.icon}" class="sapUiIcon sapUiIconMirrorInRTL sapFAvatarTypeIcon radialMenu-action" style="font-family: SAP-icons;"></span>
            </span>
        </div>
    `
        if (parameters.center === true) {
            menuItem.classList.add("radialCenter")
        }
        switch (mainAction.type) {
            case "POSITIVE":
                menuItem.classList.add("radialAccept")
                break;
            case "NEGATIVE":
                menuItem.classList.add("radialReject")
                break
            case "WARNING":
                menuItem.classList.add("radialWarning")
                break
            case "DISABLED":
                menuItem.classList.add("radialDisabled")
                menuItem.disabled = true
                break
            default:
                menuItem.classList.add("radialDefault")
                if (mainAction.color) menuItem.style.setProperty("color", mainAction.color, "important")
                break
        }

        menuItem.style.left = `${parameters.x}px`
        menuItem.style.top = `${parameters.y}px`
        menuItem.animate([
            { opacity: 0, transform: `translate(${parameters.x*-1}px, ${parameters.y*-1}px)` },
            { opacity: 1, transform: "translate(0px, 0px)" }
        ], { duration: 100, iterations: 1})

        const tooltip = document.createElement("div");
        tooltip.className = "radialTooltip";
        tooltip.innerHTML = mainAction.title;

        menuItem.appendChild(tooltip)
        if (mainAction.type !== "DISABLED") menuItem.addEventListener(doubleAction ? "mousedown" : "mouseup", mainAction.callback, {passive: true})

        function updateAction() {
            let newAction = parameters.item.actions[actionIndex]
            let iconSpan = menuItem.querySelector("div > span > span")
            iconSpan.setAttribute("data-sap-ui-icon-content", newAction.icon)
            menuItem.classList.remove("radialAccept", "radialWarning", "radialReject", "radialDisabled", "radialDefault")
            menuItem.disabled = false
            menuItem.lastElementChild.innerHTML = newAction.title

            switch (newAction.type) {
                case "POSITIVE":
                    menuItem.classList.add("radialAccept")
                    break;
                case "NEGATIVE":
                    menuItem.classList.add("radialReject")
                    break
                case "WARNING":
                    menuItem.classList.add("radialWarning")
                    break
                case "DISABLED":
                    menuItem.classList.add("radialDisabled")
                    menuItem.disabled = true
                    break
                default:
                    menuItem.classList.add("radialDefault")
                    if (newAction.color) menuItem.style.setProperty("color", newAction.color, "important")
                    break
            }

            menuItem.removeEventListener(doubleAction ? "mousedown" : "mouseup", mainAction.callback)

            if (newAction.type !== "DISABLED") {
                menuItem.addEventListener(doubleAction ? "mousedown" : "mouseup", newAction.callback, {passive: true})
            }
            mainAction = newAction
        }

        menuItem.addEventListener("wheel", (event) => {
            if (event.deltaY > 0) {
                actionIndex--
            } else if (event.deltaY < 0) {
                actionIndex++
            }

            if (actionIndex < 0) {
                actionIndex = parameters.item.actions.length - 1
            } else if (actionIndex >= parameters.item.actions.length) {
                actionIndex = 0
            }
            updateAction()
        }, {passive: true})
    }

    return menuItem
}

function clipBoardCopy(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            createToast({message: "<b>Copied</b>"})
            this.blur()
        })
        .catch(() => {
            createToast({message: "<b>Couldn't copy to clipboard</b>"})
        })
}


class Tree {
    domInstance
    domInstanceListReference
    children = []

    constructor(trunks) {
        this.domInstance = createElementFrom(`
            <div class="sapMFlexItemAlignAuto sapMFlexBoxBGTransparent sapMFlexItem" style="order: 0; flex: 1 1 auto; min-height: auto; min-width: auto;">
                <div class="sapMList" style="width: 100%;">
                    <div tabIndex="-1" class="sapMListDummyArea"></div>
                    <ul tabIndex="0" class="sapMListItems sapMListUl sapMListShowSeparatorsAll sapMListModeNone"></ul>
                    <div tabIndex="0" class="sapMListDummyArea sapMListDummyAreaSticky"></div>
                </div>
            </div>
        `)
        this.domInstanceListReference = this.domInstance.querySelector("div > div > ul")
        this.domInstance.addEventListener("contextmenu", e => preventDefaultAction(e))
        this.addTrunks(trunks)
    }

    addTrunks(trunks) {
        try {
            let additions = trunks.map(it => {
                return new Trunk(this.domInstanceListReference, it.title, it.meta, null, it.children)
            })
            this.children.push(...additions)
        } catch (e) {
            console.error(e)
        }
    }

    flatList(trunk) {
        return this.children.find(it => it.meta.twineContextType === trunk)?.flatList().flat() ?? null
    }
}

class TreeItem {
    meta
    domInstance
    domInstanceLockIconReference
    constructor(meta) {
        this.meta = meta
    }

    getRadialItems(e) {
        return []
    }

    flatList() {
        return (this.childArtifacts != null) ? this.childArtifacts.map(it => it.flatList()).flat() : [this]
    }
}

class Trunk extends TreeItem {
    searchArtifact
    childArtifacts
    open = false
    icon = ""
    constructor(listReference, title, meta, root, children) {
        super(meta)
        this.domInstance = createElementFrom(`
            <li tabIndex="-1" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBFocusable sapMTreeItemBase sapMSTI __twineArtifact-show" style="display: flex">
                <span data-sap-ui-icon-content="${this.icon}" class="sapUiIcon sapUiIconMirrorInRTL sapUiIconPointer sapMTreeItemBaseExpander" style="font-family: SAP-icons; font-weight: bold"></span>
                <div class="sapMLIBContent"><strong>${title}</strong></div>
            </li>
        `)
        //this.domInstance.style.color = getTypeConversion("type", "displayColor", meta.twineContextType) ?? "inherit"
        listReference.appendChild(this.domInstance)
        this.searchArtifact = new TreeSearch(meta, this)
        listReference.appendChild(this.searchArtifact.domInstance)
        if (children != null) {
            this.domInstance.addEventListener("mousedown", (e) => { this.click(e); return false })
            this.childArtifacts = children.map(it => {
                switch (it.meta.twineContext) {
                    case "TREE_BRANCH":
                        return new Branch(listReference, it.title, it.meta, 1, this, it.children)
                    case "TREE_IBRANCH":
                        return new IntermediateBranch(listReference, it.title, it.meta, 1, this, it.children)
                    case "TREE_LEAF": {
                        let className = getTypeConversion("type", "classType", it.meta.twineContextType)
                        return new className(listReference, it.title, it.meta, 1, this)
                    }
                }
            })
        }
    }


    click(event) {
        preventDefaultAction(event)
        if (event.button == getMouseAction("directory", 1)) {
            chrome.runtime.sendMessage({
                type: "OPEN_IN_TAB",
                url: "https://" + window.location.host + this.meta.twineContextRoot
            })
        } else if (event.button == getMouseAction("directory", 2)) {
            window.location.assign( this.meta.twineContextRoot)
        } else {
            this.toggle()
        }
    }

    toggle() {
        this.open = !this.open
        if (this.open) {
            this.searchArtifact.domInstance.classList.add("__twineArtifact-show")
        } else {
            this.searchArtifact.domInstance.classList.remove("__twineArtifact-show")
        }
        this.domInstance.querySelector("span").setAttribute("data-sap-ui-icon-content", this.open ? "" : this.icon)
        this.childArtifacts?.forEach(it => {
            it.domInstance.classList.toggle("__twineArtifact-show")
            it.childArtifacts?.forEach(it => {
                it.hide()
            })
        })
    }

    search(phrase) {
        this.childArtifacts.forEach(it => it.search(phrase))
    }
}

class TreeSearch extends TreeItem {
    root
    domInstanceSearchReference
    constructor(meta, root) {
        super(meta);
        this.root = root
        this.domInstance = createElementFrom(`
            <li tabindex="-1" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBFocusable sapMTreeItemBase sapMSTI" style="padding-left: 1rem; display: none;">
                <form class="sapMSFF">
                    <span class="sapMSFSSI"></span>
                    <input type="search" autocomplete="off" placeholder="Search" value="" class="sapMSFI">
                    <div class="sapMSFR sapMSFB"></div>
                    <div class="sapMSFS sapMSFB"></div>
                </form>
            </li>
        `)
        this.domInstanceSearchReference = this.domInstance.querySelector("li > form > input")
        this.domInstanceSearchReference.addEventListener("input", (event) => {
            let runStart = window.performance.now()
            this.root.search(event.target.value.replaceAll(/[\s_\-:()\[\]]/g, "").toLowerCase())
            elapsedTime += window.performance.now() - runStart
        })
        this.domInstance.addEventListener("keydown", event => {
            if (event.key === "Backspace" || event.key === "Delete") {
                let runStart = window.performance.now()
                this.root.search(event.target.value.replaceAll(/[\s_\-:()\[\]]/g, "").toLowerCase())
                elapsedTime += window.performance.now() - runStart
            }
        })
    }
}

class Branch extends TreeItem {
    root
    childArtifacts
    open = false
    icon = ""
    lock = null
    constructor(listReference, title, meta, level, root, children) {
        super(meta)
        this.root = root
        this.icon = meta.twineContextType === "Package" || meta.twineContext === "TREE_ROOT" ? "" : getTypeConversion("type", "symbol", meta?.twineContextType)
        this.domInstance = createElementFrom(`
            <li tabIndex="-1" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBFocusable sapMTreeItemBase sapMSTI ${level === 0 ? "__twineArtifact-show" : ""}" style="padding-left: ${`${level * 1}rem`}; display: ${level === 0 ? "flex" : "none"}">
                <span data-sap-ui-icon-content="${this.icon}" class="sapUiIcon sapUiIconMirrorInRTL sapUiIconPointer sapMTreeItemBaseExpander" style="font-family: SAP-icons; font-weight: bold"></span>
                <div class="sapMLIBContent">
                    <strong>${title}</strong>
                    <span data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapUiIconPointer sapMTreeItemBaseExpander" style="font-family: SAP-icons; font-weight: bold; display: none"></span>
                </div>
            </li>
        `)
        //this.domInstance.style.color = getTypeConversion("type", "displayColor", meta.twineContextType) ?? "inherit"
        this.domInstanceLockIconReference = this.domInstance.querySelector("li > div > span")
        listReference.appendChild(this.domInstance)
        if (children != null) {
            this.domInstance.addEventListener("mousedown", (e) => { this.click(e); return false })
            this.childArtifacts = children.map(it => {
                switch (it.meta.twineContext) {
                    case "TREE_BRANCH":
                        return new Branch(listReference, it.title, it.meta, level + 1, this, it.children)
                    case "TREE_IBRANCH":
                        return new IntermediateBranch(listReference, it.title, it.meta, level + 1, this, it.children)
                    case "TREE_LEAF": {
                        let className = getTypeConversion("type", "classType", meta.twineContextType)
                        return new className(listReference, it.title, it.meta, level + 1, this)
                    }
                }
            })
        }
    }

    click(event) {
        preventDefaultAction(event)
        if (event.button == getMouseAction("directory", 1)) {
            chrome.runtime.sendMessage({
                type: "OPEN_IN_TAB",
                url: "https://" + window.location.host  + this.root.meta.twineContextRoot + "/" + getTypeConversion("type", "urlType", this.meta.twineContextType) + `/${this.meta.packageId}?section=ARTIFACTS`
            })
        } else if (event.button == getMouseAction("directory", 2)) {
            window.location.assign(  this.root.meta.twineContextRoot + "/" + getTypeConversion("type", "urlType", this.meta.twineContextType) + `/${this.meta.packageId}?section=ARTIFACTS`)
        } else {
            this.toggle()
        }
    }

    toggle() {
        this.open = !this.open
        this.domInstance.querySelector("span").setAttribute("data-sap-ui-icon-content", this.open ? "" : this.icon)
        this.childArtifacts?.forEach(it => {
            it.domInstance.classList.toggle("__twineArtifact-show")
            it.childArtifacts?.forEach(it => {
                it.hide()
            })
        })
    }

    hide() {
        this.domInstance.classList.remove("__twineArtifact-show")
        this.domInstance.querySelector("span").setAttribute("data-sap-ui-icon-content", this.icon)
        this.childArtifacts?.forEach(it => {
            it.hide()
        })
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([{
            radialIndex: 1,
            actions: [{
                mouse: getMouseAction("copy", 0),
                id: "copyPackageId",
                icon: "",
                title: "Package ID",
                callback: () => {
                    clipBoardCopy(meta.packageId)
                }
            }, {
                mouse: getMouseAction("copy", 2),
                id: "copyPackageName",
                icon: "",
                title: "Package Name",
                callback: () => {
                    clipBoardCopy(meta.packageName)
                }
            }]
        }])
    }

    search(phrase) {
        if (this.meta.search.includes(phrase)) {
            this.childArtifacts.forEach(it => it.qualifies(true, true))
            return this.qualifies(true)
        } else {
            return this.qualifies(
                someOfAll(this.childArtifacts, it => {
                    return it.search(phrase)
                })
            )
        }
    }

    qualifies(result, withChild) {
        if (result) {
            this.domInstance.classList.remove("__twineArtifact-searchDisqualify")
            if (withChild) this.childArtifacts.forEach(it => it.qualifies(true, true))
        } else {
            this.domInstance.classList.add("__twineArtifact-searchDisqualify")
        }
        return result
    }

    setLock(lock) {
        this.lock = lock
        lock.references.push(this)

        this.domInstanceLockIconReference.setAttribute("data-sap-ui-icon-content", loggedInUser.Name !== lock.createdBy ? " " : "")
        this.domInstanceLockIconReference.style.color = "#aa0808"
        this.domInstanceLockIconReference.style.fontWeight = "700"
        this.domInstanceLockIconReference.classList.add("elementFadeIn")
        this.domInstanceLockIconReference.style.display = "inline-block"
    }

    onLockRemoved() {
        this.domInstanceLockIconReference.style.display = "none"
    }
}
class IntermediateBranch extends TreeItem {
    root
    childArtifacts
    open = false
    icon = ""
    constructor(listReference, title, meta, level, root, children) {
        super(meta)
        this.root = root
        this.icon = meta.twineContextType === "Package" || meta.twineContext === "TREE_ROOT" ? "" : getTypeConversion("type", "symbol", meta?.twineContextType)
        this.domInstance = createElementFrom(`
            <li tabIndex="-1" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBFocusable sapMTreeItemBase sapMSTI ${level === 0 ? "__twineArtifact-show" : ""}" style="padding-left: ${`${level * 1}rem`}; display: ${level === 0 ? "flex" : "none"}">
                <span data-sap-ui-icon-content="${this.icon}" class="sapUiIcon sapUiIconMirrorInRTL sapUiIconPointer sapMTreeItemBaseExpander" style="font-family: SAP-icons; font-weight: bold"></span>
                <div class="sapMLIBContent"><strong>${title}</strong></div>
            </li>
        `)
        this.domInstance.style.color = getTypeConversion("type", "displayColor", meta.twineContextType) ?? "inherit"
        listReference.appendChild(this.domInstance)
        if (children != null) {
            this.domInstance.addEventListener("mousedown", (e) => { this.click(e); return false })
            this.childArtifacts = children.map(it => {
                switch (it.meta.twineContext) {
                    case "TREE_BRANCH":
                        return new Branch(listReference, it.title, it.meta, level + 1, this.root, it.children)
                    case "TREE_IBRANCH":
                        return new IntermediateBranch(listReference, it.title, it.meta, level + 1, this.root, it.children)
                    case "TREE_LEAF": {
                        let className = getTypeConversion("type", "classType", meta.twineContextType)
                        return new className(listReference, it.title, it.meta, level + 1, this.root)
                    }
                }
            })
        }
    }

    click(event) {
        preventDefaultAction(event)
        if (event.button != getMouseAction("directory", 0)) {
            this.root.click(event)
        } else {
            this.toggle()
        }
    }

    toggle() {
        this.open = !this.open
        this.domInstance.querySelector("span").setAttribute("data-sap-ui-icon-content", this.open ? "" : this.icon)
        this.childArtifacts?.forEach(it => {
            it.domInstance.classList.toggle("__twineArtifact-show")
            it.childArtifacts?.forEach(it => {
                it.hide()
            })
        })
    }

    hide() {
        this.domInstance.classList.remove("__twineArtifact-show")
        this.domInstance.querySelector("span").setAttribute("data-sap-ui-icon-content", this.icon)
        this.childArtifacts?.forEach(it => {
            it.hide()
        })
    }

    search(phrase) {
        return this.qualifies(
            someOfAll(this.childArtifacts, it => {
                return it.search(phrase)
            })
        )
    }

    qualifies(result, withChild) {
        if (result) {
            this.domInstance.classList.remove("__twineArtifact-searchDisqualify")
            if (withChild) this.childArtifacts.forEach(it => it.qualifies(true))
        } else {
            this.domInstance.classList.add("__twineArtifact-searchDisqualify")
        }
        return result
    }
}

class Leaf extends TreeItem {
    root
    constructor(listReference, title, meta, level, root) {
        super(meta)
        this.root = root
        this.domInstance = createElementFrom(`
            <li tabIndex="-1" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBFocusable sapMTreeItemBase sapMTreeItemBaseLeaf sapMSTI ${level === 0 ? "__twineArtifact-show" : ""}" style="padding-left: ${`${level * 1}rem`}; display: ${level === 0 ? "flex" : "none"}">
                <span data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapUiIconPointer sapMTreeItemBaseExpander" style="font-family: SAP-icons; font-weight: bold"></span>
                <div class="sapMLIBContent">
                    ${title}
                    <span data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapUiIconPointer sapMTreeItemBaseExpander" style="font-family: SAP-icons; font-weight: bold; display: none"></span>
                </div>
            </li>
        `)
        this.domInstance.addEventListener("mousedown", event => {
            let menuItems = this.getRadialItems(event)
            preventDefaultAction(event)
            new RadialMenu()
                .withItems(menuItems, event)
                .show(event)
        })
        this.domInstanceLockIconReference = this.domInstance.querySelector("li > div > span")
        this.domInstance.style.color = getTypeConversion("type", "displayColor", meta.twineContextType)
        listReference.appendChild(this.domInstance)
    }

    hide() {
        this.domInstance.classList.remove("__twineArtifact-show")
    }

    search(phrase) {
        if (this.meta.search.includes(phrase)) {
            return this.qualifies(true)
        } else {
            return this.qualifies(false)
        }
    }

    qualifies(result) {
        if (result) {
            this.domInstance.classList.remove("__twineArtifact-searchDisqualify")
        } else {
            this.domInstance.classList.add("__twineArtifact-searchDisqualify")
        }
        return result
    }
}

class ArtifactLeaf extends Leaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        let deployAction
        switch (true) {
            case checkErrorTolerance(7):
                deployAction = {
                    radialIndex: 3,
                    actions: [{
                        mouse: getMouseAction("deploy", 0),
                        id: "deploy",
                        icon: "",
                        title: "Deploy",
                        type: "DISABLED",
                        callback: () => { createToast({message: "Todo: Deploy Artifact"}) }
                    }]
                }
                break
            default:
                deployAction = getLockedItem("deploy", "deploy", "", "Error tolerance:&nbsp;<span style='color: #aa0808aa'>7</span>")
        }
        return super.getRadialItems(e).concat([{
            radialIndex: 1,
            actions: [{
                mouse: getMouseAction("copy", 0),
                id: "copyArtifactId",
                icon: "",
                title: "Artifact ID",
                callback: () => { clipBoardCopy(this.meta.artifactId) }
            }, {
                mouse: getMouseAction("copy", 1),
                id: "copyPackageId",
                icon: "",
                title: "Package ID",
                callback: () => { clipBoardCopy(this.meta.packageId) }
            }, {
                mouse: getMouseAction("copy", 2),
                id: "copyArtifactName",
                icon: "",
                title: "Artifact Name",
                callback: () => { clipBoardCopy(this.meta.artifactName) }
            }, {
                mouse: getMouseAction("copy", 3),
                id: "copyPackageName",
                icon: "",
                title: "Package Name",
                callback: () => { clipBoardCopy(this.meta.packageName) }
            }]
        }, deployAction])
    }

    setLock(lock) {
        this.lock = lock
        lock.references.push(this)

        this.domInstanceLockIconReference.setAttribute("data-sap-ui-icon-content", loggedInUser.Name !== lock.createdBy ? " " : "")
        this.domInstanceLockIconReference.style.color = "#aa0808"
        this.domInstanceLockIconReference.style.fontWeight = "700"
        this.domInstanceLockIconReference.classList.add("elementFadeIn")
        this.domInstanceLockIconReference.style.display = "inline-block"
    }

    onLockRemoved() {
        this.domInstanceLockIconReference.style.display = "none"
    }
}

class IFlowArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            {
                radialIndex: 2,
                actions: [{
                    mouse: getMouseAction("monitoring", 0),
                    id: "monitoringInTab",
                    icon: "",
                    title: "Open Monitor",
                    callback: () => {
                        window.location.assign(`/shell/monitoring/Messages/{"edge":{"runtimeLocationId":"cloudintegration"},"status":"ALL","artifact":"${this.meta.artifactId}"}`)
                    }
                }, {
                    mouse: getMouseAction("monitoring", 1),
                    id: "monitoringNewTab",
                    icon: "",
                    title: "Monitor (New Tab)",
                    callback: () => {
                        chrome.runtime.sendMessage({
                            type: "OPEN_IN_TAB",
                            url: "https://" + window.location.host + `/shell/monitoring/Messages/{"edge":{"runtimeLocationId":"cloudintegration"},"status":"ALL","artifact":"${this.meta.artifactId}"}`
                        })
                    }
                }]
            },
            getRadialOpenAction(this.meta),
            getRadialStageSwitchAction(e),
            getUnlockAction(this.meta, this.lock)
        ])
    }
}
class MessageMappingArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            {
                radialIndex: 2,
                actions: [{
                    mouse: getMouseAction("mappingFile", 0),
                    id: "mappingFile",
                    icon: "",
                    title: "Mapping Specs",
                    type: "DISABLED",
                    callback: () => { createToast({message: "Todo: Deploy Artifact"}) }
                }]
            },
            getRadialOpenAction(this.meta),
            getRadialStageSwitchAction(e),
            getUnlockAction(this.meta, this.lock)
        ])
    }
}
class ValueMappingArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this.meta),
            getRadialStageSwitchAction(e),
            getUnlockAction(this.meta, this.lock)
        ])
    }
}
class ScriptCollectionArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this.meta),
            getRadialStageSwitchAction(e),
            getUnlockAction(this.meta, this.lock)
        ])
    }
}
class FunctionLibraryArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this.meta),
            getRadialStageSwitchAction(e),
            getUnlockAction(this.meta, this.lock)
        ])
    }
}
class DataTypeArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this.meta),
            getRadialStageSwitchAction(e),
            getUnlockAction(this.meta, this.lock)
        ])
    }
}
class MessageTypeArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this.meta),
            getRadialStageSwitchAction(e),
            getUnlockAction(this.meta, this.lock)
        ])
    }
}
class ODataArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this.meta),
            getRadialStageSwitchAction(e),
            getUnlockAction(this.meta, this.lock)
        ])
    }
}
class RESTArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this.meta),
            getRadialStageSwitchAction(e),
            getUnlockAction(this.meta, this.lock)
        ])
    }
}
class SOAPArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this.meta),
            getRadialStageSwitchAction(e),
            getUnlockAction(this.meta, this.lock)
        ])
    }
}
class ArchiveArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this.meta),
            getRadialStageSwitchAction(e),
            getUnlockAction(this.meta, this.lock)
        ])
    }
}
class IntegrationAdapterArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }
}

class APIProxyArtifact extends Leaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        let path = `/shell/configure/api/${this.meta.artifactId}`
        return super.getRadialItems(e).concat([{
            radialIndex: 1,
            actions: [{
                mouse: getMouseAction("copy", 0),
                id: "copyArtifactId",
                icon: "",
                title: "Artifact ID",
                callback: () => { clipBoardCopy(this.meta.artifactId) }
            }, {
                mouse: getMouseAction("copy", 1),
                id: "copyArtifactName",
                icon: "",
                title: "Artifact Name",
                callback: () => { clipBoardCopy(this.meta.artifactName) }
            }]
        },{
            radialIndex: 0,
            actions: [{
                mouse: getMouseAction("open", 0),
                id: "openInTab",
                icon: "",
                title: "Open",
                callback: () => {
                    window.location.assign(path)
                }
            }, {
                mouse: getMouseAction("open", 1),
                id: "openNewTab",
                icon: "",
                title: "New Tab",
                callback: () => {
                    chrome.runtime.sendMessage({
                        type: "OPEN_IN_TAB",
                        url: "https://" + window.location.host + path
                    })
                }
            }, {
                mouse: getMouseAction("open", 2),
                id: "copyLink",
                icon: "",
                title: "Copy Link",
                callback: () => {
                    clipBoardCopy("https://" + window.location.host + path)
                }
            }]
        }])
    }
}

class RadialMenu {
    static instance
    domInstance
    constructor() {
        this.domInstance = document.createElement("div")
        this.domInstance.id = "__twine_RadialMenu"
        this.domInstance.classList.add("radialMenu")
        this.domInstance.style.zIndex = "65"
        RadialMenu.instance?.domInstance?.remove()
        RadialMenu.instance = this

        window.addEventListener("selectstart", preventDefaultAction)
        window.addEventListener("contextmenu", preventDefaultAction)
        if(getRadialMode() !== "DOUBLEACTION") {
            document.addEventListener("mouseup", RadialMenu.instance.hide)
        } else {
            document.addEventListener("mousedown", RadialMenu.instance.hide)
        }
        popoverLayer.appendChild(this.domInstance)
    }

    withItems(menuItems, event) {
        let radius = 80;
        let angle, x, y
        let radialMode = getRadialMode()
        switch (radialMode) {
            case "CENTERFREE":
                for (let i in [...Array(9).keys()]) {
                    angle = (-Math.PI / 2) + ((i != 0 ? (i - 1) : 6) / 8) * (2 * Math.PI);
                    x = radius * Math.cos(angle)
                    y = radius * Math.sin(angle)
                    let menuItem = createRadialAvatarMashup({item: menuItems.find(it => { return it.radialIndex == i}) ?? {}, x: x, y: y, button: event.button, center: true})
                    this.domInstance.appendChild(menuItem)
                }
                break
            case "CONTEXTONLY":
                if (event.button != 2) break
            default:
                for (let i in [...Array(9).keys()]) {
                    if (i != 0) {
                        angle = (-Math.PI / 2) + ((i - 1) / (8)) * (2 * Math.PI);
                        x = radius * Math.cos(angle)
                        y = radius * Math.sin(angle)
                        let menuItem = createRadialAvatarMashup({item: menuItems.find(it => { return it.radialIndex == i}) ?? {}, x: x, y: y, button: event.button, center: true})
                        this.domInstance.appendChild(menuItem)
                    } else {
                        this.domInstance.appendChild(createRadialAvatarMashup({
                            item: menuItems.find(it => { return it.radialIndex == 0 }) ?? {},
                            x: 0,
                            y: 0,
                            button: event.button
                        }))
                    }
                }
                break
        }
        return this
    }

    show(event) {
        let xOffset = (getRadialMode() !== "SHIFT" ? 25 : -25)
        RadialMenu.instance.domInstance.style.left = `${event.clientX - xOffset}px`;
        RadialMenu.instance.domInstance.style.top = `${event.clientY - 25}px`;
        RadialMenu.instance.domInstance.style.display = "block";
    }

    hide(event) {
        if (getRadialMode() !== "DOUBLEACTION") {
            document.removeEventListener("mouseup", RadialMenu.instance.hide)
        } else {
            document.removeEventListener("mousedown", RadialMenu.instance.hide)
        }
        setTimeout(() => {
            window.removeEventListener("selectstart", preventDefaultAction)
            window.removeEventListener("contextmenu", preventDefaultAction)
            RadialMenu.instance.domInstance.remove()
        }, 10)
        preventDefaultAction(event)
    }
}

function getRadialOpenAction(meta) {
    let path = `/shell/design/contentpackage/${meta.packageId}/${getTypeConversion("type", "urlType", meta.twineContextType)}/${meta.artifactId}`
    return {
        radialIndex: 0,
        actions: [{
            mouse: getMouseAction("open", 0),
            id: "openInTab",
            icon: "",
            title: "Open",
            callback: () => {
                window.location.assign(path)
            }
        }, {
            mouse: getMouseAction("open", 1),
            id: "openNewTab",
            icon: "",
            title: "New Tab",
            callback: () => {
                chrome.runtime.sendMessage({
                    type: "OPEN_IN_TAB",
                    url: "https://" + window.location.host + path
                })
            }
        }, {
            mouse: getMouseAction("open", 2),
            id: "copyLink",
            icon: "",
            title: "Copy Link",
            callback: () => {
                clipBoardCopy("https://" + window.location.host + path)
            }
        }]
    }
}
function getRadialStageSwitchAction(event) {
    let stageSwitchActions
    if(checkQuicklink("stageSwitch") && tenantVariables.globalEnvironment.tenants.length > 1) {
        let mouseAction = getMouseAction("stageSwitch", event.button)
        let stageSwitchItems = tenantVariables.globalEnvironment.tenants
            .filter(it => it.id !== tenantVariables.currentTenant.id)
            .sort((a, b) => a.errorTolerance > b.errorTolerance)
            .map((element, index) => {
                return (!((tenantVariables.currentTenant.server && !element.server) || (!tenantVariables.currentTenant.server && element.server))) ? {
                    mouse: event.button,
                    id: "stage_" + element.id,
                    title: mouseAction === 0 ? `Open (${element.name})` : mouseAction === 1 ? `New Tab (${element.name})` :`Copy Link (${element.name})`,
                    color: element.color,
                    icon: "",
                    callback: (event) => {
                        let url = `${window.location.protocol}//${window.location.host.replace(new RegExp(String.raw`${tenantVariables.currentTenant.id}`, "g"), element.id)}${window.location.pathname}${window.location.search}`
                        if (tenantVariables.currentTenant.server) {
                            url = url.replace(/(?<=cfapps\.).*?(?=\.hana)/, element.server)
                        }
                        if (mouseAction == 1) {
                            chrome.runtime.sendMessage({
                                type: "OPEN_IN_TAB",
                                url: url
                            })
                        } else if (mouseAction == 0) {
                            window.location.assign(url)
                        } else {
                            clipBoardCopy(url)
                        }
                    }
                } : null
            })
            .filter(it => { return it != null })
        if (stageSwitchItems.length > 0) {
            stageSwitchActions = {
                radialIndex: 5,
                actions: [...stageSwitchItems]
            }
        } else stageSwitchActions = {}
    } else stageSwitchActions = {}

    return stageSwitchActions
}
function getUnlockAction(meta, lock) {
    if (lock != null) {
        switch (true) {
            case (checkErrorTolerance(4)):
                return {
                    radialIndex: 4,
                    actions: [{
                        mouse: getMouseAction("unlock", 0),
                        id: "unlock",
                        icon: "",
                        title: "Unlock",
                        type: "NEGATIVE",
                        callback: () => { lock.tryRemove() }
                    }]
                }
            case (!checkErrorTolerance(4)):
                return getLockedItem("unlock", "unlock", "", "Error tolerance:&nbsp;<span style='color: #aa080888'>4</span>")
            default:
                return {}
        }
    } else return {}
}


class Dialog {
    domInstance
    domOptions
    domContent
    dialogContext
    buttons = []
    constructor(title) {
        this.domInstance = createElementFrom(`
            <div class="sapMDialog sapMDialog-CTX sapMPopup-CTX sapMMessageDialog sapUiShd sapUiUserSelectable sapMDialogOpen" style="position: absolute; visibility: visible; z-index: 70 !important; display: block; margin: auto !important; left: 0; right: 0; top: 0; bottom: 0; max-height: fit-content; max-width: fit-content">
                <span class="sapMDialogFirstFE"></span>
                <header>
                    <div class="sapMDialogTitleGroup">
                        <div class="sapMIBar sapMIBar-CTX sapMBar sapMContent-CTX sapMBar-CTX sapMHeader-CTX sapMBarTitleAlignAuto">
                            <div class="sapMBarLeft sapMBarContainer sapMBarEmpty"></div>
                            <div class="sapMBarMiddle">
                                <div class="sapMBarPH sapMBarContainer" style="width: 100%;">
                                    <h1 class="sapMTitle sapMTitleStyleAuto sapMTitleNoWrap sapUiSelectable sapMTitleMaxWidth sapMDialogTitle sapMBarChild">
                                        <span dir="auto">${title ?? "Missing Title"}</span>
                                    </h1>
                                </div>
                            </div>
                            <div class="sapMBarRight sapMBarContainer sapMBarEmpty"></div>
                        </div>
                        <span class="sapUiInvisibleText"></span>
                    </div>
                </header>
                <section class="sapMDialogSection sapUiScrollDelegate disableScrollbars" style="overflow: auto;">
                
                </section>
                <footer class="sapMDialogFooter">
                    <div class="sapMIBar sapMTBInactive sapMTB sapMTBNewFlex sapMTBStandard sapMTB-Auto-CTX sapMOTB sapMTBNoBorders sapMIBar-CTX sapMFooter-CTX">
                        <div class="sapMTBSpacer sapMTBSpacerFlex sapMBarChild sapMBarChildFirstChild"></div>
                    </div>
                </footer>
                <span class="sapMDialogLastFE"></span>
            </div>
        `)
        this.domOptions = this.domInstance.querySelector("div > footer > div")
        this.domContent = this.domInstance.querySelector("div > section")
        //this.domContent.appendChild(new EnvironmentSettingsContainer().domInstance)
        return this
    }

    withOptions(options) {
        options.forEach(it => {
            this.domOptions.insertAdjacentElement("beforeend", it.domInstance)
        })

        this.domOptions.insertAdjacentElement("beforeend", new Button("Close", null, null, false, false, true, () => this.close()).domInstance)
        return this
    }

    withContent(content) {
        this.domContent.innerHTML = content
        return this
    }

    show() {
        popoverLayer.insertAdjacentElement("beforeend", this.domInstance)
        popoverLayerBlocker.style.visibility = "visible"
        popoverLayerBlocker.style.display = "block"
    }

    close() {
        this.domInstance.remove()
        popoverLayerBlocker.style.visibility = "hidden"
        popoverLayerBlocker.style.display = "none"
    }
}

class Button {
    domInstance
    constructor(title, type, icon, iconFirst, transparent, onBar, callback) {
        this.domInstance = document.createElement("button")
        this.domInstance.classList.add("sapMBtnBase", "sapMBtn", "elementFadeIn")

        let buttonInner = document.createElement("span")
        buttonInner.classList.add("sapMBtnInner", "sapMBtnHoverable", "sapMFocusable")

        let buttonContent = document.createElement("span")


        switch (type) {
            case "INVERTED":
                (iconFirst ? buttonContent : buttonInner).classList.add("sapMBtnInverted")
                break
            case "POSITIVE":
                (iconFirst ? buttonContent : buttonInner).classList.add("sapMBtnAccept")
                if (transparent === true) {
                    buttonInner.style.setProperty('background', '#0000', 'important')
                    buttonInner.style.setProperty('border', '#0000', 'important')
                }
                break
            case "NEGATIVE":
                buttonInner.classList.add("sapMBtnReject")
                if (transparent === true) {
                    buttonInner.style.setProperty('background', '#0000', 'important')
                    buttonInner.style.setProperty('border', '#0000', 'important')
                }
                break
            case "WARNING":
                this.domInstance.style.border = "#dd6100"
                buttonInner.style.background = "#fff3b8"
                if (iconFirst) {
                    buttonContent.style.color = "#e76500"
                } else {
                    buttonInner.style.color = "#e76500"
                }
                break
            case "DISABLED":
                this.domInstance.classList.add("sapMBtnDisabled")
                if (transparent === true) {
                    buttonInner.style.setProperty('background', '#0000', 'important')
                    buttonInner.style.setProperty('border', '#0000', 'important')
                }
                this.domInstance.disabled = true
                break
            default:
                (iconFirst ? buttonContent : buttonInner).classList.add("sapMBtnDefault")
                break
        }
        if (onBar) this.domInstance.classList.add("sapMBarChild")
        buttonContent.innerHTML = `<div class="sapMBusyIndicator" style="display: none"><span tabindex="0" class="sapUiBlockLayerTabbable"></span><div class="sapMBusyIndicatorBusyArea sapUiLocalBusy" style="position: relative;"><div class="sapUiBlockLayer  sapUiLocalBusyIndicator sapUiLocalBusyIndicatorSizeMedium sapUiLocalBusyIndicatorFade" alt="" tabindex="0" title="Please wait"><div class="sapUiLocalBusyIndicatorAnimation sapUiLocalBusyIndicatorAnimStandard"><div></div><div></div><div></div></div></div></div><span tabindex="0" class="sapUiBlockLayerTabbable"></span></div>`

        if (iconFirst) {
            this.domInstance.title = title ?? "Missing Title"
            buttonInner.classList.add("sapMBtnIconFirst")
            buttonContent.setAttribute("data-sap-ui-icon-content", icon)
            buttonContent.classList.add("sapUiIcon", "sapUiIconMirrorInRTL", "sapMBtnCustomIcon", "sapMBtnIcon", "sapMBtnIconLeft")
            buttonContent.style.fontFamily = "SAP-icons"

        } else {
            buttonInner.classList.add("sapMBtnText")
            buttonContent.classList.add("sapMBtnContent")

            let bdi = document.createElement("bdi")
            bdi.title = title ?? "Missing Title"
            bdi.innerHTML = title ?? "Missing Text"
            buttonContent.appendChild(bdi)
        }
        this.domInstance.appendChild(buttonInner)
        buttonInner.appendChild(buttonContent)

        this.domInstance.addEventListener("click", callback)
    }
}

class UnlockElementHelper {
    domInstance
    callback

    constructor(lock, iconFirst, transparent, onBar, callback) {
        this.callback = callback
        this.domInstance = new Button("Unlock", "NEGATIVE", "", iconFirst, transparent, onBar, () => { lock.tryRemove() }).domInstance
        lock.references.push(this)
    }

    onLockRemoved() {
        this.callback()
    }
}

class DialogContext {
    constructor() {}

    output() {
        let globalSettings = {}
        let environmentSettings = {}
        return {}
    }

    options() {
        return []
    }
}

class EnvironmentSettingsContainer extends DialogContext {
    domInstance
    domGlobalSettingsContainer
    domEnvironmentSettingsTabs
    constructor() {
        super()
        this.domInstance = createElementFrom(`
            <div class="sapMTabContainer sapUiResponsiveContentPadding sapUiResponsivePadding--header">
                <div class="sapMTabStripContainer sapUi-Std-PaddingXL">
                    <div class="sapMTabStrip sapContrastPlus">
                        <div class="sapMTSLeftOverflowButtons"></div>
                        <div class="sapMTSTabsContainer sapUiScrollDelegate" tabindex="0" style="overflow: hidden;">
                            <div class="sapMTSTabs">
                                <div class="sapMTabStripItem sapMTabStripItemSelected" tabindex="-1">
                                    <div class="sapMTSTexts">
                                        <div class="sapMTabStripItemAddText"></div>
                                        <div class="sapMTabStripItemLabel">
                                            Development
                                            <span class="sapMTabStripItemModifiedSymbol"></span>
                                        </div>
                                    </div>
                                    <div class="sapMTSItemCloseBtnCnt">
                                        <button tabindex="-1" title="Close"
                                                class="sapMBtnBase sapMBtn sapMTabStripSelectListItemCloseBtn">
                                            <span class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnIconFirst sapMBtnTransparent">
                                                <span data-sap-ui-icon-content=""
                                                      class="sapUiIcon sapUiIconMirrorInRTL sapMBtnCustomIcon sapMBtnIcon sapMBtnIconLeft"
                                                      style="font-family: SAP-icons;"></span>
                                            </span>
                                            <span class="sapUiInvisibleText">Close</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="sapMTSRightOverflowButtons"></div>
                        <div class="sapMTSTouchArea">
                            <div tabindex="-1"
                                 class="sapMSlt sapMSltIconOnly sapMSltAutoAdjustedWidth sapMSltWithIcon sapMSltHoverable sapMSltWithArrow sapMTSOverflowSelect"
                                 style="max-width: 2.5rem;">
                                <div tabindex="0" title="Opened Tabs" class="sapUiPseudoInvisibleText sapMSltHiddenSelect"></div>
                                <input name="" value="" tabindex="-1" class="sapUiPseudoInvisibleText">
                                <span title="Opened Tabs" class="sapMSltLabel sapUiPseudoInvisibleText"></span>
                                <span data-sap-ui-icon-content="" title="Opened Tabs"
                                      class="sapMSltIcon sapUiIcon sapUiIconMirrorInRTL" style="font-family: SAP-icons;"></span>
                            </div>
                            <button title="Add New Tab" class="sapMBtnBase sapMBtn sapMTSAddNewTabBtn">
                                <span class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnIconFirst sapMBtnTransparent">
                                    <span data-sap-ui-icon-content=""
                                          class="sapUiIcon sapUiIconMirrorInRTL sapMBtnCustomIcon sapMBtnIcon sapMBtnIconLeft"
                                          style="font-family: SAP-icons;"></span>
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
                                <bdi>Stage Settings:</bdi>
                            </span>
                            <span data-colon=":" class="sapMLabelColonAndRequired"></span>
                        </span>
            
                        <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription"
                             style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                            <div class="sapMInputDescriptionWrapper" style="width: 100px;">
                                <span class="sapMInputDescriptionText" style="padding-right: 0.5rem;">Tag</span>
                            </div>
                            <div class="sapMInputBaseContentWrapper">
                                <input type="text" autocomplete="off" class="sapMInputBaseInner"
                                       placeholder="E.g. DEV, Production etc.">
                            </div>
                        </div>
            
                        <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription"
                             style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                            <div class="sapMInputDescriptionWrapper" style="width: 100px">
                                <span class="sapMInputDescriptionText">Color</span>
                            </div>
                            <div class="sapMInputBaseContentWrapper">
                                <input type="color" onchange="clickColor(0, -1, -1, 5)" value="#000000"
                                       style="width:100%;">
                            </div>
                        </div>
                        <br>
                        <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                            <span class="sapMLabelTextWrapper">
                                <bdi>Tenant URL:</bdi>
                            </span>
                            <span data-colon=":" class="sapMLabelColonAndRequired"></span>
                        </span>
                        <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription"
                             style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                            <div class="sapMInputDescriptionWrapper" style="">
                                <span class="sapMInputDescriptionText" style="padding-right: 0.5rem;">https://</span>
                            </div>
                            <div class="sapMInputBaseContentWrapper" style="">
                                <input type="text" autocomplete="off" class="sapMInputBaseInner" placeholder="Subdomain">
                            </div>
                            <div class="sapMInputDescriptionWrapper" style="">
                                <span class="sapMInputDescriptionText" style="padding-right: 0.5rem;">
                                    .integrationsuite<i>(-trial)</i>.cfapps.
                                </span>
                            </div>
                            <div class="sapMInputBaseContentWrapper" style="">
                                <input type="text" autocomplete="off" class="sapMInputBaseInner" placeholder="Server">
                            </div>
                            <div class="sapMInputDescriptionWrapper" style="">
                                <span class="sapMInputDescriptionText">.hana.ondemand.com</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `)
    }


    output() {
        this.domGlobalSettingsContainer
    }

    save() {

    }
}
class EnvironmentSettingsTab {
    domInstanceHeader
    domInstanceContent
    environment
    constructor(environment) {
        this.environment = environment
        this.domInstanceHeader = createElementFrom(`
            <div class="sapMTabStripItem sapMTabStripItemSelected" tabindex="-1">
                <div class="sapMTSTexts">
                    <div class="sapMTabStripItemAddText"></div>
                    <div class="sapMTabStripItemLabel">
                        Development
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
        `)
        this.domInstanceContent = createElementFrom(`
            <div class="sapMTabContainerContent sapMTabContainerContentList">
                <div class="sapMTabContainerInnerContent">
                    <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                        <span class="sapMLabelTextWrapper">
                            <bdi>First Name:</bdi>
                        </span>
                        <span data-colon=":" class="sapMLabelColonAndRequired"></span>
                    </span>
                    <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput" style="width: 100%;">
                        <div class="sapMInputBaseContentWrapper" style="width: 100%;">
                            <input value="Jean" type="text" autocomplete="off" class="sapMInputBaseInner">
                        </div>
                    </div>
                    <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                        <span class="sapMLabelTextWrapper">
                            <bdi>Last Name:</bdi>
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
                        <div class="sapMInputDescriptionWrapper" style="width: calc(50%);">
                            <span class="sapMInputDescriptionText">EUR</span>
                        </div>
                    </div>
                </div>
            </div>
        `)
        this.domInstanceHeader = createElementFrom(`
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
        `)
    }

    save() {
        try {
            //todo: Do everything needed for a successful save, then return success
            return true
        } catch (e) {

        }
        return false
    }
}


/*
Regex for UI5 Component Cleaning => aria-.*?=".+?"\s?|id=".*?"\s?|role=".*?"\s?|data-sap-(?!ui-icon-content).*?=".*?"\s?|data-ui-accesskey=".*?"\s?
*/