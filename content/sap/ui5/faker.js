let toastBuffer = []
let toastIsVisible = false, mouseOverToast = false


function createFixedListItem(parameters) {
    let flItem = createElementFrom(`
        <li id="__twine_FooterListElement_${parameters.id}" class="elementFadeIn noSelect">
            <div class="sapTntNLI sapTntNLIFirstLevel">
                <a id="____twine_FooterListElement_${parameters.id}" tabindex="-1">
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
        flItem.addEventListener("contextmenu", e => {
            e.preventDefault();
            e.stopPropagation();
            return false
        })
    }

    if (parameters.callback != null) {
        flItem.addEventListener(parameters.callback.on, function (event) {
            parameters.callback.function(event)
        })
    } else {
        flItem.addEventListener("mousedown", function (event) {
            event.preventDefault()
            event.stopPropagation()
            if (event.button == getMouseAction("fixedItem", 1)) {
                chrome.runtime.sendMessage({
                    type: "OPEN_IN_TAB",
                    url: window.location.protocol + "//" + window.location.host + parameters.url
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
            <span tabIndex="0" class="sapMMessageToastHiddenFocusable" style="max-width: 40%; width: auto !important;"/>${parameters.message ?? `There's no message here, unfortunately.<br>But if there was, it might be something like this.<p><b>${parameters}</b></p><i>Kindly report this. Thank you!</i>`} 
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
            return it.mouse == getMouseAction(parameters.item.actionId, parameters.button)
        }) ?? parameters.item.actions[0]
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
            {opacity: 0, transform: `translate(${parameters.x * -1}px, ${parameters.y * -1}px)`},
            {opacity: 1, transform: "translate(0px, 0px)"}
        ], {duration: 100, iterations: 1})

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
    domInstanceBusyIndicatorReference
    domInstanceBusyIndicatorTextReference
    children = []

    constructor(trunks) {
        this.domInstance = createElementFrom(`
            <div class="sapMFlexItemAlignAuto sapMFlexBoxBGTransparent sapMFlexItem" style="order: 0; flex: 1 1 auto; min-height: auto; min-width: auto;">
                <div class="sapMList" style="width: 100%;">
                    <div tabIndex="-1" class="sapMListDummyArea"></div>
                    <ul tabIndex="0" class="sapMListItems sapMListUl sapMListShowSeparatorsAll sapMListModeNone"></ul>
                    <div class="sapMBusyIndicator" style="display: none"><span tabindex="0" class="sapUiBlockLayerTabbable"></span><div class="sapMBusyIndicatorBusyArea sapUiLocalBusy" style="position: relative;"><div class="sapUiBlockLayer  sapUiLocalBusyIndicator sapUiLocalBusyIndicatorSizeMedium sapUiLocalBusyIndicatorFade" alt="" tabindex="0" title="Please wait"><div class="sapUiLocalBusyIndicatorAnimation sapUiLocalBusyIndicatorAnimStandard"><div></div><div></div><div></div></div></div></div><span tabindex="0" class="sapUiBlockLayerTabbable"></span></div>
                    <div tabIndex="0" class="sapMListDummyArea sapMListDummyAreaSticky"></div>
                </div>
            </div>
        `)
        this.domInstanceListReference = this.domInstance.querySelector("div > div > ul")
        this.domInstanceBusyIndicatorReference = this.domInstance.querySelector("div > div > div:nth-of-type(2)")
        this.domInstanceBusyIndicatorTextReference = this.domInstance.querySelector("div > div > div:nth-of-type(2) > span:nth-of-type(2)")
        this.domInstance.addEventListener("contextmenu", e => preventDefaultAction(e))
        this.addTrunks(trunks)
    }

    addTrunks(trunks) {
        if (trunks?.length > 0) {
            try {
                let additions = trunks.map(it => {
                    return new Trunk(this.domInstanceListReference, it.title, it.meta, null, it.children)
                })
                this.children.push(...additions)
            } catch (e) {
                console.error(e)
            }
        }
    }

    flatList(trunk) {
        return this.children.find(it => it.meta.twineContextType === trunk)?.flatList().flat() ?? null
    }

    setBusy(show, text) {
        this.domInstanceBusyIndicatorReference.style.display = show === true ? "block" : "none"
        this.domInstanceBusyIndicatorTextReference.innerText = text
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
            this.domInstance.addEventListener("mousedown", (e) => {
                this.click(e);
                return false
            })
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
        if (getMouseAction("directory", event.button) == 1) {
            chrome.runtime.sendMessage({
                type: "OPEN_IN_TAB",
                url: "https://" + window.location.host + this.meta.twineContextRoot
            })
        } else if (getMouseAction("directory", event.button) == 2) {
            window.location.assign(this.meta.twineContextRoot)
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

    search(phrase, inputElement) {
        this.childArtifacts.forEach(it => it.search(phrase, inputElement))
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
                    <span id="__button111110-tooltip" class="sapUiInvisibleText">bar-code</span>
                    <div class="sapMSFR sapMSFB"></div>
                    <div class="sapMSFS sapMSFB"></div>
                </form>
            </li>
        `)
        this.domInstanceSearchReference = this.domInstance.querySelector("li > form > input")
        this.domInstanceSearchReference.addEventListener("input", (event) => {
            let runStart = window.performance.now()
            this.root.search(event.target.value.startsWith(":") ? event.target.value : event.target.value.replaceAll(/[\s_\-()\[\]]|(?<!^):/g, "").toLowerCase(), event.target.parentElement)
            elapsedTime += window.performance.now() - runStart
        })
        this.domInstance.addEventListener("keydown", event => {
            if (event.key === "Backspace" || event.key === "Delete") {
                let runStart = window.performance.now()
                this.root.search(event.target.value.startsWith(":") ? event.target.value : event.target.value.replaceAll(/[\s_\-()\[\]]|(?<!^):/g, "").toLowerCase(), event.target.parentElement)
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
            this.domInstance.addEventListener("mousedown", (e) => {
                this.click(e);
                return false
            })
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
        if (getMouseAction("directory", event.button) != 0) {
            let menuItems = this.getRadialItems(event)
            new RadialMenu()
                .withItems(menuItems, event)
                .show(event)
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
        let path = `/shell/design/contentpackage/${this.meta.packageId}?section=ARTIFACTS`
        return super.getRadialItems(e).concat([
            {
                radialIndex: 2,
                actionId: "typeAction",
                actions: [{
                    mouse: getMouseAction("typeAction", 0),
                    id: "monitoringInTab",
                    icon: "",
                    title: "Open Monitor",
                    callback: () => {
                        window.location.assign(`/shell/monitoring/Messages/{"edge":{"runtimeLocationId":"cloudintegration"},"status":"ALL","packageId":"${this.meta.packageId}"}`)
                    }
                }, {
                    mouse: getMouseAction("typeAction", 1),
                    id: "monitoringNewTab",
                    icon: "",
                    title: "Monitor (New Tab)",
                    callback: () => {
                        chrome.runtime.sendMessage({
                            type: "OPEN_IN_TAB",
                            url: "https://" + window.location.host + `/shell/monitoring/Messages/{"edge":{"runtimeLocationId":"cloudintegration"},"status":"ALL","packageId":"${this.meta.packageId}"}`
                        })
                    }
                }]
            },
            {
                radialIndex: 1,
                actionId: "copy",
                actions: [{
                    mouse: getMouseAction("copy", 0),
                    id: "copyPackageId",
                    icon: "",
                    title: "Package ID",
                    callback: () => {
                        clipBoardCopy(this.meta.packageId)
                    }
                }, {
                    mouse: getMouseAction("copy", 2),
                    id: "copyPackageName",
                    icon: "",
                    title: "Package Name",
                    callback: () => {
                        clipBoardCopy(this.meta.packageName)
                    }
                }]
            }, {
                radialIndex: 0,
                actionId: "open",
                actions: [{
                    mouse: 2,
                    id: "copyLink",
                    icon: "",
                    title: "Copy Link",
                    callback: () => {
                        clipBoardCopy("https://" + window.location.host + path)
                    }
                }, {
                    mouse: 1,
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
                    mouse:0,
                    id: "openInTab",
                    icon: "",
                    title: "Open",
                    callback: () => {
                        window.location.assign(path)
                    }
                }]
            }, getUnlockAction(this.meta, this.lock)])
    }

    search(phrase, inputElement) {
        if (phrase.startsWith(":")) {
            if (phrase.length > 1) {
                let [command, ...options] = phrase.slice(1).split("-")
                this.searchCommand(command, options.join("-"), inputElement)
            } else {
                this.childArtifacts.forEach(it => it.qualifies(true, true))
                return this.qualifies(true)
            }
        } else {
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

        /*if (phrase === ":locked" && this.lock != null) {
            this.childArtifacts.forEach(it => it.search(phrase))
            return this.qualifies(true)
        }
        if (this.meta.search.includes(phrase)) {
            this.childArtifacts.forEach(it => it.qualifies(true, true))
            return this.qualifies(true)
        } else {
            return this.qualifies(
                someOfAll(this.childArtifacts, it => {
                    return it.search(phrase)
                })
            )
        }*/
    }

    searchCommand(command, options, inputElement) {
        switch (command.toLowerCase()) {
            case "lock":
            case "locks":
            case "locked":
                if (this.lock != null) {
                    if (options == null) {
                        this.childArtifacts.forEach(it => it.searchCommand(command, options))
                        return this.qualifies(true)
                    } else if (options === "me") {
                        if (this.lock.Owned) {
                            this.childArtifacts.forEach(it => it.searchCommand(command, options))
                            return this.qualifies(true)
                        } else {
                            return this.qualifies(
                                someOfAll(this.childArtifacts, it => {
                                    return it.searchCommand(command, options)
                                })
                            )
                        }
                    } else {
                        if (this.lock.CreatedBy.match(new RegExp(String.raw`.*${options}.*`))) {
                            this.childArtifacts.forEach(it => it.searchCommand(command, options))
                            return this.qualifies(true)
                        } else {
                            return this.qualifies(
                                someOfAll(this.childArtifacts, it => {
                                    return it.searchCommand(command, options)
                                })
                            )
                        }
                    }
                } else return this.qualifies(
                    someOfAll(this.childArtifacts, it => {
                        return it.searchCommand(command, options)
                    })
                )
                break
            case "regex":
            case "rx":
                if (options == null) return this.qualifies(true)
                try {
                    inputElement.classList.remove("sapMInputBaseContentWrapperError")
                    new RegExp(options, "i")
                } catch (error) {
                    console.error(error)
                    inputElement.classList.add("sapMInputBaseContentWrapperError")
                }
                if (new RegExp(String.raw`.*${options}.*`, "i").test(this.meta.search)) {
                    this.childArtifacts.forEach(it => it.qualifies(true, true))
                    return this.qualifies(true)
                } else {
                    return this.qualifies(
                        someOfAll(this.childArtifacts, it => {
                            return it.searchCommand(command, options)
                        })
                    )
                }
            default:
                this.childArtifacts.forEach(it => it.qualifies(true))
                return this.qualifies(true)
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

        this.domInstanceLockIconReference.setAttribute("data-sap-ui-icon-content", loggedInUser.Name !== lock.CreatedBy ? " " : "")
        this.domInstanceLockIconReference.style.color = "#aa0808"
        this.domInstanceLockIconReference.style.fontWeight = "700"
        this.domInstanceLockIconReference.classList.add("elementFadeIn")
        this.domInstanceLockIconReference.style.display = "inline-block"
    }

    onLockRemoved() {
        this.domInstanceLockIconReference.style.display = "none"
        this.lock = null
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
        this.icon = meta.twineContextType === "Package" || meta.twineContext === "TREE_ROOT" ? "" : getTypeConversion("type", "symbol", meta?.twineContextType) ?? ""
        this.domInstance = createElementFrom(`
            <li tabIndex="-1" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBFocusable sapMTreeItemBase sapMSTI ${level === 0 ? "__twineArtifact-show" : ""}" style="padding-left: ${`${level * 1}rem`}; display: ${level === 0 ? "flex" : "none"}">
                <span data-sap-ui-icon-content="${this.icon}" class="sapUiIcon sapUiIconMirrorInRTL sapUiIconPointer sapMTreeItemBaseExpander" style="font-family: SAP-icons; font-weight: bold"></span>
                <div class="sapMLIBContent"><strong>${title ?? "Unknown Type (Please report this)"}</strong></div>
            </li>
        `)
        this.domInstance.style.color = getTypeConversion("type", "displayColor", meta.twineContextType) ?? "inherit"
        listReference.appendChild(this.domInstance)
        if (children != null) {
            this.domInstance.addEventListener("mousedown", (e) => {
                this.click(e);
                return false
            })
            this.childArtifacts = children.map(it => {
                switch (it.meta.twineContext) {
                    case "TREE_BRANCH":
                        return new Branch(listReference, it.title, it.meta, level + 1, this.root, it.children)
                    case "TREE_IBRANCH":
                        return new IntermediateBranch(listReference, it.title, it.meta, level + 1, this.root, it.children)
                    case "TREE_LEAF": {
                        let className = getTypeConversion("type", "classType", meta.twineContextType)
                        if (className) {
                            return new className(listReference, it.title, it.meta, level + 1, this.root)
                        } else {
                            return new UnknownArtifact(listReference, it.title, it.meta, level + 1, this.root)
                        }
                    }
                }
            })
        }
    }

    click(event) {
        preventDefaultAction(event)
        if (getMouseAction("directory", event.button) != 0) {
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

    searchCommand(command, options) {
        return this.qualifies(
            someOfAll(this.childArtifacts, it => {
                return it.searchCommand(command, options)
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

    searchCommand(command, options) {
        switch (command.toLowerCase()) {
            case "lock":
            case "locks":
            case "locked":
                if (this.lock != null) {
                    if (options == null) return this.qualifies(true)
                    if (options === "me") {
                        return this.qualifies(this.lock.Owned)
                    } else {
                        return this.qualifies(this.lock.CreatedBy.match(new RegExp(String.raw`.*${options}.*`)))
                    }
                } else return this.qualifies(false)
                break
            case "regex":
            case "rx":
                if (options == null) return this.qualifies(true)
                return this.qualifies(new RegExp(String.raw`.*${options}.*`, "i").test(this.meta.search))
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
        let deployAction, downloadAction = {
            radialIndex: 6,
            actionId: "download",
            actions: [{
                mouse: getMouseAction("download", 0),
                id: "download",
                icon: "",
                title: "Download",
                type: "DISABLED",
                callback: () => {
                    createToast({message: "Todo: Download Artifact"})
                }
            }]
        }
        switch (true) {
            case checkErrorTolerance(7):
                deployAction = {
                    radialIndex: 3,
                    actionId: "deploy",
                    actions: [{
                        mouse: getMouseAction("deploy", 0),
                        id: "deploy",
                        icon: "",
                        title: "Deploy",
                        type: "DISABLED",
                        callback: () => {
                            createToast({message: "Todo: Deploy Artifact"})
                        }
                    }]
                }
                break
            default:
                deployAction = getLockedItem("deploy", "deploy", "", "Error tolerance:&nbsp;<span style='color: #aa0808aa'>7</span>")
        }
        return super.getRadialItems(e).concat([{
            radialIndex: 1,
            actionId: "copy",
            actions: [{
                mouse: getMouseAction("copy", 0),
                id: "copyArtifactId",
                icon: "",
                title: "Artifact ID",
                callback: () => {
                    clipBoardCopy(this.meta.artifactId)
                }
            }, {
                mouse: getMouseAction("copy", 1),
                id: "copyPackageId",
                icon: "",
                title: "Package ID",
                callback: () => {
                    clipBoardCopy(this.meta.packageId)
                }
            }, {
                mouse: getMouseAction("copy", 2),
                id: "copyArtifactName",
                icon: "",
                title: "Artifact Name",
                callback: () => {
                    clipBoardCopy(this.meta.artifactName)
                }
            }, {
                mouse: getMouseAction("copy", 3),
                id: "copyPackageName",
                icon: "",
                title: "Package Name",
                callback: () => {
                    clipBoardCopy(this.meta.packageName)
                }
            }]
        }, deployAction, downloadAction])
    }

    setLock(lock) {
        this.lock = lock
        lock.references.push(this)

        this.domInstanceLockIconReference.setAttribute("data-sap-ui-icon-content", loggedInUser.Name !== lock.CreatedBy ? " " : "")
        this.domInstanceLockIconReference.style.color = "#aa0808"
        this.domInstanceLockIconReference.style.fontWeight = "700"
        this.domInstanceLockIconReference.classList.add("elementFadeIn")
        this.domInstanceLockIconReference.style.display = "inline-block"
    }

    onLockRemoved() {
        this.domInstanceLockIconReference.style.display = "none"
        this.lock = null
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
                actionId: "typeAction",
                actions: [{
                    mouse: getMouseAction("typeAction", 0),
                    id: "monitoringInTab",
                    icon: "",
                    title: "Open Monitor",
                    callback: () => {
                        window.location.assign(`/shell/monitoring/Messages/{"edge":{"runtimeLocationId":"cloudintegration"},"status":"ALL","artifact":"${this.meta.artifactId}"}`)
                    }
                }, {
                    mouse: getMouseAction("typeAction", 1),
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
            getRadialStageSwitchAction(e, this.meta),
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
                actionId: "typeAction",
                actions: [{
                    mouse: getMouseAction("typeAction", 0),
                    id: "mappingFile",
                    icon: "",
                    title: "Mapping Specs",
                    type: "DISABLED",
                    callback: () => {
                        createToast({message: "Todo: Deploy Artifact"})
                    }
                }]
            },
            getRadialOpenAction(this.meta),
            getRadialStageSwitchAction(e, this.meta),
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
            getRadialStageSwitchAction(e, this.meta),
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
            getRadialStageSwitchAction(e, this.meta),
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
            getRadialStageSwitchAction(e, this.meta),
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
            getRadialStageSwitchAction(e, this.meta),
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
            getRadialStageSwitchAction(e, this.meta),
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
            getRadialStageSwitchAction(e, this.meta),
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
            getRadialStageSwitchAction(e, this.meta),
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
            getRadialStageSwitchAction(e, this.meta),
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
            getRadialStageSwitchAction(e, this.meta),
            getUnlockAction(this.meta, this.lock)
        ])
    }
}

class IntegrationAdapterArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }
}

class APIArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }
}

class UnknownArtifact extends ArtifactLeaf {
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
            actionId: "copy",
            actions: [{
                mouse: getMouseAction("copy", 0),
                id: "copyArtifactId",
                icon: "",
                title: "Artifact ID",
                callback: () => {
                    clipBoardCopy(this.meta.artifactId)
                }
            }, {
                mouse: getMouseAction("copy", 1),
                id: "copyArtifactName",
                icon: "",
                title: "Artifact Name",
                callback: () => {
                    clipBoardCopy(this.meta.artifactName)
                }
            }]
        }, {
            radialIndex: 0,
            actionId: "open",
            actions: [{
                mouse: 0,
                id: "openInTab",
                icon: "",
                title: "Open",
                callback: () => {
                    window.location.assign(path)
                }
            }, {
                mouse: 1,
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
                mouse: 2,
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



class SecureMaterialArtifact extends Leaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([{
            radialIndex: 0,
            actionId: "copy",
            actions: [{
                mouse: getMouseAction("copy", 0),
                id: "copyArtifactId",
                icon: "",
                title: "Copy",
                callback: () => {
                    clipBoardCopy(this.meta.secureMaterialId)
                }
            }]
        }, checkErrorTolerance(7) ? {
            radialIndex: 1,
            actionId: "delete",
            actions: [{
                mouse: getMouseAction("delete", 0),
                id: "deleteSecureMaterial",
                icon: "",
                title: "Delete",
                type: "NEGATIVE",
                callback: () => {
                    this.delete()
                }
            }]
        } : getLockedItem("delete", "delete", "", "Error tolerance:&nbsp;<span style='color: #aa0808'>7</span>", 1)])
    }
	
	delete() {
        let dialog = createConfirmDialog({
            actionTitle: "Confirm",
            actionText: `Do you really want to delete secure material ${this.meta.artifactId}?`,
            confirm: {
                id: `__twine_delete_secure_material_confirm`,
                title: "Delete",
                type: "NEGATIVE",
                onBar: true
            },
            cancel: {id: `__twine_delete_secure_material_cancel`, title: "Cancel", onBar: true}
        }, (e) => {
			callXHR("POST", operationsUrl() + "/com.sap.it.km.api.commands.UndeployCredentialsCommand", `artifactIds=${this.meta.artifactId}&tenantId=${this.meta.tenantId}`, "application/x-www-form-urlencoded; charset=UTF-8", true).then(() => {
				createToast({message: `Secure Material ${this.meta.artifactId} was deleted`})
				this.domInstance.remove()
			}).catch((e) => {
				console.log(e)
				createToast({message: "Couldn't delete secure material"})
			})
            dialog.remove()
            popoverLayerBlocker.style.zIndex = "64"
        },(e) => {
            dialog.remove()
            popoverLayerBlocker.style.zIndex = "64"
        })
        popoverLayer.insertAdjacentElement("beforeend", dialog)

        popoverLayerBlocker.style.zIndex = "69"
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
        if (getRadialMode() !== "DOUBLEACTION") {
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
                    let menuItem = createRadialAvatarMashup({
                        item: menuItems.find(it => {
                            return it.radialIndex == i
                        }) ?? {}, x: x, y: y, button: event.button, center: true
                    })
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
                        let menuItem = createRadialAvatarMashup({
                            item: menuItems.find(it => {
                                return it.radialIndex == i
                            }) ?? {}, x: x, y: y, button: event.button, center: true
                        })
                        this.domInstance.appendChild(menuItem)
                    } else {
                        this.domInstance.appendChild(createRadialAvatarMashup({
                            item: menuItems.find(it => {
                                return it.radialIndex == 0
                            }) ?? {},
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
        actionId: "open",
        actions: [{
            mouse: 0,
            id: "openInTab",
            icon: "",
            title: "Open",
            callback: () => {
                window.location.assign(path)
            }
        }, {
            mouse: 1,
            id: "openNewTab",
            icon: "",
            title: "New Tab",
            callback: () => {
                openLinkInNewTab("https://" + window.location.host + path)
            }
        }, {
            mouse: 2,
            id: "copyLink",
            icon: "",
            title: "Copy Link",
            callback: () => {
                clipBoardCopy("https://" + window.location.host + path)
            }
        }]
    }
}

function getRadialStageSwitchAction(event, meta) {
    let stageSwitchActions
    if (checkQuicklink("stageSwitch") && tenantVariables.globalEnvironment.tenants.length > 1) {
        let mouseAction = getMouseAction("stageSwitch", event.button)
        let stageSwitchItems = tenantVariables.globalEnvironment.tenants
            .filter(it => it.id !== tenantVariables.currentTenant.id)
            .sort((a, b) => a.errorTolerance > b.errorTolerance)
            .map((element, index) => {
                return (!((tenantVariables.currentTenant.datacenter && !element.datacenter) || (!tenantVariables.currentTenant.datacenter && element.datacenter))) ? {
                    mouse: event.button,
                    id: "stage_" + element.id,
                    title: mouseAction === 0 ? `Open (${element.name})` : mouseAction === 1 ? `New Tab (${element.name})` : `Copy Link (${element.name})`,
                    color: element.color,
                    icon: "",
                    callback: (event) => {
                        let url = `${window.location.protocol}//${window.location.host.replace(new RegExp(String.raw`${tenantVariables.currentTenant.id}`, "g"), element.id)}/shell/design/contentpackage/${meta.packageId}/${getTypeConversion("type", "urlType", meta.twineContextType)}/${meta.artifactId}`
                        if (tenantVariables.currentTenant.datacenter) {

                            url = url.replace(/(?<=cfapps\.).*?(?=\.hana)/, element.datacenter).replace(/(?<=\.integrationsuite).*?(?=\.cfapps)/, element.system)
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
            .filter(it => {
                return it != null
            })
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
                    actionId: "unlock",
                    actions: [{
                        mouse: getMouseAction("unlock", 0),
                        id: "unlock",
                        icon: "",
                        title: "Unlock",
                        type: "NEGATIVE",
                        callback: () => {
                            lock.tryRemove()
                        }
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
            <div class="sapMDialog sapMDialog-CTX sapMPopup-CTX sapMMessageDialog sapUiShd sapUiUserSelectable sapMDialogOpen" style="position: absolute; visibility: visible; z-index: 70 !important; display: block; margin: auto !important; left: 0; right: 0; top: 0; bottom: 0; max-height: max-content; max-width: max-content">
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
        this.dialogContext = content
        this.domContent.appendChild(content.domInstance)
        return this
    }

    show() {
        popoverLayer.insertAdjacentElement("beforeend", this.domInstance)
        popoverLayerBlocker.style.zIndex = "64"
        popoverLayerBlocker.style.visibility = "visible"
        popoverLayerBlocker.style.display = "block"
    }

    close() {
        this.domInstance.remove()
        popoverLayerBlocker.style.visibility = "hidden"
        popoverLayerBlocker.style.display = "none"
    }
}

class SimpleElement {
    domInstance

    constructor(content) {
        this.domInstance = createElementFrom(content)
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
        this.domInstance = new Button("Unlock", "NEGATIVE", "", iconFirst, transparent, onBar, () => {
            lock.tryRemove()
        }).domInstance
        lock.references.push(this)
    }

    onLockRemoved() {
        this.callback()
    }
}

class SettingsDialog {
    domInstance
    domOptions
    domContent
    tabs
    buttons = []
    settings = configuration.sap.integrationSuite

    constructor() {
        let runStart = window.performance.now()

        this.tabs = [new EnvironmentsTab(this), new GlobalSettingsTab(this)]
        this.domInstance = createElementFrom(`
            <div class="sapMDialog sapMDialog-CTX sapMPopup-CTX sapMMessageDialog sapUiShd sapUiUserSelectable sapMDialogOpen" style="position: absolute; visibility: visible; z-index: 65 !important; display: block; margin: auto !important; left: 5%; right: 5%; top: 5%; bottom: 5%;">
                <span class="sapMDialogFirstFE"></span>
                <header>
                    <div class="sapMDialogTitleGroup">
                        <div class="sapMIBar sapMIBar-CTX sapMBar sapMContent-CTX sapMBar-CTX sapMHeader-CTX sapMBarTitleAlignAuto">
                            <div class="sapMBarLeft sapMBarContainer sapMBarEmpty"></div>
                            <div class="sapMBarMiddle">
                                <div class="sapMBarPH sapMBarContainer" style="width: 100%;">
                                    <h1 class="sapMTitle sapMTitleStyleAuto sapMTitleNoWrap sapUiSelectable sapMTitleMaxWidth sapMDialogTitle sapMBarChild">
                                        <span dir="auto">Twine Settings</span>
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
                        <div class="sapMTabStripContainer sapUi-Std-PaddingS">
                            <div class="sapMTabStrip sapContrastPlus">
                                <div class="sapMTSLeftOverflowButtons"></div>
                                <div class="sapMTSTabsContainer sapUiScrollDelegate" tabindex="0" style="overflow: hidden;">
                                    <div class="sapMTSTabs"></div>
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
                                </div>
                            </div>
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
        this.domOptions = this.domInstance.querySelector("div > footer > div")
        this.domInstanceStrip = this.domInstance.querySelector("div > section > div > div > div > div:nth-of-type(2) > div")
        this.tabs.forEach(it => this.domInstanceStrip.appendChild(it.domInstanceHeader))

        this.domInstanceContainer = this.domInstance.querySelector("div > section > div")
        this.tabs.forEach(it => this.domInstanceContainer.appendChild(it.domInstanceContent))
        this.domOptions.insertAdjacentElement("beforeend", new Button("Copy Config", "INVERTED", "", true, false, true, () => {
            clipBoardCopy(JSON.stringify(configuration))
        }).domInstance)
        this.domOptions.insertAdjacentElement("beforeend", new Button("Save", "INVERTED", null, false, false, true, () => {
            this.save()
        }).domInstance)
        this.domOptions.insertAdjacentElement("beforeend", new Button("Close", null, null, false, false, true, () => this.close()).domInstance)

        elapsedTime += window.performance.now() - runStart
        return this
    }

    show() {
        popoverLayer.insertAdjacentElement("beforeend", this.domInstance)
        popoverLayerBlocker.style.zIndex = "64"
        popoverLayerBlocker.style.visibility = "visible"
        popoverLayerBlocker.style.display = "block"
    }

    save() {
        if (this.tabs[0].environments.every(it => { return it.isValid() })) {
            this.settings = this.tabs[1].getSaveOutput()
            let environments = this.tabs[0].getSaveOutput()

            this.settings.sap.integrationSuite.environments = environments.filter(it => it.owner != "Other Environments")
            this.settings.sap.integrationSuite.trialTenantSettings = environments.find(it => it.owner == "Other Environments").tenants.find(it => it.name == "Trial")
            this.settings.sap.integrationSuite.undefinedTenantSettings = environments.find(it => it.owner == "Other Environments").tenants.find(it => it.name == "Unknown")
            if (compareVersion(this.settings.version, configuration.version) != 0) {
                clipBoardCopy(JSON.stringify(configuration))
                createToast({message: "Previous config has been copied to clipboard. Just in case"})
            }
            configuration = this.settings
            chrome.runtime.sendMessage({type: "CFG_CHANGE", configuration: configuration}).then(resolve => {
                if (resolve.status < 0) {
                    error("Couldn't save configuration")
                    console.error(resolve)
                    createToast("Couldn't save<br>Please check the developer console for possible causes")
                } else {
                    info(resolve.message)
                    log("Configuration saved successfully")
                    createToast({message: "Saved!<br>Most changes need a refresh to take effect"})
                }
            })
        } else {
            let invalidEnvs = this.tabs[0].environments.filter(it => { return !it.isValid() })
            createToast({message: `<b>Please correct configurations for the following environments first</b><br>${invalidEnvs.map(it => {
                    return it.getDataset().owner+" - "+it.tenants.filter(it => { return !it.isValid() }).map(it => it.getDataset().name).join(", ")
                }).join("<br>")}`
            })
        }
    }

    close() {
        this.domInstance.remove()
        popoverLayerBlocker.style.visibility = "hidden"
        popoverLayerBlocker.style.display = "none"
    }

    switchTab(stripId) {
        this.tabs.forEach(it => {
            if (it.stripId == stripId) {
                it.domInstanceContent.style.display = "block"
                it.domInstanceHeader.classList.add("sapMTabStripItemSelected")
            } else {
                it.domInstanceContent.style.display = "none"
                it.domInstanceHeader.classList.remove("sapMTabStripItemSelected")
            }
        })
    }
}

class SettingsDialogTab {
    stripId
    active = false
    domInstanceHeader
    domInstanceContent
    domInstanceContentContainer
    root
    valid

    constructor(root) {
        this.root = root
    }

    select() {
        this.root.switchTab(this.stripId)
    }
}

class GlobalSettingsTab extends SettingsDialogTab {
    valid = true
    configObjects = new Map()
    radialModeSelection

    constructor(root) {
        super(root)
        this.stripId = "globalSettings"
        this.domInstanceHeader = createElementFrom(`
            <div class="sapMTabStripItem" tabindex="-1">
                <div class="sapMTSTexts">
                    <div class="sapMTabStripItemAddText"></div>
                    <div class="sapMTabStripItemLabel">
                        General
                        <!--<span class="sapMTabStripItemModifiedSymbol"></span>-->
                    </div>
                </div>
            </div>
        `)
        this.domInstanceHeader.addEventListener("click", () => {
            this.select()
        })
        this.domInstanceContent = createElementFrom(`
            <div class="sapMTabContainerContent sapMTabContainerContentList disableScrollbars">
                <div class="sapMTabContainerInnerContent disableScrollbars">
                    <div class="sapUiRespGrid sapUiRespGridMedia-Std-LargeDesktop sapUiRespGridHSpace0 sapUiRespGridVSpace0 sapUiFormResGridMain sapUiRespGridOverflowHidden">
                    </div>
                </div>
            </div>
        `)
        this.domInstanceContent.style.display = "none"


        let contentNode = this.domInstanceContent.querySelector("div")
        this.domInstanceContentContainer = contentNode


        this.addObject(new SimpleCheckBox("Enable Shortcuts", checkCloudIntegrationFeature("quickAccess"), true), "shortcutsEnabled", true)
        /*contentNode.appendChild(createElementFrom(`
            <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                <span class="sapMLabelTextWrapper">
                    <bdi style="font-weight: bold">Common Shortcuts</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))*/

        this.addObject(new SimpleCheckBox("Credentials", checkQuicklink("credentials")), "shortcutCredentials")
        this.addObject(new SimpleCheckBox("Queues", checkQuicklink("queues")), "shortcutQueues")
        this.addObject(new SimpleCheckBox("Monitoring", checkQuicklink("monitoring")), "shortcutMonitoring")
        this.addObject(new SimpleCheckBox("Certificates", checkQuicklink("certificates")), "shortcutCertificates")
        this.addObject(new SimpleCheckBox("Datastores", checkQuicklink("datastores")), "shortcutDatastores")
        this.addObject(new SimpleCheckBox("Connectivity Test", checkQuicklink("connectivityTest")), "shortcutConnectivityTest")
        this.addObject(new SimpleCheckBox("Locks", checkQuicklink("locks")), "shortcutLocks")
        this.addObject(new SimpleCheckBox("Stage Switch", checkQuicklink("stageSwitch")), "shortcutStageSwitch")
        this.addObject(new SimpleCheckBox("Check Naming Conventions (Not implemented yet)", checkQuicklink("checkNamingConventions")), "shortcutCheckNamingConventions")



        this.addObject(new SimpleCheckBox("Enable Artifact Lists", checkCloudIntegrationFeature("integrationContentQuickAccess"), true), "artifactShortcutsEnabled", true)
        this.addObject(new SimpleCheckBox("Enable Decorations", checkIntegrationSuiteFeature("decorations"), true), "decorationsEnabled", true)
        this.addObject(new SimpleCheckBox("Stage Tag", configuration?.sap?.integrationSuite?.decorations?.tenantStage), "decorationsStage")
        this.addObject(new SimpleCheckBox("Company Logo", configuration?.sap?.integrationSuite?.decorations?.companyLogo), "decorationsLogo")
        this.addObject(new SimpleCheckBox("Enable Inline Documentation", checkCloudIntegrationFeature("documentation"), true), "inlineDocumentationEnabled", true)
        this.addObject(new SimpleCheckBox("Enable Editing", configuration?.sap?.integrationSuite?.cloudIntegration?.documentation?.enableEditingDocumentation), "inlineDocumentationEditable")
        this.addObject(new SimpleCheckBox("AI Summary", configuration?.sap?.integrationSuite?.cloudIntegration?.documentation?.aiSummary), "inlineDocumentationAISummary")
        this.addObject(new SimpleCheckBox("Enable Unlock Buttons", checkCloudIntegrationFeature("unlock"), true), "unlockEnabled", true)

        contentNode.appendChild(document.createElement("br"))
        this.addObject(createElementFrom(`
            <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                <span class="sapMLabelTextWrapper">
                    <bdi style="font-weight: bold;">Radial Menu Mode</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))
        this.radialModeSelection = new RadialModeSelector()
        this.addObject(this.radialModeSelection, "radialMode")
        contentNode.appendChild(document.createElement("br"))
        this.addObject(createElementFrom(`
            <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                <span class="sapMLabelTextWrapper">
                    <bdi style="font-weight: bold;">Mouse Button Mappings</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))
        contentNode.appendChild(document.createElement("br"))
        this.addObject(createElementFrom(`
            <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                <span class="sapMLabelTextWrapper">
                    <bdi">(Correspond to left, middle, right click)<br>Other actions can be reached via scrolling</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))

        contentNode.appendChild(document.createElement("br"))
        contentNode.appendChild(document.createElement("br"))
        this.addObject(createElementFrom(`
            <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                <span class="sapMLabelTextWrapper">
                    <bdi">Folders</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))
        this.addObject(
            new MouseButtonSelector(
                "directory",
                {0: "Toggle", 1: "See Other Actions", 2: "See Other Actions"},
                Object.values(configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.directory ?? [0, 1, 2])
            ), "mouseMappingDirectory"
        )

        contentNode.appendChild(document.createElement("br"))
        this.addObject(createElementFrom(`
            <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                <span class="sapMLabelTextWrapper">
                    <bdi">Deploy</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))
        this.addObject(
            new MouseButtonSelector(
                "deploy",
                {0: "Deploy", 1: "Default", 2: "Default"},
                Object.values(configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.deploy ?? [0, 1, 2])
            ), "mouseMappingDeploy"
        )

        contentNode.appendChild(document.createElement("br"))
        this.addObject(createElementFrom(`
            <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                <span class="sapMLabelTextWrapper">
                    <bdi">Copy</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))
        this.addObject(
            new MouseButtonSelector(
                "copy",
                {0: "Artifact Id", 1: "Package Id", 2: "Artifact Name"},
                Object.values(configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.copy ?? [0, 1, 2])
            ), "mouseMappingCopy"
        )

        contentNode.appendChild(document.createElement("br"))
        this.addObject(createElementFrom(`
            <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                <span class="sapMLabelTextWrapper">
                    <bdi">Open</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))
        this.addObject(
            new MouseButtonSelector(
                "open",
                {0: "Open", 1: "Open New Tab", 2: "Copy URL"},
                Object.values(configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.open ?? [0, 1, 2])
            ), "mouseMappingOpen"
        )

        contentNode.appendChild(document.createElement("br"))
        this.addObject(createElementFrom(`
            <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                <span class="sapMLabelTextWrapper">
                    <bdi">Artifact Type-specific Actions</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))
        this.addObject(
            new MouseButtonSelector(
                "typeAction",
                {0: "Action 1", 1: "Action 2", 2: "Action 3"},
                Object.values(configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.typeAction ?? configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.monitoring ?? [0, 1, 2])
            ), "mouseMappingTypeAction"
        )

        contentNode.appendChild(document.createElement("br"))
        this.addObject(createElementFrom(`
            <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                <span class="sapMLabelTextWrapper">
                    <bdi">Stage Switch</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))
        this.addObject(
            new MouseButtonSelector(
                "stageSwitch",
                {0: "Open", 1: "Open New Tab", 2: "Copy URL"},
                Object.values(configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.stageSwitch ?? [0, 1, 2])
            ), "mouseMappingStageSwitch"
        )

        contentNode.appendChild(document.createElement("br"))
        this.addObject(createElementFrom(`
            <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                <span class="sapMLabelTextWrapper">
                    <bdi">Unlock</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))
        this.addObject(
            new MouseButtonSelector(
                "unlock",
                {0: "Unlock", 1: "Default", 2: "Default"},
                Object.values(configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.unlock ?? [0, 1, 2])
            ), "mouseMappingUnlock"
        )


        contentNode.appendChild(document.createElement("br"))
        contentNode.appendChild(document.createElement("br"))
        contentNode.appendChild(createElementFrom(`
            <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                <span class="sapMLabelTextWrapper">
                    <bdi style="font-weight: bold">Artifact Display Settings</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))

        artifactTypeConfiguration.filter(it => it.type != "Package" && it.type != "APIProxy").forEach(it => {
            this.addObject(new ColorPicker(it.type, it.displayNameP, it.displayColor), `displayColor_${it.type}`)
        })
    }

    addObject(object, asSetting, asHeader) {
        if (asHeader) this.domInstanceContentContainer.appendChild(document.createElement("br"))
        if (asSetting?.length > 0) {
            this.configObjects.set(asSetting, object)
            this.domInstanceContentContainer.appendChild(object.domInstance)
        } else {
            this.domInstanceContentContainer.appendChild(object)
        }
    }

    getSaveOutput() {
        let saveConfig = {
            sap: {
                cloudStatus: {
                    "hideFunctional": Boolean(configuration?.sap?.cloudStatus?.hideFunctional)
                },
                integrationSuite: {
                    cloudIntegration: {
                        integrationContentQuickAccess: {
                            enabled: this.configObjects?.get("artifactShortcutsEnabled")?.getValue() ?? true,
                            artifactColors: {},
                            radialMenu: {
                                mode: this.configObjects?.get("radialMode")?.getValue() ?? "CENTER"
                            },
                            settings: {
                                removePrefix: false
                            }
                        },
                        mouseMapping: {},
                        quickAccess: {
                            enabled:  this.configObjects?.get("shortcutsEnabled")?.getValue() ?? true,
                            links: {
                                "certificates": this.configObjects?.get("shortcutCertificates").getValue(),
                                "credentials": this.configObjects?.get("shortcutCredentials").getValue(),
                                "queues": this.configObjects?.get("shortcutQueues").getValue(),
                                "monitoring": this.configObjects?.get("shortcutMonitoring").getValue(),
                                "datastores": this.configObjects?.get("shortcutDatastores").getValue(),
                                "connectivityTest": this.configObjects?.get("shortcutConnectivityTest").getValue(),
                                "checkNamingConventions": this.configObjects?.get("shortcutCheckNamingConventions").getValue(),
                                "locks": this.configObjects?.get("shortcutLocks").getValue(),
                                "stageSwitch": this.configObjects?.get("shortcutStageSwitch").getValue()
                            }
                        },
                        unlock: {
                            enabled:  this.configObjects?.get("unlockEnabled")?.getValue() ?? false
                        },
                        documentation: {
                            enabled: this.configObjects?.get("inlineDocumentationEnabled")?.getValue() ?? false,
                            enableEditingDocumentation: this.configObjects?.get("inlineDocumentationEditable")?.getValue() ?? false,
                            aiSummary: this.configObjects?.get("inlineDocumentationAISummary")?.getValue() ?? false
                        }
                    },
                    decorations: {
                        enabled:  this.configObjects?.get("decorationsEnabled")?.getValue() ?? true,
                        tenantStage:  this.configObjects?.get("decorationsStage")?.getValue() ?? true,
                        companyLogo:  this.configObjects?.get("decorationsLogo")?.getValue() ?? true
                    },
                    environments: [],
                    performanceMeasurement: {
                        enabled: configuration.sap.integrationSuite?.performanceMeasurement?.enabled ?? true,
                        logLevel: configuration.sap.integrationSuite?.performanceMeasurement?.logLevel ?? 19,
                        measureIntervalInSec: configuration.sap.integrationSuite?.performanceMeasurement?.measureIntervalInSec ?? 60
                    },
                    reminders: {
                        lockedArtifacts: configuration.sap.integrationSuite?.reminders?.lockedArtifacts ?? false
                    }
                }
            },
            version: configVersion,
            isConfigured: true
        }

        Array.from(this.configObjects.entries())
            .filter(it => { return it[0].startsWith("mouseMapping") })
            .forEach(it => {
                let values = Object.entries(it[1].getValues())[0]
                saveConfig.sap.integrationSuite.cloudIntegration.mouseMapping[uncapitalize(values[0].replace("mouseMapping", ""))] = values[1]
            })

        Array.from(this.configObjects.entries())
            .filter(it => { return it[0].startsWith("displayColor_") })
            .forEach(it => {
                let values = Object.entries(it[1].getValue())[0]
                saveConfig.sap.integrationSuite.cloudIntegration.integrationContentQuickAccess.artifactColors[values[0].replace("displayColor_", "")] = values[1]
            })


        return saveConfig
        //return this.radialModeSelection.getValue()
    }
}

function uncapitalize(string) {
    return string.charAt(0).toLowerCase() + string.slice(1)
}

class SettingsInputBase {
    domInstance
    domInstanceReference
    value
}

function tryCoerceColor(color) {
    if (!color || !color.startsWith("#") || color.length < 4) return "#000000"
    let colorValue = color.substring(1)
    switch (colorValue.length) {
        case 3:
            return "#" + colorValue.split('').map(it => { return it+it } ).join('')
        case 4:
            return "#" + colorValue.split('').map(it => { return it+it } ).join('').substring(0, 6)
        case 6:
            return color
        case 8:
            return "#" + colorValue.substring(0, 6)
    }
}

class ColorPicker extends SettingsInputBase {
    identifier
    constructor(identifier, displayNameP, value) {
        super()
        this.value = tryCoerceColor(value)
        this.identifier = identifier
        this.domInstance = createElementFrom(`
            <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription"
                 style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                <div class="sapMInputDescriptionWrapper" style="width: 150px">
                    <span class="sapMInputDescriptionText">${displayNameP}</span>
                </div>
                <div class="sapMInputBaseContentWrapper">
                    <input type="color" value="${this.value ?? null}" name="displayColor_${identifier}" style="width:100%;">
                </div>
            </div>
        `)
    }

    getValue() {
        return {[`${this.identifier}`]: this.domInstance.getElementsByTagName("input")[0].value}
    }
}

class RadialModeSelector extends SettingsInputBase {
    constructor() {
        super()
        this.value = getRadialMode()
        this.domInstance = createElementFrom(`
            <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription noSelect"
                 style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                <div class="sapMFlexBox sapMHBox sapMFlexBoxJustifyCenter sapMFlexBoxAlignItemsCenter sapMFlexBoxWrapNoWrap sapMFlexBoxAlignContentStretch sapMFlexBoxBGTransparent">
                    <div class="sapMFlexItemAlignAuto sapMFlexBoxBGTransparent sapMFlexItem"
                         style="order: 0; flex: 0 1 auto; min-height: auto; min-width: auto;">
                        <ul class="sapMSegBIcons sapMSegB"
                            style="width: 450px;" tabindex="-1">
                            <li tabindex="-1" class="sapMSegBBtn  sapMSegBBtnMixed" style="width: 25%;" data-value="CENTER">
                                <div class="sapMSegBBtnInnerWrapper twineClickable">
                                    <div class="sapMSegBBtnInner twineClickable">
                                        Default
                                    </div>
                                </div>
                            </li>
                            <li tabindex="-1" class="sapMSegBBtn  sapMSegBBtnMixed" style="width: 25%;" data-value="CENTERFREE">
                                <div class="sapMSegBBtnInnerWrapper twineClickable">
                                    <div class="sapMSegBBtnInner twineClickable">
                                        No-Center
                                    </div>
                                </div>
                            </li>
                            <li tabindex="-1" class="sapMSegBBtn  sapMSegBBtnMixed" style="width: 25%;" data-value="CONTEXTONLY">
                                <div class="sapMSegBBtnInnerWrapper twineClickable">
                                    <div class="sapMSegBBtnInner twineClickable">
                                        Contextmenu
                                    </div>
                                </div>
                            </li>
                            <li tabindex="0"
                                class="sapMSegBBtn sapMSegBtnLastVisibleButton  sapMSegBBtnMixed" style="width: 25%;" data-value="DOUBLEACTION">
                                <div class="sapMSegBBtnInnerWrapper twineClickable">
                                    <div class="sapMSegBBtnInner twineClickable">
                                        Dbl.Click
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        `)
        Array.from(this.domInstance.querySelectorAll("div > div > ul > li")).find(it => {
            return it.dataset.value == this.value
        })?.classList.add("sapMSegBBtnSel")
        this.domInstance.addEventListener("click", e => {
            if (e.target.classList.contains("twineClickable")) {
                let selection = e.target.closest("li")
                Array.from(selection.parentNode.children).forEach(it => {
                    it.classList.remove("sapMSegBBtnSel")
                })
                selection.classList.add("sapMSegBBtnSel")
                this.value = selection.dataset.value
            }
        })
    }

    getValue() {
        return this.value
    }
}
class MouseButtonSelector extends SettingsInputBase {
    mouseMappings
    constructor(mappingId, mouseMappings, initialValues) {
        super()
        this.value = mappingId
        this.mouseMappings = mouseMappings
        this.domInstance = createElementFrom(`
            <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription noSelect"
                 style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                <div class="sapMFlexBox sapMHBox sapMFlexBoxJustifyCenter sapMFlexBoxAlignItemsCenter sapMFlexBoxWrapNoWrap sapMFlexBoxAlignContentStretch sapMFlexBoxBGTransparent">
                    <div class="sapMFlexItemAlignAuto sapMFlexBoxBGTransparent sapMFlexItem"
                         style="order: 0; flex: 0 1 auto; min-height: auto; min-width: auto;">
                        <ul class="sapMSegBIcons sapMSegB"
                            style="width: 450px;" tabindex="-1">
                            <li tabindex="0"
                                class="sapMSegBBtn sapMSegBtnLastVisibleButton  sapMSegBBtnMixed" style="width: 33.33333%;">
                                <div class="sapMSegBBtnInnerWrapper twineClickable">
                                    <div class="sapMSegBBtnInner twineClickable twineTextValue" data-value="${initialValues[0]}">
                                        ${this.mouseMappings[initialValues[0]]}
                                    </div>
                                </div>
                            </li>
                            <li tabindex="0"
                                class="sapMSegBBtn sapMSegBtnLastVisibleButton  sapMSegBBtnMixed" style="width: 33.33333%;">
                                <div class="sapMSegBBtnInnerWrapper twineClickable">
                                    <div class="sapMSegBBtnInner twineClickable twineTextValue" data-value="${initialValues[1]}">
                                        ${this.mouseMappings[initialValues[1]]}
                                    </div>
                                </div>
                            </li>
                            <li tabindex="0"
                                class="sapMSegBBtn sapMSegBtnLastVisibleButton  sapMSegBBtnMixed" style="width: 33.33333%;">
                                <div class="sapMSegBBtnInnerWrapper twineClickable">
                                    <div class="sapMSegBBtnInner twineClickable twineTextValue" data-value="${initialValues[2]}">
                                        ${this.mouseMappings[initialValues[2]]}
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        `)
        this.domInstance.addEventListener("contextmenu", e => preventDefaultAction(e))
        this.domInstance.addEventListener("mousedown", e => {
            preventDefaultAction(e)
            if (e.target.classList.contains("twineClickable")) {
                if (e.target.classList.contains("twineTextValue")) {
                    e.target.innerText = this.mouseMappings[e.button]
                    e.target.dataset.value = e.button
                } else {
                    e.target.firstElementChild = this.mouseMappings[e.button]
                    e.target.firstElementChild.dataset.value = e.button
                }
            }
        })
    }

    getValues() {
        let values = this.domInstance.getElementsByClassName("twineTextValue")
        return {
            [`${this.value}`]: {
                "left": parseInt(values[0].dataset.value),
                "other": parseInt(values[1].dataset.value),
                "right": parseInt(values[2].dataset.value),
            }
        }
    }
}
let mouseMappings = {0: "Open / Action", 1: "Open New Tab", 2: "Copy / Other"}

class SimpleCheckBox extends SettingsInputBase {
    constructor(title, value, asHeader, description) {
        super();
        this.value = value === true
        this.domInstance = createElementFrom(`
            <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription noSelect"
                 style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                <div class="sapMFlexItemAlignAuto sapMFlexBoxBGTransparent sapMFlexItem" style="order: 0; flex: 0 1 auto; min-height: auto; min-width: auto;">
                    <div tabindex="0" class="sapMCb sapMCbHasLabel">
                        <div class="sapMCbBg sapMCbHoverable sapMCbMark">
                            <input type="CheckBox">
                        </div>
                        <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth sapMCbLabel" style="text-align: left;">
                            <span class="sapMLabelTextWrapper">
                                <bdi style="font-weight: ${asHeader ? "bold" : "inherit"}">${title}</bdi>
                            </span>
                            <span data-colon=":" class="sapMLabelColonAndRequired"></span>
                        </span>
                    </div>
                </div>
            </div>
        `)
        this.domInstance.addEventListener("click", () => {
            this.domInstanceReference.checked = !this.domInstanceReference.checked
            this.domInstanceReference.parentElement.classList.toggle("sapMCbMarkChecked")
        })
        this.domInstanceReference = this.domInstance.querySelector("div > div > div > input")
        if (value === true) {
            this.domInstanceReference.checked = true
            this.domInstanceReference.parentElement.classList.toggle("sapMCbMarkChecked")
        }
    }

    getValue() {
        return this.domInstanceReference.checked
    }
}

class SimpleComboBox extends SettingsInputBase {

    constructor(initialValue) {
        super();
        this.value = Math.max(1, initialValue ?? 1)
        this.domInstance = createElementFrom(`
            <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription"
                 style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                <div class="sapMInputDescriptionWrapper" style="width: 150px;">
                    <span class="sapMInputDescriptionText" style="padding-right: 0.5rem;">Enabled Features</span>
                </div>
                <div class="sapMInputBaseContentWrapper">
                    <select name="errorTolerance" class="sapMInputBaseInner">
                        <option value="1">1 - Features without external communication</option>
                        <option value="2">2 - N/A</option>
                        <option value="3">3 - N/A</option>
                        <option value="4">4 - Above and unlock feature</option>
                        <option value="5">5 - N/A</option>
                        <option value="6">6 - N/A</option>
                        <option value="7">7 - Above and everything else</option>
                    </select>
                </div>
            </div>
        `)

        Array.from(this.domInstance.querySelector("div > select").options)[this.value-1].setAttribute("selected", "")
    }

    getValue() {
        return this.domInstance.querySelector("div > select").value
    }
}

class EnvironmentsTab extends SettingsDialogTab {
    valid = false
    domInstanceTabList
    domInstanceTabContainer
    domInstanceAddTabButton
    environments

    constructor(root) {
        super(root)
        this.environments = configuration.sap.integrationSuite.environments.map(it => new EnvironmentTab(this, it))
        this.environments.push(
            new EnvironmentTab(this, {
                owner: "Other Environments",
                tenants: [
                    configuration?.sap?.integrationSuite?.undefinedTenantSettings,
                    configuration?.sap?.integrationSuite?.trialTenantSettings
                ]
            }, false, false, false)
        )
        this.stripId = "environmentSettings"
        this.active = true
        this.valid = true
        this.domInstanceHeader = createElementFrom(`
            <div class="sapMTabStripItem" tabindex="-1">
                <div class="sapMTSTexts">
                    <div class="sapMTabStripItemAddText"></div>
                    <div class="sapMTabStripItemLabel">
                        Environments
                        <!--<span class="sapMTabStripItemModifiedSymbol"></span>-->
                    </div>
                </div>
            </div>
        `)
        this.domInstanceHeader.addEventListener("click", () => {
            this.select()
        })
        if (this.active && this.valid) {
            this.domInstanceHeader.classList.add("sapMTabStripItemSelected")
        }
        this.domInstanceContent = createElementFrom(`
            <div class="sapMTabContainerContent sapMTabContainerContentList">
                <div class="sapMTabContainerInnerContent disableScrollbars" style="padding: 0">
                    <div class="sapMTabContainer sapUiResponsiveContentPadding sapUiResponsivePadding--header">
                        <div class="sapMTabStripContainer sapUi-Std-PaddingM" style="border-top: 2px solid #22354844">
                            <div class="sapMTabStrip sapContrastPlus">
                                <div class="sapMTSLeftOverflowButtons"></div>
                                <div class="sapMTSTabsContainer sapUiScrollDelegate disableScrollbars" tabindex="0" style="overflow: hidden; overflow-x: scroll;">
                                    <div class="sapMTSTabs"></div>
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
                                    <button title="Add Environment" class="sapMBtnBase sapMBtn sapMTSAddNewTabBtn">
                                        <span class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnIconFirst sapMBtnTransparent">
                                            <span data-sap-ui-icon-content=""
                                                  class="sapUiIcon sapUiIconMirrorInRTL sapMBtnCustomIcon sapMBtnIcon sapMBtnIconLeft"
                                                  style="font-family: SAP-icons;"></span>
                                        </span>
                                        <span class="sapUiInvisibleText">Add Environment</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `)
        this.domInstanceContent.style.display = "block"
        this.domInstanceTabList = this.domInstanceContent.querySelector("div > div > div > div > div:nth-of-type(2) > div")
        this.environments.forEach(it => this.domInstanceTabList.appendChild(it.domInstanceHeader))

        this.domInstanceContainer = this.domInstanceContent.querySelector("div > div > div")
        this.environments.forEach(it => this.domInstanceContainer.appendChild(it.domInstanceContent))
        this.switchTab(getTenantOwner())

        this.domInstanceAddTabButton = this.domInstanceContent.querySelector("div > div > div > div > div:nth-of-type(4) > button")
        this.domInstanceAddTabButton.addEventListener("click", (e) => {
            this.addTab(e)
        })
    }

    getSaveOutput() {
        return this.environments.map(it => {
            return it.getDataset()
        })
    }


    addTab(e) {
        if (this.environments.every(it => {
            return it.isValid()
        })) {
            let newTab = this.environments.push(new EnvironmentTab(this, null, true))
            this.domInstanceTabList.appendChild(this.environments[newTab - 1].domInstanceHeader)
            this.domInstanceContainer.appendChild(this.environments[newTab - 1].domInstanceContent)
            this.environments[newTab - 1].select()
        } else {
            createToast({message: "Please enter a valid configuration for all other environments first"})
        }
    }

    switchTab(stripId) {
        if (this.environments.find(it => it.stripId == stripId)) {
            this.environments.forEach(it => {
                if (it.stripId == stripId) {
                    it.domInstanceContent.style.display = "block"
                    it.domInstanceHeader.classList.add("sapMTabStripItemSelected")
                } else {
                    it.domInstanceContent.style.display = "none"
                    it.domInstanceHeader.classList.remove("sapMTabStripItemSelected")
                }
            })
        } else {
            this.environments.forEach(it => {
                it.domInstanceContent.style.display = "none"
                it.domInstanceHeader.classList.remove("sapMTabStripItemSelected")
                it.active = false
            })
            this.environments[0].domInstanceContent.style.display = "none"
            this.environments[0].domInstanceHeader.classList.remove("sapMTabStripItemSelected")
            this.environments[0].active = true
        }
    }

    removeEnvironment(environment) {
        this.environments.splice(this.environments.indexOf(environment), 1)
        environment.domInstanceHeader.remove()
        environment.domInstanceContent.remove()
    }
}

class EnvironmentTab extends SettingsDialogTab {
    valid = false
    domInstanceTabList
    domInstanceAddTabButton
    environment
    tenants = []

    commonSettingsTab

    ownerIconUrlInput

    constructor(root, environment, isNew = false, canClose = true, canEdit = true) {
        super(root)
        this.valid = isNew !== true
        this.environment = environment
        if (environment != null) {
            this.tenants = this.environment.tenants.map(it => new TenantTab(this, it, isNew, canClose, canEdit))
            this.stripId = environment.owner
            if (getTenantOwner() == environment.owner) {
                this.active = true
            }
        } else {
            this.stripId = "New Environment"
        }
        this.domInstanceHeader = createElementFrom(`
            <div class="sapMTabStripItem" tabindex="-1">
                <div class="sapMTSTexts">
                    <div class="sapMTabStripItemAddText"></div>
                    <div class="sapMTabStripItemLabel">
                        ${environment?.owner ?? this.stripId}
                    </div>
                </div>
                ${canClose ? `<div class="sapMTSItemCloseBtnCnt">
                    <button tabindex="-1" title="Close" class="sapMBtnBase sapMBtn sapMTabStripSelectListItemCloseBtn">
                        <span class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnIconFirst sapMBtnTransparent">
                            <span data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapMBtnCustomIcon sapMBtnIcon sapMBtnIconLeft twineCloseMarker" style="font-family: SAP-icons;"></span>
                        </span>
                        <span class="sapUiInvisibleText">Close</span>
                    </button>
                </div>` : ""}
            </div>
        `)
        this.domInstanceHeader.addEventListener("click", (e) => {
            if (e.target.classList.contains("twineCloseMarker")) {
                this.close()
            } else {
                this.select()
            }
        })
        this.domInstanceContent = createElementFrom(`
            <div class="sapMTabContainerContent sapMTabContainerContentList">
                <div class="sapMTabContainerInnerContent disableScrollbars" style="padding: 0">
                    <div class="sapMTabContainer sapUiResponsiveContentPadding sapUiResponsivePadding--header">
                        <div class="sapMTabStripContainer sapUi-Std-PaddingXL" style="border-top: 2px solid #22354844">
                            <div class="sapMTabStrip sapContrastPlus">
                                <div class="sapMTSLeftOverflowButtons"></div>
                                <div class="sapMTSTabsContainer sapUiScrollDelegate disableScrollbars" tabindex="0" style="overflow: hidden;">
                                    <div class="sapMTSTabs"></div>
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
                                    ${canEdit ? `<button title="Add Tenant" class="sapMBtnBase sapMBtn sapMTSAddNewTabBtn">
                                        <span class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnIconFirst sapMBtnTransparent">
                                            <span data-sap-ui-icon-content=""
                                                  class="sapUiIcon sapUiIconMirrorInRTL sapMBtnCustomIcon sapMBtnIcon sapMBtnIconLeft"
                                                  style="font-family: SAP-icons;"></span>
                                        </span>
                                        <span class="sapUiInvisibleText">Add Tenant</span>
                                    </button>`: ""}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `)
        this.domInstanceTabList = this.domInstanceContent.querySelector("div > div > div > div > div:nth-of-type(2) > div")

        this.commonSettingsTab = new EnvironmentHeaderTab(this, this.environment, false, false, canEdit)
        this.domInstanceTabList.appendChild(this.commonSettingsTab.domInstanceHeader)
        this.tenants.forEach(it => this.domInstanceTabList.appendChild(it.domInstanceHeader))

        this.domInstanceContainer = this.domInstanceContent.querySelector("div > div > div")
        this.domInstanceContainer.appendChild(this.commonSettingsTab.domInstanceContent)
        this.tenants.forEach(it => this.domInstanceContainer.appendChild(it.domInstanceContent))

        this.domInstanceAddTabButton = this.domInstanceContent.querySelector("div > div > div > div > div:nth-of-type(4) > button")
        if (canEdit) {
            this.domInstanceAddTabButton.addEventListener("click", (e) => {
                this.addTab(e)
            })
        }
        /* UNMODIFIED TAB CONTENT EXAMPLE
        this.domInstanceHeader = createElementFrom(`
            <div class="sapMTabStripItem sapMTabStripItemSelected" tabindex="-1">
                <div class="sapMTSTexts">
                    <div class="sapMTabStripItemAddText"></div>
                    <div class="sapMTabStripItemLabel">Development</div>
                </div>
            </div>
        `)*/
    }

    addTab(e) {
        if (this.tenants.every(it => {
            return it.isValid()
        })) {
            let newTab = this.tenants.push(new TenantTab(this, null, true))
            this.domInstanceTabList.appendChild(this.tenants[newTab - 1].domInstanceHeader)
            this.domInstanceContainer.appendChild(this.tenants[newTab - 1].domInstanceContent)
            this.tenants[newTab - 1].select()
        } else {
            createToast({message: "Please enter a valid configuration for all other tenants first"})
        }
    }

    renameContainer(newName) {
        this.domInstanceHeader.querySelector("div > div:nth-of-type(2)").innerText = newName
        this.stripId = newName
    }

    getDataset() {
        let headerInfo = this.commonSettingsTab.getDataset()
        let environment = {
            owner: headerInfo.owner,
            logo: headerInfo.logo,
            tenants: []
        }
        this.tenants.forEach(it => {
            environment.tenants.push(it.getDataset())
        })
        return environment
    }

    switchTab(stripId) {
        if (stripId === "COMMON_ENVIRONMENT_SETTINGS") {
            this.commonSettingsTab.domInstanceContent.style.display = "block"
            this.commonSettingsTab.domInstanceHeader.classList.add("sapMTabStripItemSelected")
            this.tenants.forEach(it => {
                it.domInstanceContent.style.display = "none"
                it.domInstanceHeader.classList.remove("sapMTabStripItemSelected")
                it.active = false
            })
        } else {
            this.commonSettingsTab.domInstanceContent.style.display = "none"
            this.commonSettingsTab.domInstanceHeader.classList.remove("sapMTabStripItemSelected")
            this.tenants.forEach(it => {
                if (it.stripId == stripId) {
                    it.domInstanceContent.style.display = "block"
                    it.domInstanceHeader.classList.add("sapMTabStripItemSelected")
                } else {
                    it.domInstanceContent.style.display = "none"
                    it.domInstanceHeader.classList.remove("sapMTabStripItemSelected")
                }
            })
        }
    }

    isValid() {
        return this.tenants.every(it => it.isValid()) &&
            this.commonSettingsTab.getDataset().owner.length > 0 &&
            this.commonSettingsTab.getDataset().owner != "New Environment"
    }

    removeTenant(tenant) {
        this.tenants.splice(this.tenants.indexOf(tenant), 1)
        tenant.domInstanceHeader.remove()
        tenant.domInstanceContent.remove()
    }

    close() {
        let dialog = createConfirmDialog({
            actionTitle: "Confirm",
            actionText: `Do you want to delete this environment and all associated tenants?`,
            confirm: {
                id: `__twine_delete_environment_confirm`,
                title: "Delete",
                type: "NEGATIVE",
                onBar: true
            },
            cancel: {id: `__twine_delete_environment_cancel`, title: "Cancel", onBar: true}
        }, (e) => {
            this.root.removeEnvironment(this)
            dialog.remove()
            popoverLayerBlocker.style.zIndex = "64"
        },(e) => {
            dialog.remove()
            popoverLayerBlocker.style.zIndex = "64"
        })
        popoverLayer.insertAdjacentElement("beforeend", dialog)

        popoverLayerBlocker.style.zIndex = "69"
    }
}

class EnvironmentHeaderTab extends SettingsDialogTab {
    valid = false


    constructor(root, environment, isNew = false, canClose = true, canEdit = true) {
        super(root)
        this.valid = !isNew
        this.stripId = "COMMON_ENVIRONMENT_SETTINGS"
        this.domInstanceHeader = createElementFrom(`
            <div class="sapMTabStripItem" tabindex="-1">
                <div class="sapMTSTexts">
                    <div class="sapMTabStripItemAddText"></div>
                    <div class="sapMTabStripItemLabel">
                        Common Settings
                        <span class="sapMTabStripItemModifiedSymbol"></span>
                    </div>
                </div>
            </div>
        `)
        this.domInstanceHeader.addEventListener("click", () => {
            this.select();
        })
        this.domInstanceHeader.classList.add("sapMTabStripItemSelected")
        this.domInstanceContent = createElementFrom(`
            <div class="sapMTabContainerContent sapMTabContainerContentList">
                <div class="sapMTabContainerInnerContent disableScrollbars">
                    <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                        <span class="sapMLabelTextWrapper">
                            <bdi style="font-weight: bold">General</bdi>
                        </span>
                        <span data-colon=":" class="sapMLabelColonAndRequired"></span>
                    </span>
                    <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription"
                         style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                        <div class="sapMInputDescriptionWrapper" style="width: 150px;">
                            <span class="sapMInputDescriptionText" style="padding-right: 0.5rem">Owner</span>
                        </div>
                        <div class="sapMInputBaseContentWrapper">
                            <input type="text" autocomplete="off" class="sapMInputBaseInner ${canEdit ? "" : "sapMInputBaseDisabled "}"
                                   placeholder="Owner" value="${environment?.owner ?? "New Environment"}" ${canEdit ? "" : "disabled"}>
                        </div>
                    </div>
                    <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription"
                         style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                        <div class="sapMInputDescriptionWrapper" style="width: 150px;">
                            <span class="sapMInputDescriptionText" style="padding-right: 0.5rem">Logo</span>
                        </div>
                        <div class="sapMInputBaseContentWrapper" style="">
                            <input type="text" autocomplete="off" class="sapMInputBaseInner ${canEdit ? "" : "sapMInputBaseDisabled "}" placeholder="URL or Base64 Data" value="${environment?.logo ?? ""}" ${canEdit ? "" : "disabled"}>
                        </div>
                    </div>
                    <div class="sapMFlexItemAlignAuto sapMFlexBoxBGTransparent sapMFlexItem" style="order: 0; flex: 0 1 auto; min-height: auto; min-width: auto;">
                        <img src="${environment?.logo ?? sapLogoSvgData}" ${environment?.logo ? `data-src="${environment.logo}"` : "" } alt="" class="sapMImg" style="width: 7em; height: 3em; padding: 0 8px">
                    </div>
                </div>
            </div>
        `)

        this.domInstanceContent.querySelectorAll("div > div > div > input").item(0).addEventListener("input", e => {
            this.root.renameContainer(e.target.value)
        })

        this.domInstanceContent.querySelectorAll("div > div > div > input").item(1).addEventListener("paste", e => {
            let newValue = e.clipboardData.getData("text")
            switch (true) {
                case newValue.startsWith("https://"):
                case newValue.startsWith("data:image"):
                    break
                case newValue.startsWith("svg+xml;base64"):
                    newValue = "data:image/" + newValue
                    break
                case newValue != "" && /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/.test(newValue):
                    newValue = "data:image/svg+xml;base64," + newValue
                    break
                default:
                    newValue = sapLogoSvgData
                    break
            }
            this.domInstanceContent.querySelector("div > div > img").src = newValue
            this.domInstanceContent.querySelector("div > div > img").srcset = newValue
            this.domInstanceContent.querySelector("div > div > img").dataset.src = newValue
            e.target.dispatchEvent(new Event('input'))
        })
    }

    getDataset() {
        return {
            logo: this.domInstanceContent.querySelectorAll("div > div > img").item(0).dataset.src,
            owner: this.domInstanceContent.querySelectorAll("div > div > div > input").item(0).value
        }
    }
}

class TenantTab extends SettingsDialogTab {
    valid = false
    tenant
    tagInput
    colorInput
    idInput
    systemInput
    datacenterInput
    errorToleranceInput

    constructor(root, tenant, isNew = false, canClose = true, canEdit = true) {
        super(root)
        this.tenant = tenant
        if (tenant != null) {
            this.stripId = tenant.id ?? tenant.name
            this.valid = !isNew
        } else {
            this.stripId = "New Tenant"
        }
        this.domInstanceHeader = createElementFrom(`
            <div class="sapMTabStripItem" tabindex="-1">
                <div class="sapMTSTexts">
                    <div class="sapMTabStripItemAddText"></div>
                    <div class="sapMTabStripItemLabel">
                        ${tenant?.name ?? this.stripId}
                    </div>
                </div>
                ${canClose ? `<div class="sapMTSItemCloseBtnCnt">
                    <button tabindex="-1" title="Close" class="sapMBtnBase sapMBtn sapMTabStripSelectListItemCloseBtn">
                        <span class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnIconFirst sapMBtnTransparent">
                            <span data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapMBtnCustomIcon sapMBtnIcon sapMBtnIconLeft twineCloseMarker" style="font-family: SAP-icons;"></span>
                        </span>
                        <span class="sapUiInvisibleText">Close</span>
                    </button>
                </div>` : ""}
            </div>
        `)
        this.domInstanceHeader.addEventListener("click", (e) => {
            if (e.target.classList.contains("twineCloseMarker")) {
                this.close()
            } else {
                this.select()
            }
        })
        this.domInstanceContent = createElementFrom(`
            <div class="sapMTabContainerContent sapMTabContainerContentList">
                <div class="sapMTabContainerInnerContent disableScrollbars">
                    <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                        <span class="sapMLabelTextWrapper">
                            <bdi style="font-weight: bold">Stage Settings:</bdi>
                        </span>
                        <span data-colon=":" class="sapMLabelColonAndRequired"></span>
                    </span>
                    <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription"
                         style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                        <div class="sapMInputDescriptionWrapper" style="width: 150px;">
                            <span class="sapMInputDescriptionText" style="padding-right: 0.5rem;">Tag</span>
                        </div>
                        <div class="sapMInputBaseContentWrapper">
                            <input type="text" autocomplete="off" class="sapMInputBaseInner ${canEdit ? "" : "sapMInputBaseDisabled "}"
                                   placeholder="E.g. DEV, Production etc." value="${tenant?.name ?? "New Tenant"}" ${canEdit ? "" : "disabled"}>
                        </div>
                    </div>
                    <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription"
                         style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                        <div class="sapMInputDescriptionWrapper" style="width: 150px">
                            <span class="sapMInputDescriptionText">Color</span>
                        </div>
                        <div class="sapMInputBaseContentWrapper">
                            <input type="color" value="${tryCoerceColor(tenant?.color)}" style="width:100%;">
                        </div>
                    </div>
                    ${new SimpleComboBox(tenant?.errorTolerance ?? 0).domInstance.outerHTML}
                    <br>
                    
                    <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                        <span class="sapMLabelTextWrapper">
                            <bdi style="font-weight: bold">Tenant URL:</bdi>
                        </span>
                        <span data-colon=":" class="sapMLabelColonAndRequired"></span>
                    </span>
                    <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription"
                         style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                        <div class="sapMInputDescriptionWrapper" style="">
                            <span class="sapMInputDescriptionText" style="padding-right: 0.5rem;"><b>https://</b></span>
                        </div>
                        <div class="sapMInputBaseContentWrapper" style="">
                            <input type="text" autocomplete="off" class="sapMInputBaseInner ${canEdit ? "" : "sapMInputBaseDisabled "}" placeholder="Tenant (or URL)" value="${tenant?.id ?? ""}" ${canEdit ? "" : "disabled"}>
                        </div>
                        <div class="sapMInputDescriptionWrapper" style="">
                            <span class="sapMInputDescriptionText" style="padding-right: 0.5rem;">
                                <b>.integrationsuite</b>
                            </span>
                        </div>
                        <div class="sapMInputBaseContentWrapper" style="">
                            <input type="text" autocomplete="off" class="sapMInputBaseInner ${canEdit ? "" : "sapMInputBaseDisabled "}" placeholder="System (or URL)" value="${tenant?.system ?? ""}" ${canEdit ? "" : "disabled"}>
                        </div>
                        <div class="sapMInputDescriptionWrapper" style="">
                            <span class="sapMInputDescriptionText" style="padding-right: 0.5rem;">
                                <b>.cfapps.</b>
                            </span>
                        </div>
                        <div class="sapMInputBaseContentWrapper" style="">
                            <input type="text" autocomplete="off" class="sapMInputBaseInner ${canEdit ? "" : "sapMInputBaseDisabled "}" placeholder="Datacenter (or URL)" value="${tenant?.datacenter ?? ""}" ${canEdit ? "" : "disabled"}>
                        </div>
                        <div class="sapMInputDescriptionWrapper" style="">
                            <span class="sapMInputDescriptionText"><b>.hana.ondemand.com</b></span>
                        </div>
                    </div>
                </div>
            </div>
        `)
        this.domInstanceContent.style.display = "none"
        let inputs = this.domInstanceContent.querySelectorAll("input, select")

        this.idInput = inputs[3]
        this.colorInput = inputs[1]
        this.errorToleranceInput = inputs[2]
        this.tagInput = inputs[0]
        this.systemInput = inputs[4]
        this.datacenterInput = inputs[5]

        this.tagInput.addEventListener("input", e => {
            this.domInstanceHeader.querySelector("div > div:nth-of-type(2)").innerText = e.target.value
            this.stripId = e.target.value
        })

        this.idInput.addEventListener("input", e => { this.updateIDs(e) })
        this.systemInput.addEventListener("input", e => { this.updateIDs(e) })
        this.datacenterInput.addEventListener("input", e => { this.updateIDs(e) })
    }

    updateIDs(e) {
        if (e.target.value.startsWith("https://")) {
            try {
                let id = e.target.value.split(".integrationsuite")[0].split("://")[1]
                let system = e.target.value.split(".integrationsuite")[1].split(".cfapps")[0]
                let datacenter = e.target.value.split(".hana.ondemand")[0].split("cfapps.")[1]
                if (id == null || datacenter == null || system == null || id.startsWith("https://") || datacenter.startsWith("https://") || system.startsWith("https://") || /\.\//.test(id) || /\.\//.test(datacenter) || /\.\//.test(system)) {
                    createToast({message: "You need to paste a URL like the one you are at right now"})
                    throw new Error()
                }
                this.stripId = id
                this.idInput.value = id
                this.systemInput.value = system
                this.datacenterInput.value = datacenter
            } catch(exception) {
                e.target.value = ""
            }
        }
    }

    getDataset() {
        return {
            id: this.idInput.value,
            system: this.systemInput.value ?? "",
            datacenter: this.datacenterInput.value,
            errorTolerance: parseInt(this.errorToleranceInput.value),
            name: this.tagInput.value,
            color: this.colorInput.value
        }
    }

    isValid() {
        return this.idInput.value.length > 0 &&
            (this.datacenterInput.value.length == 4 || this.datacenterInput.value.length == 8) &&
            this.tagInput.value.length > 0 &&
            this.tagInput.value != "New Tenant"
    }

    close() {
        let dialog = createConfirmDialog({
            actionTitle: "Confirm",
            actionText: `Do you want to delete this tenant?`,
            confirm: {
                id: `__twine_delete_tenant_confirm`,
                title: "Delete",
                type: "NEGATIVE",
                onBar: true
            },
            cancel: {id: `__twine_delete_tenant_cancel`, title: "Cancel", onBar: true}
        }, (e) => {
            this.root.removeTenant(this)
            dialog.remove()
            popoverLayerBlocker.style.zIndex = "64"
        },(e) => {
            dialog.remove()
            popoverLayerBlocker.style.zIndex = "64"
        })
        popoverLayer.insertAdjacentElement("beforeend", dialog)

        popoverLayerBlocker.style.zIndex = "69"
    }
}

let sapLogoSvgData = String.raw`data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgNDEyLjM4IDIwNCI+PGRlZnM+PHN0eWxlPi5jbHMtMSwuY2xzLTJ7ZmlsbC1ydWxlOmV2ZW5vZGQ7fS5jbHMtMXtmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50KTt9LmNscy0ye2ZpbGw6I2ZmZjt9PC9zdHlsZT48bGluZWFyR3JhZGllbnQgaWQ9ImxpbmVhci1ncmFkaWVudCIgeDE9IjIwNi4xOSIgeDI9IjIwNi4xOSIgeTI9IjIwNCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzAwYjhmMSIvPjxzdG9wIG9mZnNldD0iMC4wMiIgc3RvcC1jb2xvcj0iIzAxYjZmMCIvPjxzdG9wIG9mZnNldD0iMC4zMSIgc3RvcC1jb2xvcj0iIzBkOTBkOSIvPjxzdG9wIG9mZnNldD0iMC41OCIgc3RvcC1jb2xvcj0iIzE3NzVjOCIvPjxzdG9wIG9mZnNldD0iMC44MiIgc3RvcC1jb2xvcj0iIzFjNjViZiIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzFlNWZiYiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjx0aXRsZT5TQVBfZ3JhZF9SX3Njcm5fWmVpY2hlbmZsw6RjaGUgMTwvdGl0bGU+PHBvbHlsaW5lIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSIwIDIwNCAyMDguNDEgMjA0IDQxMi4zOCAwIDAgMCAwIDIwNCIvPjxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTI0NC43MywzOC4zNmwtNDAuNiwwdjk2LjUyTDE2OC42NywzOC4zM0gxMzMuNTFsLTMwLjI3LDgwLjcyQzEwMCw5OC43LDc5LDkxLjY3LDYyLjQsODYuNCw1MS40Niw4Mi44OSwzOS44NSw3Ny43Miw0MCw3MmMuMDktNC42OCw2LjIzLTksMTguMzgtOC4zOCw4LjE3LjQzLDE1LjM3LDEuMDksMjkuNzEsOGwxNC4xLTI0LjU1Qzg5LjA2LDQwLjQyLDcxLDM2LjIxLDU2LjE3LDM2LjE5aC0uMDljLTE3LjI4LDAtMzEuNjgsNS42LTQwLjYsMTQuODNBMzQuMjMsMzQuMjMsMCwwLDAsNS43Nyw3NC43QzUuNTQsODcuMTUsMTAuMTEsOTYsMTkuNzEsMTAzYzguMSw1Ljk0LDE4LjQ2LDkuNzksMjcuNiwxMi42MiwxMS4yNywzLjQ5LDIwLjQ3LDYuNTMsMjAuMzYsMTNBOS41Nyw5LjU3LDAsMCwxLDY1LDEzNWMtMi44MSwyLjktNy4xMyw0LTEzLjA5LDQuMS0xMS40OS4yNC0yMC0xLjU2LTMzLjYxLTkuNTlMNS43NywxNTQuNDJhOTMuNzcsOTMuNzcsMCwwLDAsNDYsMTIuMjJsMi4xMSwwYzE0LjI0LS4yNSwyNS43NC00LjMxLDM0LjkyLTExLjcxLjUzLS40MSwxLS44NCwxLjQ5LTEuMjhMODYuMTcsMTY0LjVIMTIzbDYuMTktMTguODJhNjcuNDYsNjcuNDYsMCwwLDAsMjEuNjgsMy40Myw2OC4zMyw2OC4zMywwLDAsMCwyMS4xNi0zLjI1bDYsMTguNjRoNjAuMTR2LTM5aDEzLjExYzMxLjcxLDAsNTAuNDYtMTYuMTUsNTAuNDYtNDMuMkMzMDEuNzQsNTIuMTksMjgzLjUyLDM4LjM2LDI0NC43MywzOC4zNlpNMTUwLjkxLDEyMWEzNi45MywzNi45MywwLDAsMS0xMy0yLjI4bDEyLjg3LTQwLjU5SDE1MWwxMi42NSw0MC43MUEzOC41LDM4LjUsMCwwLDEsMTUwLjkxLDEyMVptOTYuMi0yMy4zM2gtOC45NFY2NC45MWg4Ljk0YzExLjkzLDAsMjEuNDQsNCwyMS40NCwxNi4xNCwwLDEyLjYtOS41MSwxNi41Ny0yMS40NCwxNi41NyIvPjwvc3ZnPg==`
function compareVersion(version, oldVersion) {
    if (version == oldVersion) return 0
    if (version == null) return -1
    else if (oldVersion == null) return 1

    let parts = version.split(".").map(it => parseInt(it))
    let oldParts = oldVersion.split(".").map(it => parseInt(it))

    let year = parts[0] > oldParts[0] ? 1 : parts[0] === oldParts[0] ? 0 : -1
    let month = parts[1] > oldParts[1] ? 1 : parts[1] === oldParts[1] ? 0 : -1
    let day = parts[2] > oldParts[2] ? 1 : parts[2] === oldParts[2] ? 0 : -1
    let id = parts[3] ?? 0 > oldParts[3] ?? 0 ? 1 : parts[3] ?? 0 === oldParts[3] ?? 0 ? 0 : -1

    return year > 0 ? 1 : year < 0 ? -1 : month > 0 ? 1 : month < 0 ? -1 : day > 0 ? 1 : day < 0 ? -1 : id > 0 ? 1 : id < 0 ? -1 : 0
}

const getDifference = (a, b) => Object.entries(a).reduce((ac, [k, v]) => b[k] && b[k] !== v ? (ac[k] = b[k], ac) : ac, {});

function openLinkInNewTab(url) {
    chrome.runtime.sendMessage({
        type: "OPEN_IN_TAB",
        url: url
    }).then(response => {

    }).catch(error => {

    })
}

/*
Regex for UI5 Component Cleaning => aria-.*?=".+?"\s?|id=".*?"\s?|role=".*?"\s?|data-sap-(?!ui-icon-content).*?=".*?"\s?|data-ui-accesskey=".*?"\s?
*/