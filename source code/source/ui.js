const BLOCKER = Object.freeze({
    DEFAULT: 38,
    ABOVE_SAP_DIALOG: 41,
    ABOVE_TWINE_DIALOG: 68,
    AOT: 100
});

function setBlockerZIndex(index) {
    popoverLayerBlocker.style.zIndex = index.toString()
}


function createFixedListItem(parameters) {
    let flItem = createElementFrom(`
        <li id="__twine_FooterListElement_${parameters.id}" class="elementFadeIn noSelect alwaysOnTop">
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
                openLinkInNewTab(parameters.url)
                /*chrome.runtime.sendMessage({
                    type: "OPEN_IN_TAB",
                    url: prependHost(parameters.url)
                })*/
            } else if (event.button == getMouseAction("fixedItem", 0)) {
                window.location.replace(prependHost(parameters.url))
            } else {
                clipBoardCopy(prependHost(parameters.url))
            }
            return false
        })
    }

    return flItem
}

function createToast(content, toastifyConfig = {}) {
    toastifyConfig.node = createElementFrom(`<div>${content}</div>`)
    toastifyConfig.duration = toastifyConfig.duration ?? getTextDuration(toastifyConfig.node.innerText, 2000)
    toastifyConfig.style = Object.assign({}, {
        display: "flex",
        flexDirection: "row-reverse",
        maxHeight: "90%",
        "overflow-y": "scroll"
    }, toastifyConfig.style)
    toastifyConfig.selector = twineStatic
    toastifyConfig.gravity = toastifyConfig.gravity ?? "bottom"
    toastifyConfig.position = toastifyConfig.position ?? "center"
    toastifyConfig.className = toastifyConfig.className ? toastifyConfig.className + " disableScrollbars" : "twineDefault disableScrollbars"
    toastifyConfig.stopOnFocus = toastifyConfig.stopOnFocus ?? true
    let callback = toastifyConfig.onClick
    delete toastifyConfig.onClick
    let toast = Toastify(toastifyConfig)
    toast.options.onClick = () => {
        callback?.()
        toast.hideToast()
    }
    toast.showToast()
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
            createToast("<b>Copied</b>")
            this.blur()
        })
        .catch(e => {
            console.error(e)
            createToast("<b>Couldn't copy to clipboard</b>", {className: "twineReject"})
        })
}

function clipBoardCopyRich(data) {
    navigator.clipboard.write(data)
        .then(() => {
            createToast("<b>Copied</b>")
            this.blur()
        })
        .catch(e => {
            console.error(e)
            createToast("<b>Couldn't copy to clipboard</b>", {className: "twineReject"})
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
            <li>
                <div class="sapMFlexItemAlignAuto sapMFlexBoxBGTransparent sapMFlexItem" style="order: 0; flex: 1 1 auto; min-height: auto; min-width: auto;">
                    <div class="sapMList" style="width: 100%;">
                        <div tabIndex="-1" class="sapMListDummyArea"></div>
                        <ul tabIndex="0" class="sapMListItems sapMListUl sapMListShowSeparatorsAll sapMListModeNone"></ul>
                        <div class="sapMBusyIndicator" style="display: none"><span tabindex="0" class="sapUiBlockLayerTabbable"></span><div class="sapMBusyIndicatorBusyArea sapUiLocalBusy" style="position: relative;"><div class="sapUiBlockLayer  sapUiLocalBusyIndicator sapUiLocalBusyIndicatorSizeMedium sapUiLocalBusyIndicatorFade" alt="" tabindex="0" title="Please wait"><div class="sapUiLocalBusyIndicatorAnimation sapUiLocalBusyIndicatorAnimStandard"><div></div><div></div><div></div></div></div></div><span tabindex="0" class="sapUiBlockLayerTabbable"></span></div>
                        <div tabIndex="0" class="sapMListDummyArea sapMListDummyAreaSticky"></div>
                    </div>
                </div>
            </li>
        `)
        this.domInstanceListReference = this.domInstance.querySelector("li > div > div > ul")
        this.domInstanceBusyIndicatorReference = this.domInstance.querySelector("li > div > div > div:nth-of-type(2)")
        this.domInstanceBusyIndicatorTextReference = this.domInstance.querySelector("li > div > div > div:nth-of-type(2) > span:nth-of-type(2)")
        this.domInstance.addEventListener("contextmenu", e => preventDefaultAction(e))
        this.addTrunks(trunks)
    }

    addTrunks(trunks) {
        if (trunks?.length > 0) {
            try {
                let additions = trunks.map(it => {
                    return new Trunk(this.domInstanceListReference, it.title, it.meta, null, it.children, it.id, it.age)
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
    age
    searchArtifact
    childArtifacts
    open = false
    icon = ""
    id

    constructor(listReference, title, meta, root, children, id, age) {
        super(meta)
        this.id = id
        this.age = age
        this.icon = getTypeConversion("type", "symbol", this.meta.twineContextType)
        this.domInstance = createElementFrom(`
            <li tabIndex="-1" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBFocusable sapMTreeItemBase sapMSTI __twineArtifact-show alwaysOnTop" style="padding-right: 0; margin-bottom: 0.25rem; border-radius: 0.5em; display: flex">
                <span data-sap-ui-icon-content="${this.icon}" class="sapUiIcon sapUiIconMirrorInRTL sapUiIconPointer sapMTreeItemBaseExpander" style="font-size: 0.875rem; font-family: SAP-icons; font-weight: bold"></span>
                <div class="sapMLIBContent">
                    <strong>${title}</strong>
                    ${this.age === null ? "" : `<span data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapUiIconPointer sapMTreeItemBaseExpander" style="font-family: SAP-icons;font-weight: bold;display: block;"></span>`}
                </div>
                
                <span data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapUiIconPointer sapMTreeItemBaseExpander" style="font-size: 0.875rem; font-family: SAP-icons; font-weight: bold"></span>
            </li>
        `)
        integrationContent[id].handle = this.domInstance.querySelector("div > span")
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
            this.showArtifactInfo(event)
        } else {
            //todo: ಠ_ಠ
            if (this.age < integrationContent[this.id].lastTimestamp) {
                let openState = this.open
                let id = this.id
                rebuildTree(id)
                if (!openState) {
                    integrationContent[id].tree.children[0].toggle()
                }
            } else {
                this.toggle()
            }
        }
    }

    toggle(state) {
        this.open = state ?? !this.open
        if (this.open) {
            this.searchArtifact.domInstance.classList.add("__twineArtifact-show")
            this.searchArtifact.domInstance.querySelector("input").focus()
        } else {
            this.searchArtifact.domInstance.classList.remove("__twineArtifact-show")
        }
        this.domInstance.querySelector(":scope > span:last-of-type").setAttribute("data-sap-ui-icon-content", this.open ? "" : "")
        this.childArtifacts?.forEach(it => {
            it.domInstance.classList.toggle("__twineArtifact-show")
            it.childArtifacts?.forEach(it => {
                it.hide()
            })
        })
        if (this.open) {
            this.searchArtifact.domInstance.querySelector("input").focus
        }
    }

    search(phrase, inputElement) {
        this.childArtifacts.forEach(it => it.search(phrase, inputElement))
    }

    showArtifactInfo(e) {
        displayedArtifactDetails = {
            name: this.meta.twineContextType,
            /*name: this.meta.artifactName,
            id: this.meta.artifactId,
            host: window.location.host,
            reference: webUrl,
            products: this.meta.artifactProducts ?? {},
            industries: this.meta.artifactIndustries ?? {},
            linesOfBusiness: this.meta.artifactLoB ?? {},
            keywords: this.meta.artifactKeywords ?? {},
            description: this.meta.shortText,*/
            artifacts: integrationContent[this.id].content
        }
        radialMenuDetailDisplay = createElementFrom(`<div id="__twine-radialMenuDetailDisplay">
            <table style="border-collapse: collapse; width: 100%">
                <tbody/>
            </table>
        </div>`)
        radialMenuDetailDisplay.addEventListener("mouseleave", () => {
            radialMenuDetailDisplay.remove()
        })
        radialMenuDetailDisplay.addEventListener("contextmenu", e => {
            e.preventDefault();
            e.stopPropagation();
            return false
        })
        let table = radialMenuDetailDisplay.querySelector("tbody")
        let copyAll = createElementFrom("<td colspan='2' style='text-align: center'>📄 <strong>Click to copy all details</strong></td>")
        copyAll.addEventListener("click", e => {
            clipBoardCopy(JSON.stringify(displayedArtifactDetails, null, 7))
        })
        table.append(copyAll)
        //radialMenuDetailDisplay.querySelector("tbody")?.appendChild(tr)


        radialMenuDetailDisplay.style.top = `${e.y - 25}px`;
        radialMenuDetailDisplay.style.left = `${e.x - 25}px`;
        radialMenuDetailDisplay.style.display = "block";
        radialMenuDetailDisplay.style.position = "absolute"
        radialMenuDetailDisplay.style.padding = "25px"
        radialMenuDetailDisplay.style.zIndex = "70"
        radialMenuDetailDisplay.style.borderRadius = "25px"
        radialMenuDetailDisplay.className = "radialMenuDetailDisplay"
        radialMenuDetailDisplay.style.borderWidth = "1px"
        popoverLayer.appendChild(radialMenuDetailDisplay)
        RadialMenu?.instance?.domInstance?.remove()
    }
}

class TreeSearch extends TreeItem {
    root
    domInstanceSearchReference

    constructor(meta, root) {
        super(meta);
        this.root = root
        this.domInstance = createElementFrom(`
            <li class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBFocusable sapMTreeItemBase sapMSTI" style="padding-right: 0; border-bottom: none; background: #0000; margin-left: 1rem; display: none;">
                <form class="sapMSFF">
                    <input tabindex="0" type="search" autocomplete="off" placeholder="Search" value="" class="sapMSFI">
                    <span id="__button111110-tooltip" class="sapUiInvisibleText">bar-code</span>
                    <div class="sapMSFS sapMSFB"></div>
                </form>
            </li>
        `)
        this.domInstanceSearchReference = this.domInstance.querySelector("li > form > input")
        this.domInstanceSearchReference.addEventListener("input", (event) => {
            this._startSearch(event)
        })
        this.domInstance.addEventListener("keydown", event => {
            if (event.key === "Backspace" || event.key === "Delete") {
                this._startSearch(event)
            }
        })
    }

    _startSearch(event) {
        let runStart = window.performance.now()
        this.root.search(this._getSearchValue(event.target.value), event.target.parentElement)
        elapsedTime += window.performance.now() - runStart
    }

    _getSearchValue(value) {
        return value.startsWith(":")
            ? value
            : value.replaceAll(/[\s_\-()\[\]]|(?<!^):/g, "").toLowerCase();
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
        this.icon = meta.twineContextType === "designtimeArtifacts" || meta.twineContext === "TREE_ROOT" ? "" : getTypeConversion("type", "symbol", meta?.twineContextType)
        this.domInstance = createElementFrom(`
            <li tabIndex="-1" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBFocusable sapMTreeItemBase sapMSTI ${level === 0 ? "__twineArtifact-show" : ""}" style="margin-bottom: 0.25rem; border-radius: 0.5em; margin-left: ${`${level * 1}rem`}; display: ${level === 0 ? "flex" : "none"}">
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
        if (getMouseAction("directory", event.button) == 0) {
            this.toggle()
        } else if (getMouseAction("directory", event.button) == 2) {
            this.showArtifactInfo(event)
        } else {
            let menuItems = this.getRadialItems(event).filter(it => it)
            new RadialMenu()
                .withItems(menuItems, event)
                .show(event)
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
                    mouse: 0,
                    id: "monitoringInTab",
                    icon: "",
                    title: "Open Monitoring",
                    callback: () => {
                        window.location.assign(`/shell/monitoring/Messages/{"status":"ALL","packageId":"${this.meta.packageId}","type":"ALL","time":"PASTHOUR","useAdvancedFields":false}`)
                    }
                }, {
                    mouse: 2,
                    id: "monitoringNewTab",
                    icon: "",
                    title: "Monitoring (New Tab)",
                    callback: () => {
                        chrome.runtime.sendMessage({
                            type: "OPEN_IN_TAB",
                            url: "https://" + window.location.host + `/shell/monitoring/Messages/{"status":"ALL","packageId":"${this.meta.packageId}","type":"ALL","time":"PASTHOUR","useAdvancedFields":false}"}`
                        })
                    }
                }]
            },
            {
                radialIndex: 1,
                actionId: "copy",
                actions: [{
                    mouse: 0,
                    id: "copyPackageId",
                    icon: "",
                    title: "Package ID",
                    callback: () => {
                        clipBoardCopy(this.meta.packageId)
                    }
                }, {
                    mouse: 2,
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
                    mouse: 0,
                    id: "openInTab",
                    icon: "",
                    title: "Open",
                    callback: () => {
                        window.location.assign(path)
                    }
                }]
            }, getUnlockAction(this.meta, this.lock)
        ])
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
            if (regexOnly) {
                if (phrase.length > 1) {
                    this.searchCommand("rx", phrase, inputElement)
                } else {
                    this.childArtifacts.forEach(it => it.qualifies(true, true))
                    return this.qualifies(true)
                }
            } else {
                if (this.meta.search?.includes(phrase)) {
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
        }
    }

    searchCommand(command, options, inputElement) {
        switch (command.toLowerCase()) {
            case "tag":
                if (options?.length < 1) return this.qualifies(true)
                let searchTerm = options.toLowerCase()
                if ((this.meta.artifactKeywords.concat(this.meta.artifactProducts, this.meta.artifactIndustries, this.meta.artifactLoB)).some(it => it.includes(searchTerm))) {
                    this.childArtifacts.forEach(it => it.qualifies(true, true))
                    return this.qualifies(true)
                } else {
                    return this.qualifies(false)
                }
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
            case "regex":
            case "rx":
                if (options == null) return this.qualifies(true)
                try {
                    inputElement.classList.remove("sapMInputBaseContentWrapperError")
                    new RegExp(options, "i")
                } catch (error) {
                    inputElement.classList.add("sapMInputBaseContentWrapperError")
                    console.error(error)
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

    showArtifactInfo(e) {
    }

    getChildArtifacts() {
        return (this.childArtifacts.map(it => {
            return ((it instanceof IntermediateBranch) ? it.childArtifacts : (it instanceof Branch) ? it.getChildArtifacts() : it)
        }).flat())
    }
}

class IntegrationBranch extends Branch {
    constructor(listReference, title, meta, level, root, children) {
        super(listReference, title, meta, level, root, children);
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
        this.icon = getTypeConversion("type", "symbol", meta.twineContextType)
        this.domInstance = createElementFrom(`
            <li tabIndex="-1" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBFocusable sapMTreeItemBase sapMSTI ${level === 0 ? "__twineArtifact-show" : ""}" style="margin-bottom: 0.25rem; border-radius: 0.5em; margin-left: ${`${level * 1}rem`}; display: ${level === 0 ? "flex" : "none"}">
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

    showArtifactInfo(e) {
        this.root.showArtifactInfo(e)
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
            <li tabIndex="-1" class="sapMLIB sapMLIB-CTX sapMLIBShowSeparator sapMLIBTypeInactive sapMLIBFocusable sapMTreeItemBase sapMTreeItemBaseLeaf sapMSTI ${level === 0 ? "__twineArtifact-show" : ""}" style="margin-bottom: 0.25rem; border-radius: 0.5em; margin-left: ${`${level * 1}rem`}; display: ${level === 0 ? "flex" : "none"}">
                <span data-sap-ui-icon-content="" class="sapUiIcon sapUiIconMirrorInRTL sapUiIconPointer sapMTreeItemBaseExpander" style="font-family: SAP-icons; font-weight: bold"></span>
                <div class="sapMLIBContent">
                    <b>${title}</b>
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
        if (this.meta.search?.includes(phrase)) {
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
            case "regex":
            case "rx":
                if (options == null) return this.qualifies(true)
                return this.qualifies(new RegExp(String.raw`.*${options}.*`, "i").test(this.meta.search))
        }
    }

    searchRegex(options) {
        if (options == null) return this.qualifies(true)
        return this.qualifies(new RegExp(String.raw`.*${options}.*`, "i").test(this.meta.search))
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
    runtimeMeta

    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        let downloadAction = {
            radialIndex: 6,
            actionId: "download",
            actions: [{
                mouse: 0,
                id: "download",
                icon: "",
                title: "Download",
                callback: async () => {
                    displaySpinner("Getting Artifact")
                    try {
                        let downloadHelper = document.getElementById("__twine-staticElement-Helper-Download")
                        downloadHelper.href = URL.createObjectURL(await getWorkspaceArtifactExplicitDownload(this.root.meta.registryId, this.meta.registryId))
                        downloadHelper.download = this.meta.artifactName + ".zip"
                        downloadHelper.click()
                    } catch (error) {
                        //TODO: Handle exception
                        console.error(error)
                    } finally {
                        hideSpinner()
                    }
                }
            }]
        }
        return super.getRadialItems(e).concat([downloadAction])
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

    showArtifactInfo(e) {
        let webUrl = "/shell/design" + getUrlPath("contentpackage", this.meta.artifactId, this.meta.packageId, getTypeConversion("type", "urlType", this.meta.twineContextType))

        displayedArtifactDetails = {
            type: getTypeConversion("type", "DisplayNameS", this.meta.twineContextType),
            name: this.meta.artifactName,
            id: this.meta.artifactId,
            packageName: this.meta.packageName,
            packageId: this.meta.packageId,
            host: window.location.host,
            reference: webUrl,
            version: this.meta.version,
            description: this.meta.shortText
        }
        radialMenuDetailDisplay = createElementFrom(`<div id="__twine-radialMenuDetailDisplay">
            <table style="border-collapse: collapse; width: 100%">
                <tbody/>
            </table>
        </div>`)
        radialMenuDetailDisplay.addEventListener("mouseleave", () => {
            radialMenuDetailDisplay.remove()
        })
        radialMenuDetailDisplay.addEventListener("contextmenu", e => {
            e.preventDefault();
            e.stopPropagation();
            return false
        })
        let table = radialMenuDetailDisplay.querySelector("tbody")
        let copyAll = createElementFrom("<td colspan='2' style='text-align: center'>📄 <strong>Click to copy all details</strong></td>")
        copyAll.addEventListener("click", e => {
            clipBoardCopy(JSON.stringify(displayedArtifactDetails, null, 7))
        })
        table.append(copyAll)
        let entries = [
            debugFlag ? {key: "Search", value: this.meta.search} : null,
            {key: "Name", value: this.meta.artifactName, copyable: true},
            {key: "ID", value: this.meta.artifactId, copyable: true},
            {key: "Package Name", value: this.meta.packageName, copyable: true},
            {key: "Package ID", value: this.meta.packageId, copyable: true}
        ]
        if (this.runtimeMeta?.deployState) {
            entries.push({
                key: "",
                value: "Runtime info updated at " + new Date(integrationContent.runtimeArtifacts.lastTimestamp).toLocaleTimeString(),
                copyable: false,
                isHint: true
            })
            let statusNote = `Deployed by ${this.runtimeMeta.deployedBy} on ${new Date(Number(this.runtimeMeta.deployedOn.slice(0, -3)) * 1000).toLocaleString()}<br>`
            switch (compareVersion(this.meta.version, this.runtimeMeta.version)) {
                case 0:
                    statusNote += `<br>Version ${this.runtimeMeta.version}, Up to date`
                    break
                case 1:
                    statusNote += `Last modified by ${this.meta.modifiedBy} on ${new Date(Number(this.meta.modifiedAt.slice(6, -5)) * 1000).toLocaleString()}<br><br>Version ${this.runtimeMeta.version} (Designtime: ${this.meta.version})`
                    break
                case -1:
                    statusNote += `<br>Version ${this.runtimeMeta.version} (Designtime: ${this.meta.version}), <span style="color: #b44f00">More recent than Designtime</span>`
                    break
            }
            entries.push({key: "Deployment Status", value: statusNote, copyable: false})
        } else {
            entries.push({key: "Deployment Status", value: "Not Deployed", copyable: false})
        }
        table.append(...Object.entries(entries).filter(it => it != null).map(it => {
            let tr = createElementFrom(`<tr>
                        <td>${it[1].copyable ? "📄" : ""} ${it[1].key}</td>
                        <td>${it[1].value}</td>
                    </tr>`)
            if (it[1].isHint) {
                tr.style.fontSize = "small"
                tr.style.fontStyle = "italic"
                //tr.classList.add("detailDisplayHint")
            }
            if (it[1].copyable) tr.addEventListener("click", e => {
                clipBoardCopy(it[1].value)
            })
            return tr
        }))
        let tr = createElementFrom(`<tr>
                        <td>📄 Direct Link</td>
                        <td><a href="${webUrl}">${this.meta.artifactName}</a></td>
                    </tr>`)
        tr.addEventListener("click", e => {
            if (e.target.tagName != "A")
                clipBoardCopy(window.location.host + webUrl)
        })
        radialMenuDetailDisplay.querySelector("tbody")?.appendChild(tr)


        radialMenuDetailDisplay.style.top = `${e.y - 25}px`;
        radialMenuDetailDisplay.style.left = `${e.x - 25}px`;
        radialMenuDetailDisplay.style.display = "block";
        radialMenuDetailDisplay.style.position = "absolute"
        radialMenuDetailDisplay.style.padding = "25px"
        radialMenuDetailDisplay.style.zIndex = "70"
        radialMenuDetailDisplay.style.borderRadius = "25px"
        radialMenuDetailDisplay.className = "radialMenuDetailDisplay"
        radialMenuDetailDisplay.style.borderWidth = "1px"
        popoverLayer.appendChild(radialMenuDetailDisplay)
        RadialMenu?.instance?.domInstance?.remove()
    }
}

class GenericIntegrationArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getTypeConversion("type", "open", this.meta.twineContextType) ? getRadialOpenAction(this) : null,
            getTypeConversion("type", "open", this.meta.twineContextType) ? getRadialStageSwitchAction(e, this.meta) : null,
            getTypeConversion("type", "unlock", this.meta.twineContextType) ? getUnlockAction(this.meta, this.lock) : null,
        ].filter(it => it != null));
    }
}

class CustomShortcut extends Leaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, meta.title, meta, level, root)
        this.domInstance.style.color = this.meta.color
        if (this.meta.background) this.domInstance.style.background = this.meta.background
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([{
            radialIndex: 0,
            actionId: "open",
            actions: this.meta.url ? [{
                mouse: 0,
                id: "openInTab",
                icon: "",
                title: "Open",
                callback: async () => {
                    if (this.meta.dynamic) {
                        window.location.assign(prependHost(await resolveDynamic(this.meta.url)))
                    } else {
                        window.location.assign(prependHost(this.meta.url))
                    }
                }
            }, {
                mouse: 1,
                id: "openNewTab",
                icon: "",
                title: "New Tab",
                callback: async () => {
                    if (this.meta.dynamic) {
                        openLinkInNewTab(await resolveDynamic(this.meta.url))
                    } else {
                        openLinkInNewTab(this.meta.url)
                    }
                }
            }, {
                mouse: 2,
                id: "copyLink",
                icon: "",
                title: "Copy Link",
                callback: async () => {
                    if (this.meta.dynamic) {
                        clipBoardCopy(prependHost(await resolveDynamic(this.meta.url)))
                    } else {
                        clipBoardCopy(prependHost(this.meta.url))
                    }
                }
            }] : this.meta.dynamic ? [{
                mouse: 0,
                id: "copyValue",
                icon: "",
                title: "Copy Value",
                callback: async () => {
                    if (this.meta.dynamic) {
                        clipBoardCopy(await resolveDynamic(this.meta.value))
                    } else {
                        clipBoardCopy(this.meta.value)
                    }
                }
            }] : [{
                mouse: 0,
                id: "executeMacro",
                icon: "",
                title: "Execute Macro",
                callback: async () => {
                    resolveMacro(this.meta.macro).then(it => {
                        if (it.length > 0) {
                            let lastAction = it[it.length - 1]
                            if (lastAction.success) {
                                if (lastAction.terminate) {
                                    createToast(`Macro <b>${this.meta.title}</b> executed successfully<p>Click this toast to execute action<br><b>${lastAction.terminationAction}</b>`, {className: "twineAccept", onClick: lastAction.terminate })
                                } else {
                                    createToast(`Macro <b>${this.meta.title}</b> executed successfully`, {className: "twineAccept"})
                                }
                            } else {
                                createToast(`Macro <b>${this.meta.title}</b> failed to execute<br>${it.filter(it => it.success == false).map(it => it.value).join("<br>")}`, {className: "twineReject"})
                            }
                        }
                    }).catch(error => {
                        createToast("Error while executing macro", {"className": "twineReject"})
                    }).finally(() => {
                        hideSpinner()
                    })
                }
            }]
        }].filter(it => it != null));
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
                    mouse: 0,
                    id: "monitoringInTab",
                    icon: "",
                    title: "Open Monitoring",
                    callback: () => {
                        window.location.assign(`/shell/monitoring/Messages/{"status":"ALL","packageId":"ALL","artifactIds":%5B"${this.meta.artifactId}"%5D,"type":"ALL","time":"PASTHOUR","useAdvancedFields":false}`)
                    }
                }, {
                    mouse: 1,
                    id: "monitoringNewTab",
                    icon: "",
                    title: "Monitoring (New Tab)",
                    callback: () => {
                        chrome.runtime.sendMessage({
                            type: "OPEN_IN_TAB",
                            url: "https://" + window.location.host + `/shell/monitoring/Messages/{"status":"ALL","packageId":"ALL","artifactIds":%5B"${this.meta.artifactId}"%5D,"type":"ALL","time":"PASTHOUR","useAdvancedFields":false}`
                        })
                    }
                }, {
                    mouse: 2,
                    id: "trace",
                    icon: "",
                    title: "Activate Trace",
                    type: checkErrorTolerance(4) ? "DEFAULT" : "DISABLED",
                    callback: () => {
                        setLogLevel(this)
                    }
                }]
            },
            getRadialOpenAction(this),
            getRadialStageSwitchAction(e, this.meta),
            getUnlockAction(this.meta, this.lock),
            getRadialCompareAction(e, this),
            showUnimplemented ? getRadialGenericDeployAction(this) : {}
        ].filter(it => it != null))
    }

    showArtifactInfo(e) {
        super.showArtifactInfo(e)
        if (!this.runtimeMeta?.runtimeId) return
        callXHR("GET", runtimeArtifactDetailsUrl(this.runtimeMeta.runtimeId), null, null, false, {headers: {Accept: "application/json"}}).then(resolve => {
            let artifactDetails = new RuntimeArtifactDetails(resolve)
            displayedArtifactDetails.endpoints = artifactDetails.endpoints?.map(it => it.endpointUrl) ?? []
            displayedArtifactDetails.adapters = artifactDetails.adapterDependencies?.map(it => it.name) ?? []
            displayedArtifactDetails.referencedArtifacts = artifactDetails.artifactDependencies ?? []

            artifactDetails.endpoints?.forEach(it => {
                let tr = createElementFrom(`<tr>
                        <td>📄 Endpoint</td>
                        <td>${it.endpointUrl}</td>
                    </tr>`)
                tr.addEventListener("click", e => {
                    clipBoardCopy(it.endpointUrl)
                })
                radialMenuDetailDisplay?.querySelector("tbody")?.appendChild(tr)
            })


            let tr = createElementFrom(`<tr>
                <td>Log Level</td>
                <td>${artifactDetails.logConfig.traceActive == true ? `Trace until ${new Date(artifactDetails.logConfig.traceExpiresAt + " UTC").toLocaleString()}` : capitalizeFirstLetter(artifactDetails.logConfig.logLevel.toLowerCase())}</td>
            </tr>`)
            radialMenuDetailDisplay?.querySelector("tbody")?.appendChild(tr)

            if (!(artifactDetails.artifactDependencies?.length > 0 || artifactDetails.adapterDependencies?.length > 0)) return

            let artifacts = integrationContent.designtimeArtifacts.tree.flatList("designtimeArtifacts")
            if (artifactDetails.artifactDependencies?.length > 0) {
                let tr = createElementFrom(`<tr>
                    <td>Direct Dependencies</td>
                    <td></td>
                </tr>`)
                let dependencyList = tr.querySelector("td:nth-of-type(2)")
                let dependencies = artifactDetails.artifactDependencies.map(it => {
                    let runtimeArtifact = artifacts.find(artifact => artifact.runtimeMeta?.artifactId == it.id)
                    let designtimeArtifact = artifacts.find(artifact => artifact.meta?.artifactId == it.id)
                    let anchor
                    if (designtimeArtifact) {
                        let webUrl = "/shell/design" + getUrlPath("contentpackage", designtimeArtifact.meta.artifactId, designtimeArtifact.meta.packageId, getTypeConversion("type", "urlType", designtimeArtifact.meta.twineContextType))
                        anchor = `<a href="${webUrl}">`
                    }
                    if (runtimeArtifact && designtimeArtifact) {
                        return createElementFrom(`<span>${it.type}: ${anchor ? anchor + it.id + "</a>" : it.id}</span>`)
                    } else if (designtimeArtifact) {
                        return createElementFrom(`<span style="color: #b44f00">${it.type} (Not deployed): ${anchor ? anchor + it.id + "</a>" : it.id}</span>`)
                    } else if (runtimeArtifact) {
                        return createElementFrom(`<span style="color: #aa0808">${it.type} (Runtime only): ${anchor ? anchor + it.id + "</a>" : it.id}</span>`)
                    } else {
                        return createElementFrom(`<span style="color: #aa0808">${it.type} (Missing): ${anchor ? anchor + it.id + "</a>" : it.id}</span>`)
                    }
                })
                dependencies.forEach((it, index) => {
                    dependencyList.appendChild(it)
                    if (dependencies.length > index + 1) dependencyList.appendChild(document.createElement("br"))
                })
                radialMenuDetailDisplay?.querySelector("tbody")?.appendChild(tr)
            }

            if (artifactDetails.adapterDependencies?.length > 0) {
                let tr = createElementFrom(`<tr>
                    <td>Adapters</td>
                    <td>${
                    artifactDetails.adapterDependencies.map(it => {
                        let designtimeArtifact = artifacts.find(artifact => artifact.meta.artifactId.toUpperCase() == it.id)
                        let runtimeArtifact = artifacts.find(artifact => artifact.runtimeMeta?.symbolicName == it.id)
                        if (designtimeArtifact && runtimeArtifact) {
                            return `${it.name} (${it.provider})`
                        } else if (designtimeArtifact && !runtimeArtifact) {
                            return `<span style="color: #b44f00">${it.name} (${it.provider})</span>`
                        } else {
                            return `<span style="color: #888D">${it.name}</span>`
                        }
                    }).join(", ")
                }</td>
                </tr>`)
                //tr.addEventListener("click", e => {})
                radialMenuDetailDisplay?.querySelector("tbody")?.appendChild(tr)
            }

            if (artifactDetails.logConfig) {

            }
        }).catch(error => {
            console.error(error)
        }).finally(() => {

        })
    }
}

class MessageMappingArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this),
            getRadialStageSwitchAction(e, this.meta),
            getUnlockAction(this.meta, this.lock),
            showUnimplemented ? getRadialGenericDeployAction(this) : {},
            getRadialCompareAction(e, this),
        ].filter(it => it != null))
    }
}

class ValueMappingArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this),
            getRadialStageSwitchAction(e, this.meta),
            getUnlockAction(this.meta, this.lock),
            getRadialCompareAction(e, this),
            showUnimplemented ? getRadialGenericDeployAction(this) : {}, {
                radialIndex: 2,
                actionId: "typeAction",
                actions: [{
                    mouse: 0,
                    id: "displayDesigntime",
                    icon: "",
                    title: "Display Designtime",
                    callback: async () => {
                        let artifact = await IntegrationArtifact.init(
                            await new zip.ZipReader(
                                new zip.BlobReader(
                                    await getWorkspaceArtifactExplicitDownload(this.root.meta.registryId, this.meta.registryId)
                                )
                            ).getEntries(),
                            getTenantName()
                        )
                        let comparable = await artifact.convertToComparable()
                        let display = createElementFrom(`<pre>${comparable}</pre>`)

                        let popup = window.open('', artifact.manifest["Bundle-SymbolicName"], "scrollable,resizable");

                        if (popup.location.href === 'about:blank') {
                            popup.document.write(display.outerHTML);
                        }

                        popup.focus()
                    }
                }, {
                    mouse: 1,
                    id: "displayRuntime",
                    icon: "",
                    title: "Display Runtime",
                    callback: async () => {
                        if (this.runtimeMeta?.runtimeId) {
                            let artifact = await IntegrationArtifact.init(
                                await new zip.ZipReader(
                                    new zip.BlobReader(
                                        getZipContent(
                                            getDocument(
                                                await fetchRuntimeArtifactContent(this.runtimeMeta.runtimeId)
                                            ).querySelector("content").innerHTML
                                        )
                                    )
                                ).getEntries(),
                                getTenantName()
                            )
                            let comparable = await artifact.convertToComparable()
                            let display = createElementFrom(`<pre>${comparable}</pre>`)

                            let popup = window.open('', artifact.manifest["Bundle-SymbolicName"], "scrollable,resizable");

                            if (popup.location.href === 'about:blank') {
                                popup.document.write(display.outerHTML);
                            }

                            popup.focus()
                        } else {
                            createToast("This artifact is not deployed", "error")
                        }
                    }
                }, {
                    mouse: 2,
                    id: "exportCSV",
                    icon: "",
                    title: "Export as CSV",
                    callback: () => {
                        createToast("Not implemented yet", {className: "twineReject"})
                    }
                }]
            }
        ].filter(it => it != null))
    }
}

class ScriptCollectionArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this),
            getRadialStageSwitchAction(e, this.meta),
            getUnlockAction(this.meta, this.lock),
            showUnimplemented ? getRadialGenericDeployAction(this) : {}
        ].filter(it => it != null))
    }
}

class FunctionLibraryArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this),
            getRadialStageSwitchAction(e, this.meta),
            getUnlockAction(this.meta, this.lock),
            showUnimplemented ? getRadialGenericDeployAction(this) : {}
        ].filter(it => it != null))
    }
}

class DataTypeArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this),
            getRadialStageSwitchAction(e, this.meta),
            getUnlockAction(this.meta, this.lock)
        ].filter(it => it != null))
    }
}

class MessageTypeArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this),
            getRadialStageSwitchAction(e, this.meta),
            getUnlockAction(this.meta, this.lock)
        ].filter(it => it != null))
    }
}

class ODataArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this),
            getRadialStageSwitchAction(e, this.meta),
            getUnlockAction(this.meta, this.lock),
            showUnimplemented ? getRadialGenericDeployAction(this) : {}
        ].filter(it => it != null))
    }
}

class RESTArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this),
            getRadialStageSwitchAction(e, this.meta),
            getUnlockAction(this.meta, this.lock),
            showUnimplemented ? getRadialGenericDeployAction(this) : {}
        ].filter(it => it != null))
    }
}

class SOAPArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this),
            getRadialStageSwitchAction(e, this.meta),
            getUnlockAction(this.meta, this.lock),
            showUnimplemented ? getRadialGenericDeployAction(this) : {}
        ].filter(it => it != null))
    }
}

class ArchiveArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            getRadialOpenAction(this),
            getRadialStageSwitchAction(e, this.meta),
            getUnlockAction(this.meta, this.lock),
            showUnimplemented ? getRadialGenericDeployAction(this) : {}
        ].filter(it => it != null))
    }
}

class IntegrationAdapterArtifact extends ArtifactLeaf {
    constructor(listReference, title, meta, level, root) {
        super(listReference, title, meta, level, root)
    }

    getRadialItems(e) {
        return super.getRadialItems(e).concat([
            showUnimplemented ? getRadialGenericDeployAction(this) : {}
        ].filter(it => it != null))
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
                mouse: 0,
                id: "copyArtifactId",
                icon: "",
                title: "Artifact ID",
                callback: () => {
                    clipBoardCopy(this.meta.artifactId)
                }
            }, {
                mouse: 1,
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
                id: "showArtifactInfo",
                icon: "",
                title: "Details",
                callback: (e) => {
                    this.showArtifactInfo(e)
                }
            }]
        }, getRadialStageSwitchAction(e, this.meta)].filter(it => it != null))
    }

    showArtifactInfo(e) {
        let webUrl = "/shell/configure" + getUrlPath("api", this.meta.artifactId)

        displayedArtifactDetails = {
            type: getTypeConversion("type", "DisplayNameS", this.meta.twineContextType),
            name: this.meta.artifactName,
            id: this.meta.artifactId,
            host: window.location.host,
            reference: webUrl,
            version: this.meta.version,
            revision: this.meta.revision,
            description: this.meta.shortText,
            endpoints: this.meta.endpoints ?? [],
            virtualHost: this.meta.virtualHost,
            virtualPort: this.meta.virtualPort,
            changedAt: this.meta.changedAt,
            changedBy: this.meta.changedBy
        }
        radialMenuDetailDisplay = createElementFrom(`<div id="__twine-radialMenuDetailDisplay">
        <table style="border-collapse: collapse; width: 100%">
            <tbody/>
        </table>
    </div>`)
        radialMenuDetailDisplay.addEventListener("mouseleave", () => {
            radialMenuDetailDisplay.remove()
        })
        radialMenuDetailDisplay.addEventListener("contextmenu", e => {
            e.preventDefault();
            e.stopPropagation();
            return false
        })
        let table = radialMenuDetailDisplay.querySelector("tbody")
        let copyAll = createElementFrom("<td colspan='2' style='text-align: center'>📄 <strong>Click to copy all details</strong></td>")
        copyAll.addEventListener("click", e => {
            clipBoardCopy(JSON.stringify(displayedArtifactDetails, null, 7))
        })
        table.append(copyAll)
        let entries = [
            debugFlag ? {key: "Search", value: this.meta.search} : null,
            {key: "Name", value: this.meta.artifactName, copyable: true},
            {key: "ID", value: this.meta.artifactId, copyable: true}
        ]
        table.append(...Object.entries(entries).map(it => {
            let tr = createElementFrom(`<tr>
                    <td>${it[1].copyable ? "📄" : ""} ${it[1].key}</td>
                    <td>${it[1].value}</td>
                </tr>`)
            if (it[1].isHint) {
                tr.style.fontSize = "small"
                tr.style.fontStyle = "italic"
                //tr.classList.add("detailDisplayHint")
            }
            if (it[1].copyable) tr.addEventListener("click", e => {
                clipBoardCopy(it[1].value)
            })
            return tr
        }))

        this.meta.endpoints?.forEach(it => {
            let endpointUrl = `https://${this.meta.virtualHost}:${this.meta.virtualPort}${it}`
            let tr = createElementFrom(`<tr>
                        <td>📄 Endpoint</td>
                        <td>${endpointUrl}</td>
                    </tr>`)
            tr.addEventListener("click", e => {
                clipBoardCopy(endpointUrl)
            })
            table.append(tr)
        })

        let tr = createElementFrom(`<tr>
                    <td>📄 Direct Link</td>
                    <td><a href="${webUrl}">${this.meta.artifactName}</a></td>
                </tr>`)
        tr.addEventListener("click", e => {
            if (e.target.tagName != "A")
                clipBoardCopy(window.location.host + webUrl)
        })
        radialMenuDetailDisplay.querySelector("tbody")?.appendChild(tr)


        radialMenuDetailDisplay.style.top = `${e.y - 25}px`;
        radialMenuDetailDisplay.style.left = `${e.x - 25}px`;
        radialMenuDetailDisplay.style.display = "block";
        radialMenuDetailDisplay.style.position = "absolute"
        radialMenuDetailDisplay.style.padding = "25px"
        radialMenuDetailDisplay.style.zIndex = "70"
        radialMenuDetailDisplay.style.borderRadius = "25px"
        radialMenuDetailDisplay.className = "radialMenuDetailDisplay"
        radialMenuDetailDisplay.style.borderWidth = "1px"
        popoverLayer.appendChild(radialMenuDetailDisplay)
        RadialMenu?.instance?.domInstance?.remove()
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
                mouse: 0,
                id: "copyArtifactId",
                icon: "",
                title: "Copy",
                callback: () => {
                    clipBoardCopy(this.meta.secureMaterialId)
                }
            }, {
                mouse: 1,
                id: "copyArtifactUser",
                icon: "",
                title: "Copy User",
                callback: () => {
                    clipBoardCopy(this.meta.secureMaterialUser)
                }
            }, {
                mouse: 2,
                id: "showArtifactInfo",
                icon: "",
                title: "Details",
                callback: (e) => {
                    this.showArtifactInfo(e)
                }
            }]
        }, checkErrorTolerance(6) ? {
            radialIndex: 1,
            actionId: "delete",
            actions: [{
                mouse: 0,
                id: "deleteSecureMaterial",
                icon: "",
                title: "Delete",
                type: "NEGATIVE",
                callback: () => {
                    this.delete()
                }
            }]
        } : getLockedItem("delete", "delete", "", "<span style='color: #aa0808'>Needs DELETE Calls</span>", 1)].filter(it => it != null))
    }

    showArtifactInfo(e) {
        radialMenuDetailDisplay = createElementFrom(`<div id="__twine-radialMenuDetailDisplay">
            <table style="border-collapse: collapse; width: 100%">
                <tbody/>
            </table>
        </div>`)
        radialMenuDetailDisplay.addEventListener("mouseleave", () => {
            radialMenuDetailDisplay.remove()
        })
        radialMenuDetailDisplay.addEventListener("contextmenu", e => {
            e.preventDefault();
            e.stopPropagation();
            return false
        })
        let table = radialMenuDetailDisplay.querySelector("tbody")
        let entries = [
            {key: "ID", value: this.meta.secureMaterialId, copyable: true},
            {key: "User", value: this.meta.secureMaterialUser, copyable: true},
            {key: "Description", value: this.meta.shortText, copyable: false},
            {
                key: "Deployment Status",
                value: `Deployed by ${this.meta.deployedBy} on ${new Date(Number(this.meta.deployedOn.slice(0, -3)) * 1000).toLocaleString()}<br>`,
                copyable: false
            }
        ]
        if (this.meta.tokenUrl) {
            entries.push({
                key: "Token URL",
                value: this.meta.tokenUrl,
                copyable: true
            })
        }
        table.append(...Object.entries(entries).map(it => {
            let tr = createElementFrom(`<tr>
                        <td>${it[1].copyable ? "📄" : ""} ${it[1].key}</td>
                        <td>${it[1].value}</td>
                    </tr>`)
            if (it[1].isHint) {
                tr.style.fontSize = "small"
                tr.style.fontStyle = "italic"
                //tr.classList.add("detailDisplayHint")
            }
            if (it[1].copyable) tr.addEventListener("click", e => {
                clipBoardCopy(it[1].value)
            })
            return tr
        }))

        radialMenuDetailDisplay.style.top = `${e.y - 25}px`;
        radialMenuDetailDisplay.style.left = `${e.x - 25}px`;
        radialMenuDetailDisplay.style.display = "block";
        radialMenuDetailDisplay.style.position = "absolute"
        radialMenuDetailDisplay.style.padding = "25px"
        radialMenuDetailDisplay.style.zIndex = "70"
        radialMenuDetailDisplay.style.borderRadius = "25px"
        radialMenuDetailDisplay.className = "radialMenuDetailDisplay"
        radialMenuDetailDisplay.style.borderWidth = "1px"
        popoverLayer.appendChild(radialMenuDetailDisplay)
        RadialMenu?.instance?.domInstance?.remove()
    }

    delete() {
        let dialog = new Dialog("Confirm Delete")
            .withContent(new SimpleElement(`<div style="padding: 0.75rem">Do you want to delete ${getTypeConversion("type", "displayNameS", this.meta.secureMaterialType).toLowerCase()} <span style="color: ${getTypeConversion("type", "displayColor", this.meta.secureMaterialType)}"><b>${this.meta.secureMaterialId}</b></span>?</div>`))
            .withOptions([
                new Button("Delete", "NEGATIVE", null, false, false, true, () => {
                    callXHR("POST", operationsUrl() + "/com.sap.it.km.api.commands.UndeployCredentialsCommand", `artifactIds=${this.meta.secureMaterialId}&tenantId=${this.meta.tenantId}`, "application/x-www-form-urlencoded; charset=UTF-8", true)
                        .then(resolve => {
                            createToast(`Secure Material <strong>${this.meta.secureMaterialId}</strong> was deleted`)
                            this.domInstance.remove()
                        })
                        .catch(reject => {
                            switch (reject.status) {
                                case 403:
                                    createToast(`<p>You don't seem to be authorized to delete secure materials</p><p><b>Default RoleCollection:</b> PI_Administrator<br><b>Role:</b> AuthGroup_Administrator</p>`, {
                                        type: "twineWarning"
                                    })
                                    break
                                case 500:
                                    createToast(`Error while deleting secure material.<br>Your session may have expired`, {className: "twineReject"})
                                    break
                                case 404:
                                    createToast(`This secure material does not exist anymore`, {className: "twineReject"})
                                default:
                                    createToast(`An unexpected error occured while trying to remove the lock`, {className: "twineReject"})
                                    break
                            }
                            console.error(reject)
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

/**
 * TODO: Don't make a separate function for branches and leaves. Build the path using {@link getUrlPath}
 */
function getRadialOpenAction(artifact) {
    let path = `/shell/design/contentpackage/${artifact.meta.packageId}/${getTypeConversion("type", "urlType", artifact.meta.twineContextType)}/${artifact.meta.artifactId}`
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
            id: "showArtifactInfo",
            icon: "",
            title: "Details",
            callback: (e) => {
                artifact.showArtifactInfo(e)
            }
        }]
    }
}

function getRadialGenericDeployAction(artifact) {
    if (!cloudRuntimeOnly) return getLockedItem("deploy", "deploy", "", "Not on EIC Tenants yet", 8)
    if (!checkErrorTolerance(4)) return getLockedItem("deploy", "deploy", "", "<span style='color: #aa0808'>5</span>", 8)
    return {
        radialIndex: 8,
        actionId: "deployment",
        actions: [{
            mouse: 0,
            id: "deployArtifact",
            icon: "",
            title: "Deploy",
            type: "NEGATIVE",
            callback: (e) => {
                let dialog = new Dialog(`Deploy ${artifact.meta.artifactName}`)
                dialog.withOptions([new Button("Deploy", null, null, false, false, false, () => {
                    createToast("Not implemented yet", {className: "twineReject"})
                })])
                dialog.withContent(new SimpleElement(`<div style="padding: 0.75rem">Do you want to deploy ${getTypeConversion("type", "displayNameS", artifact.meta.twineContextType).toLowerCase()} <span style="color: ${getTypeConversion("type", "displayColor", artifact.meta.twineContextType)}"><b>${artifact.meta.artifactName}</b></span>?</div>`))
                dialog.show()
            }
        }, {
            mouse: 1,
            id: "undeployArtifact",
            icon: "",
            title: "Undeploy",
            type: "NEGATIVE",
            callback: () => {
                let dialog = new Dialog(`Undeploy ${artifact.meta.artifactName}`)
                dialog.withOptions([new Button("Undeploy", null, null, false, false, false, () => {
                    createToast("Not implemented yet", {className: "twineReject"})
                })])
                dialog.withContent(new SimpleElement(`<div style="padding: 0.75rem">Do you want to undeploy ${getTypeConversion("type", "displayNameS", artifact.meta.twineContextType).toLowerCase()} <span style="color: ${getTypeConversion("type", "displayColor", artifact.meta.twineContextType)}"><b>${artifact.meta.artifactName}</b></span>?</div>`))
                dialog.show()
            }
        }, {
            mouse: 2,
            id: "restartArtifact",
            icon: "",
            title: "Restart",
            type: "NEGATIVE",
            callback: () => {
                let dialog = new Dialog(`Restart ${artifact.meta.artifactName}`)
                dialog.withOptions([new Button("Restart", null, null, false, false, false, () => {
                    createToast("Not implemented yet", {className: "twineReject"})
                })])
                dialog.withContent(new SimpleElement(`<div style="padding: 0.75rem">Do you want to restart ${getTypeConversion("type", "displayNameS", artifact.meta.twineContextType).toLowerCase()} <span style="color: ${getTypeConversion("type", "displayColor", artifact.meta.twineContextType)}"><b>${artifact.meta.artifactName}</b></span>?</div>`))
                dialog.show()
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

function getRadialDocumentationAction() {

}

function getRadialCompareAction(event, artifact) {
    if (!checkErrorTolerance(3)) return getLockedItem("compare", "compare", "", "Needs error tolerance&nbsp;<span style='color: #aa0808'>3</span>", 3)
    let compareActions = {}, compareItems = []
    let mouseAction = getMouseAction("compare", event.button)
    if (mouseAction === 0) {
        compareItems = [{
            mouse: event.button,
            id: "compareToRuntime",
            title: `Compare to Runtime`,
            icon: "",
            callback: async (event) => {
                let sourceArtifact, targetArtifact
                if (artifact.runtimeMeta) {
                    let rateLimitResult = await checkRateLimit("compareArtifact")
                    if (rateLimitResult.code > 399) {
                        if (rateLimitResult.code == 429) {
                            createToast(rateLimitResult.message, {className: "twineReject"})
                        } else {
                            createToast("Something happened and it was not handled. Sorry!", {className: "twineReject"})
                        }
                        return
                    }

                    displaySpinner("Getting artifacts")
                    sourceArtifact = await IntegrationArtifact.init(
                        await new zip.ZipReader(
                            new zip.BlobReader(
                                await getWorkspaceArtifactExplicitDownload(artifact.root.meta.registryId, artifact.meta.registryId)
                            )
                        ).getEntries(),
                        getTenantName()
                    )

                    targetArtifact = await IntegrationArtifact.init(
                        await new zip.ZipReader(
                            new zip.BlobReader(
                                getZipContent(
                                    getDocument(
                                        await fetchRuntimeArtifactContent(artifact.runtimeMeta.runtimeId)
                                    ).querySelector("content").innerHTML
                                )
                            )
                        ).getEntries(),
                        getTenantName()
                    )

                    sourceArtifact.compare(targetArtifact).then(status => {
                        if (status.code != 204) {
                            if (status.code == 400) hideSpinner()
                            hideSpinner()
                            createToast(status.message, {className: status.code == 400 ? "twineReject" : status.code == 204 ? "twineSuccess" : null})

                        }
                    }).catch(e => {
                        hideSpinner()
                        createToast("Something went wrong! :(<br>Check the console for more information", {className: "twineReject"})
                        console.error(e)
                    })
                } else {
                    createToast(`Artifact <span style="font-weight: bold">${artifact.meta.artifactId}</span> is not deployed on this tenant`, {className: "twineReject"})
                }
            }
        }]
    } else if (tenantVariables.globalEnvironment.tenants.length > 1) {
        if (mouseAction == 2) {
            compareItems = tenantVariables.globalEnvironment.tenants
                .filter(it => it.id !== tenantVariables.currentTenant.id)
                .sort((a, b) => a.errorTolerance > b.errorTolerance)
                .map((element, index) => {
                    return (!((tenantVariables.currentTenant.datacenter && !element.datacenter) || (!tenantVariables.currentTenant.datacenter && element.datacenter))) ? {
                        mouse: event.button,
                        id: "stage_" + element.id,
                        title: element.errorTolerance >= 2 ? `Compare Runtimes (${element.name})` : `API Calls disabled for ${element.name}`,
                        color: element.color,
                        type: element.errorTolerance >= 2 ? "DEFAULT" : "DISABLED",
                        icon: "",
                        callback: async (event) => {
                            let sourceArtifact, targetArtifact
                            if (artifact.runtimeMeta) {
                                let xTenantUid = getCrossTenantUid(element.id)
                                if (!xTenantUid) {
                                    createToast(`Tenant list for this environment doesn't contain ${getStyledStageText(element.id, element)}. That's weird 🤔`, {className: "twineReject"})
                                    return
                                }
                                let response = await chrome.runtime.sendMessage({
                                    type: "SAP_IS_READ_ONLY_UNIFY_REQUEST",
                                    requestType: "runtimeArtifacts",
                                    tenantId: xTenantUid,
                                    maxAge: integrationContent.runtimeArtifacts.maxAge
                                })
                                if (response.status != "cache" && response.status != "subscribed") {
                                    hideSpinner()
                                    createToast(`Didn't receive a list of runtime artifacts for ${getStyledStageText(element.name, element)}.<br>Please open or focus a tab with this tenant first`, {className: "twineWarning"})
                                    return
                                }

                                let xArtifactId = response.data.find(it => {
                                    return it.meta.artifactId == artifact.runtimeMeta.artifactId && it.meta.twineContextType == artifact.runtimeMeta.twineContextType
                                })?.meta.runtimeId
                                if (!xArtifactId) {
                                    createToast(`Artifact <span style="font-weight: bold">${artifact.meta.artifactId}</span> is not deployed on ${getStyledStageText(element.name, element)}`, {className: "twineReject"})
                                    return
                                }

                                let rateLimitResult = await checkRateLimit("compareArtifact")
                                if (rateLimitResult.code > 399) {
                                    if (rateLimitResult.code == 429) {
                                        createToast(rateLimitResult.message, {className: "twineReject"})
                                    }
                                    return
                                }

                                displaySpinner("Getting artifacts")

                                let thisArtifact = await IntegrationArtifact.init(
                                    await new zip.ZipReader(
                                        new zip.BlobReader(
                                            getZipContent(
                                                getDocument(
                                                    await fetchRuntimeArtifactContent(artifact.runtimeMeta.runtimeId)
                                                ).querySelector("content").innerHTML
                                            )
                                        )
                                    ).getEntries(),
                                    getTenantName()
                                )
                                let otherArtifactResponse = await getCrossTenantRuntimeArtifactDownload(xArtifactId, element)
                                if (otherArtifactResponse?.code == 409) {
                                    hideSpinner()
                                    createToast(otherArtifactResponse.message, {className: "twineReject"})
                                    return
                                }
                                let otherArtifact = await IntegrationArtifact.init(
                                    await new zip.ZipReader(
                                        new zip.BlobReader(
                                            getZipContent(
                                                getDocument(otherArtifactResponse).querySelector("content").innerHTML
                                            )
                                        )
                                    ).getEntries(),
                                    element.name
                                )

                                thisArtifact.compare(otherArtifact).then(status => {
                                    if (status.code != 204) {
                                        if (status.code == 400) hideSpinner()
                                        createToast(status.message, {className: status.code == 400 ? "twineReject" : status.code == 204 ? "twineSuccess" : "twineDefault"})
                                    }
                                }).catch(e => {
                                    hideSpinner()
                                    createToast("Something went wrong! :(<br>Check the console for more information", {className: "twineReject"})
                                    console.error(e)
                                })

                            } else {
                                createToast(`Artifact <span style="font-weight: bold">${artifact.meta.artifactId}</span> is not deployed on this tenant`, {className: "twineReject"})
                            }
                        }
                    } : null
                })
                .filter(it => it != null)
        } else {
            compareItems = tenantVariables.globalEnvironment.tenants
                .filter(it => it.id !== tenantVariables.currentTenant.id)
                .sort((a, b) => a.errorTolerance > b.errorTolerance)
                .map((element, index) => {
                    return (!((tenantVariables.currentTenant.datacenter && !element.datacenter) || (!tenantVariables.currentTenant.datacenter && element.datacenter))) ? {
                        mouse: event.button,
                        id: "stage_" + element.id,
                        title: element.errorTolerance >= 2 ? `Compare Designtimes (${element.name})` : `API Calls disabled for ${element.name}`,
                        color: element.color,
                        type: element.errorTolerance >= 2 ? "DEFAULT" : "DISABLED",
                        icon: "",
                        callback: async (event) => {
                            let sourceArtifact, targetArtifact
                            let xTenantUid = getCrossTenantUid(element.id)
                            if (!xTenantUid) {
                                createToast(`Tenant list for this environment doesn't contain ${getStyledStageText(element.id, element)}. That's weird 🤔`, {className: "twineReject"})
                                return
                            }
                            let response = await chrome.runtime.sendMessage({
                                type: "SAP_IS_READ_ONLY_UNIFY_REQUEST",
                                requestType: "designtimeArtifacts",
                                tenantId: xTenantUid,
                                maxAge: integrationContent.designtimeArtifacts.maxAge
                            })
                            if (response.status != "cache" && response.status != "subscribed") {
                                createToast(`Didn't receive a list of designtime artifacts for ${getStyledStageText(element.name, element)}.<br>Please open or focus a tab with this tenant first`, {className: "twineWarning"})
                                hideSpinner()
                                return
                            }

                            let xArtifact
                            response.data.find(it => {
                                return it.meta.artifactId == artifact.meta.packageId
                            })
                                ?.children.find(it => {
                                return it.meta.twineContextType == artifact.meta.twineContextType
                            })
                                ?.children.find(it => {
                                if (it.meta.artifactId == artifact.meta.artifactId && it.meta.twineContextType == artifact.meta.twineContextType) {
                                    xArtifact = it
                                    return
                                }
                            })
                            if (!xArtifact) {
                                createToast(`Artifact <span style="font-weight: bold">${artifact.meta.artifactId}</span> was not found on ${getStyledStageText(element.name, element)}`, {className: "twineReject"})
                                return
                            }

                            let rateLimitResult = await checkRateLimit("compareArtifact")
                            if (rateLimitResult.code > 399) {
                                if (rateLimitResult.code == 429) {
                                    createToast(rateLimitResult.message, {className: "twineReject"})
                                }
                                return
                            }

                            displaySpinner("Getting artifacts")

                            let thisArtifactResponse = await getWorkspaceArtifactExplicitDownload(artifact.meta.packageRegistryId, artifact.meta.registryId)
                            let thisArtifact = await IntegrationArtifact.init(
                                await new zip.ZipReader(
                                    new zip.BlobReader(thisArtifactResponse)
                                ).getEntries(),
                                getTenantName()
                            )
                            let otherArtifactResponse = await getCrossTenantWorkspaceArtifactDownload(xArtifact.meta.packageRegistryId, xArtifact.meta.registryId, element)
                            switch (otherArtifactResponse?.code) {
                                case 409: {
                                    hideSpinner()
                                    createToast(otherArtifactResponse.message, {className: "twineReject"})
                                    return
                                }
                                case 404: {
                                    hideSpinner()
                                    createToast(otherArtifactResponse.message, {className: "twineReject"})
                                    return
                                }
                            }

                            let otherArtifact = await IntegrationArtifact.init(
                                await new zip.ZipReader(
                                    new zip.BlobReader(
                                        new Blob([new Uint8Array(otherArtifactResponse.data)], {type: 'application/zip'})
                                    )
                                ).getEntries(),
                                element.name
                            )

                            thisArtifact.compare(otherArtifact).then(status => {
                                if (status.code != 204) {
                                    if (status.code == 400) hideSpinner()
                                    createToast(status.message, {className: status.code == 400 ? "twineReject" : status.code == 204 ? "twineSuccess" : "twineDefault"})
                                }
                            }).catch(e => {
                                hideSpinner()
                                createToast("Something went wrong! :(<br>Check the console for more information", {className: "twineReject"})
                                console.error(e)
                            })
                        }
                    } : null
                })
                .filter(it => it != null)
        }

    }

    if (compareItems.length > 0) {
        compareActions = {
            radialIndex: 3,
            actions: [...compareItems]
        }
    } else compareActions = {}

    return compareActions
}

function getUnlockAction(meta, lock) {
    if (lock != null) {
        switch (true) {
            case (checkErrorTolerance(4)):
                return {
                    radialIndex: 4,
                    actionId: "unlock",
                    actions: [{
                        mouse: 0,
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
                return getLockedItem("unlock", "unlock", "", "Needs error tolerance:&nbsp;<span style='color: #aa080888'>4</span>")
            default:
                return {}
        }
    } else return {}
}


class Dialog {
    domInstance
    domOptions
    domContent

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
        this.domContent.appendChild(content.domInstance)
        return this
    }

    show(zIndex = BLOCKER.ABOVE_SAP_DIALOG) {
        popoverLayer.insertAdjacentElement("beforeend", this.domInstance)
        popoverLayerBlocker.style.zIndex = zIndex
        popoverLayerBlocker.style.visibility = "visible"
        popoverLayerBlocker.style.display = "block"
    }

    close(zIndex) {
        this.domInstance.remove()
        if (!zIndex) {
            popoverLayerBlocker.style.visibility = "hidden"
            popoverLayerBlocker.style.display = "none"
        } else {
            popoverLayerBlocker.style.zIndex = zIndex
        }
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

let forceSaveCounter = 0
let forceDebugCounter = 0
class SettingsDialog {
    static isOpen = false
    domInstance
    domOptions
    domContent
    tabs
    buttons = []
    settings = configuration?.sap?.integrationSuite
    configError

    constructor() {
        let runStart = window.performance.now()
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
                                        <span id="__twine-VersionHint" class="noSelect" dir="auto">Twine Settings (Config v${configuration.version})</span>
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
        try {
            this.tabs = [new EnvironmentsTab(this), new GlobalSettingsTab(this), new OverridesTab(this)]
            this.domInstanceStrip = this.domInstance.querySelector("div > section > div > div > div > div:nth-of-type(2) > div")
            this.tabs.forEach(it => this.domInstanceStrip.appendChild(it.domInstanceHeader))

            this.domInstanceContainer = this.domInstance.querySelector("div > section > div")
            this.tabs.forEach(it => this.domInstanceContainer.appendChild(it.domInstanceContent))
        } catch (e) {
            this.domInstance.querySelector("section > div").appendChild(createElementFrom("<div style='width: 100%; height: 100%; margin: 0; text-align: center;'><span style='font-size: 14px; font-weight: bold; position: absolute; margin: 0; top: 50%; left: 50%; transform: translate(-50%, -50%);'>Hopefully you did this on purpose 😐<br>If so, you better have a backup of your configuration.</span></div>"))
            this.configError = true
            console.error()
        }

        this.domOptions = this.domInstance.querySelector("div > footer > div")
        this.domOptions.insertAdjacentElement("beforeend", new Button("Evaluate Shortcuts", "INVERTED", "", true, false, true, async () => {
            let overrides
            try {
                overrides = JSON.parse(this.tabs[2].getSaveOutput())
                let evaluableShortcuts = ((overrides?.folders?.customFolder ?? []).concat(overrides?.environments?.[getTenantOwner()]?.folders?.customFolder ?? []).concat(overrides?.tenants?.[getTenantId()]?.folders?.customFolder ?? [])).filter(it => it.eval == true && (it.dynamic == true || it.macro))
                if (evaluableShortcuts.length == 0) {
                    createToast("No global, environment or tenant shortcuts marked for evaluation.<br>Add <i>eval: true</i> to any shortcut you want to evaluate")
                    return
                }
                for (const shortcut of evaluableShortcuts) {
                    if (shortcut.macro) {
                        let result = await resolveMacro(shortcut.macro, true)
                        createToast(`<div style="text-align: center">${shortcut.title}</div><div>` + result.map(it => (it.success ? "<b>✓</b> " : "<b>✗</b> ") + it.hint).join("<br>") + "</div>", {className: result.slice(-1)[0].success ? "twineAccept" : "twineReject", style: {display: "inline-block"}})
                    } else if (shortcut.dynamic) {
                        let result = await resolveDynamic(shortcut.url ?? shortcut.value, true)
                        createToast(`<div style="text-align: center">${shortcut.title}</div><div>` + result.map(it => (it.success ? "<b>✓</b> " : "<b>✗</b> ") + it.hint).join("<br>") + "</div>", {className: "twineAccept", style: {display: "inline-block"}})
                    } else {
                        createToast(`✗ ${shortcut.title} is neither a dynamic value nor a macro`, {className: "twineReject"})
                    }
                }
            } catch (e) {
                createToast(e.message, {className: "twineReject"})
            }
        }).domInstance)
        this.domOptions.insertAdjacentElement("beforeend", new Button(debugFlag || this.configError ? "Import Config" : "Add \"debug\": true to your Overrides", debugFlag || this.configError ? "INVERTED" : "DISABLED", "", true, false, true, () => {
            let dialog = new Dialog("Override Config")
            dialog.withOptions([
                new Button("Override", "NEGATIVE", null, false, false, true, () => {
                    navigator.clipboard.readText().then(text => {
                        try {
                            let newConfiguration = JSON.parse(text)
                            persistConfigChange(newConfiguration)
                        } catch (e) {
                            error("Couldn't parse configuration")
                            console.error(e)
                            createToast("Couldn't parse clipboard contents.<br>Please check the developer console for possible causes", {className: "twineReject"})
                        }
                    })
                    dialog.close(BLOCKER.ABOVE_SAP_DIALOG)
                })
            ]).withContent(new SimpleElement(`<div style="padding: 0.75rem">Do you want to override your configuration with whatever is in your clipboard at the moment?</div>`))
            dialog.show(BLOCKER.ABOVE_TWINE_DIALOG)
        }).domInstance)
        this.domOptions.insertAdjacentElement("beforeend", new Button("Copy Config", "INVERTED", "", true, false, true, () => {
            clipBoardCopy(JSON.stringify(configuration, null, 7))
        }).domInstance)
        this.domOptions.insertAdjacentElement("beforeend", new Button("Reset Config", "INVERTED", "", true, false, true, () => {
            let dialog = new Dialog("Reset Config")
            dialog.withOptions([
                new Button("Reset", "NEGATIVE", null, false, false, true, () => {
                    persistConfigChange(defaultConfiguration)
                    dialog.close(BLOCKER.ABOVE_SAP_DIALOG)
                })
            ]).withContent(new SimpleElement(`<div style="padding: 0.75rem">Do you want to reset the configuration to the default one? This will reset all settings and overrides.</div>`))
            dialog.show(BLOCKER.ABOVE_TWINE_DIALOG)
        }).domInstance)
        this.domOptions.insertAdjacentElement("beforeend", new Button("Open Changelog", "INVERTED", "", true, false, true, () => {
            openLinkInNewTab(chrome.runtime.getURL("util/update.html"))
        }).domInstance)
        this.domOptions.insertAdjacentElement("beforeend", new Button("Open Macro Cheatsheet", "INVERTED", "", true, false, true, () => {
            openLinkInNewTab(chrome.runtime.getURL("util/macroCheatsheet.html"))
        }).domInstance)
        this.domOptions.insertAdjacentElement("beforeend", new Button("Save", "INVERTED", null, false, false, true, () => {
            this.save()
        }).domInstance)
        this.domOptions.insertAdjacentElement("beforeend", new Button("Close", null, null, false, false, true, () => this.close()).domInstance)
        this.domInstance.querySelector("span[id=__twine-VersionHint]").addEventListener("click", () => {
            if (forceDebugCounter++ == 4) {
                debugFlag = true
                createToast("Debug enabled<br>Reopen the settings dialog to use disabled buttons")
            }
        })

        elapsedTime += window.performance.now() - runStart
        return this
    }

    show() {
        SettingsDialog.isOpen = true
        popoverLayer.insertAdjacentElement("beforeend", this.domInstance)
        popoverLayerBlocker.style.zIndex = "64"
        popoverLayerBlocker.style.visibility = "visible"
        popoverLayerBlocker.style.display = "block"
    }

    async save() {
        let overrides = this.tabs[2].getSaveOutput()

        if (overrides.length > 0) {
            overrides = tryParseJSON(overrides)
            if (!overrides) {
                createToast("Invalid JSON in Overrides Tab", {className: "twineReject"})
                return
            }
        } else overrides = {}

        let environmentChecks = this.tabs[0].environments.map(it => it.isValid())
        if (environmentChecks.every(it => it.overall) || forceSaveCounter == 4) {
            forceSaveCounter = 0
            this.settings = this.tabs[1].getSaveOutput()
            let environments = this.tabs[0].getSaveOutput()

            this.settings.sap.integrationSuite.environments = environments.filter(it => it.owner != "Other Environments")
            let otherEnvironments = environments.filter(it => it.owner == "Other Environments")
            this.settings.sap.integrationSuite.trialTenantSettings = otherEnvironments[0].tenants.find(it => it.name == "Trial")
            this.settings.sap.integrationSuite.undefinedTenantSettings = otherEnvironments[0].tenants.find(it => it.name == "Unknown")
            this.settings.overrides = overrides

            if (compareVersion(this.settings.version, configuration.version) != 0) {
                clipBoardCopy(JSON.stringify(configuration, null, 7))
                createToast("Previous config has been copied to clipboard. Just in case")
            }
            await persistConfigChange(this.settings)

            /*   Update whatever possible   */
            debugFlag = configuration.overrides?.debug === true
            regexOnly = configuration.overrides?.regexOnlySearch === true
            showUnimplemented = configuration.overrides?.showUnimplemented === true

            getCurrentEnvironment()
            updateArtifactTypes()
            buildCustomShortcuts().finally(() => {
                Object.keys(integrationContent).forEach(key => {
                    rebuildTree(key)
                })
            })

            toolHeaderObserver.disconnect()
            updateDecorations(true)
            toolHeaderObserver.observe(toolHeader, {
                childList: true
            });
            initializeQuicklinks()
        } else {
            forceSaveCounter++
            let invalidEnvironments = environmentChecks.filter(it => !it.overall)
            let x = invalidEnvironments.map(env => {
                return "<p><b>Environment \"" + env.environment + `\":</b><br>${env.errors.join("<br>")}` + env.tenants.filter(it => it.errors.length != 0).map(tenant => {
                    return `<br><b>Tenant \"${tenant.tenant}\":</b><br>${tenant.errors.join("<br>")}`
                }).join('<br>') + "<br>" + "</p>"
            }).join("<br><br>")
            createToast(`<b>Please correct the configuration for the following environments first</b>${x}`, {className: "twineReject"})

        }
    }

    close() {
        SettingsDialog.isOpen = false
        this.domInstance.remove()
        popoverLayerBlocker.style.visibility = "hidden"
        popoverLayerBlocker.style.display = "none"
        settingsDialog = null
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


        this.addObject(new SimpleCheckBox("Enable Shortcuts", checkCloudIntegrationFeature("quickAccess"), {asHeader: true}), "shortcutsEnabled", {asHeader: true})
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
        this.addObject(new SimpleCheckBox("Runtime Artifacts", checkQuicklink("runtimeArtifacts")), "shortcutRuntimeArtifacts")
        this.addObject(new SimpleCheckBox("Certificates", checkQuicklink("certificates")), "shortcutCertificates")
        this.addObject(new SimpleCheckBox("Datastores", checkQuicklink("datastores")), "shortcutDatastores")
        this.addObject(new SimpleCheckBox("Connectivity Test", checkQuicklink("connectivityTest")), "shortcutConnectivityTest")
        this.addObject(new SimpleCheckBox("Locks", checkQuicklink("locks")), "shortcutLocks")
        this.addObject(new SimpleCheckBox("Stage Switch", checkQuicklink("stageSwitch")), "shortcutStageSwitch")
        this.addObject(new SimpleCheckBox("Message Usage", checkQuicklink("messageUsage")), "shortcutMessageUsage")
        this.addObject(new SimpleCheckBox("Check Naming Conventions", checkQuicklink("checkNamingConventions"), {disabled: true}), "shortcutCheckNamingConventions")


        this.addObject(new SimpleCheckBox("Enable Artifact Lists", checkCloudIntegrationFeature("integrationContentQuickAccess"), {asHeader: true}), "enableSideNavigation", true)
        this.addObject(new SimpleCheckBox("Integrations", configuration?.sap?.integrationSuite?.decorations?.tenantStage), "artifactListIntegration")
        this.addObject(new SimpleCheckBox("API Proxies", configuration?.sap?.integrationSuite?.decorations?.tenantStageAside), "artifactListAPI")
        this.addObject(new SimpleCheckBox("Security Materials", configuration?.sap?.integrationSuite?.decorations?.tenantStageHeader), "artifactListCredentials")
        this.addObject(new SimpleCheckBox("Shortcuts", configuration?.sap?.integrationSuite?.decorations?.companyLogo), "artifactListShortcuts")

        this.addObject(new SimpleCheckBox("Enable Decorations", checkIntegrationSuiteFeature("decorations"), {asHeader: true}), "decorationsEnabled", true)
        this.addObject(new SimpleCheckBox("Stage Tag", configuration?.sap?.integrationSuite?.decorations?.tenantStage), "decorationsStage")
        this.addObject(new SimpleCheckBox("Sidebar Background", configuration?.sap?.integrationSuite?.decorations?.tenantStageAside), "decorationsStageSidebar")
        this.addObject(new SimpleCheckBox("Header Background", configuration?.sap?.integrationSuite?.decorations?.tenantStageHeader), "decorationsStageHeader")
        this.addObject(new SimpleCheckBox("Company Logo", configuration?.sap?.integrationSuite?.decorations?.companyLogo), "decorationsLogo")
        this.addObject(new SimpleCheckBox("Enable Unlock Action", checkCloudIntegrationFeature("unlock"), {asHeader: true}), "unlockEnabled", true)

        contentNode.appendChild(document.createElement("br"))
        this.addObject(createElementFrom(`
            <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                <span class="sapMLabelTextWrapper">
                    <bdi style="font-weight: bold;">Reminders</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))
        this.addObject(new SimpleCheckBox("Locked Artifacts", checkReminder("lockedArtifacts")), "reminderLocks")
        this.addObject(new SimpleCheckBox("Version Updates", checkReminder("versionUpdates")), "reminderVersionUpdate")
        contentNode.appendChild(document.createElement("br"))

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
                {0: "Toggle", 1: "Show Details", 2: "Open Menu"},
                Object.values(configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.directory ?? [0, 1, 2])
            ), "mouseMappingDirectory"
        )

        /* Detail Action replaces "Copy URL"
        contentNode.appendChild(document.createElement("br"))
        this.addObject(createElementFrom(`
            <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                <span class="sapMLabelTextWrapper">
                    <bdi">Details</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))
        this.addObject(
            new MouseButtonSelector(
                "details",
                {0: "Open", 1: "Open New Tab", 2: "Show Details"},
                Object.values(configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.details ?? [0, 1, 2])
            ), "mouseMappingDetails"
        )*/

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
                    <bdi">Deploy</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))
        this.addObject(
            new MouseButtonSelector(
                "deploy",
                {0: "Deploy", 1: "Undeploy", 2: "Restart"},
                Object.values(configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.deploy ?? [0, 1, 2])
            ), "mouseMappingDeploy"
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
                {0: "Open", 1: "Open New Tab", 2: "Show Details"},
                Object.values(configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.open ?? [0, 1, 2])
            ), "mouseMappingOpen"
        )

        contentNode.appendChild(document.createElement("br"))
        this.addObject(createElementFrom(`
            <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                <span class="sapMLabelTextWrapper">
                    <bdi">Compare Artifacts</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))
        this.addObject(
            new MouseButtonSelector(
                "compare",
                {0: "Local Artifacts", 1: "Designtimes", 2: "Runtimes"},
                Object.values(configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.compare ?? [0, 1, 2])
            ), "mouseMappingCompare"
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
                Object.values(configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.typeAction ?? [0, 1, 2])
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
        this.addObject(createElementFrom(`
            <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                <span class="sapMLabelTextWrapper">
                    <bdi">Shortcuts (Except Stage Switch)</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))
        this.addObject(
            new MouseButtonSelector(
                "fixedItem",
                {0: "Open", 1: "Open New Tab", 2: "Copy URL"},
                Object.values(configuration?.sap?.integrationSuite?.cloudIntegration?.mouseMapping?.fixedItem ?? [0, 1, 2])
            ), "mouseMappingFixedItem"
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

        artifactTypeConfiguration.filter(it => it.type != "designtimeArtifacts" && it.type != "apiProxies" && it.type != "secureMaterials" && it.type != "customFolder").forEach(it => {

            this.addObject(new ColorPicker(it.type, it.displayNameP, it.displayColor), `displayColor_${it.type}`)
        })


        contentNode.appendChild(document.createElement("br"))
        contentNode.appendChild(document.createElement("br"))
        contentNode.appendChild(createElementFrom(`
            <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                <span class="sapMLabelTextWrapper">
                    <bdi style="font-weight: bold">Debug Settings</bdi>
                </span>
                <span data-colon=":" class="sapMLabelColonAndRequired"></span>
            </span>
        `))

        //this.addObject(new LogLevelComboBoxLEGACY(configuration?.sap?.integrationSuite?.performanceMeasurement?.logLevel), "logLevel")
        this.addObject(new ComboBox("Log Level", logLevelOptions, configuration?.sap?.integrationSuite?.performanceMeasurement?.logLevel ?? 4), "logLevel")
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
                            enabled: this.configObjects?.get("enableSideNavigation")?.getValue() ?? true,
                            artifactListShortcuts: this.configObjects?.get("artifactListShortcuts")?.getValue() ?? true,
                            artifactListCredentials: this.configObjects?.get("artifactListCredentials")?.getValue() ?? true,
                            artifactListAPI: this.configObjects?.get("artifactListAPI")?.getValue() ?? true,
                            artifactListIntegration: this.configObjects?.get("artifactListIntegration")?.getValue() ?? true,
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
                            enabled: this.configObjects?.get("shortcutsEnabled")?.getValue() ?? true,
                            links: Object.fromEntries(
                                Array.from(this.configObjects.entries())
                                    .filter(([key, value]) => key.startsWith("shortcut"))
                                    .map(([key, value]) => [uncapitalize(key.replace("shortcut", "")), value.getValue()])
                            )
                        },
                        unlock: {
                            enabled: this.configObjects?.get("unlockEnabled")?.getValue() ?? false
                        }/*,
                        documentation: {
                            enabled: this.configObjects?.get("inlineDocumentationEnabled")?.getValue() ?? false,
                            enableEditingDocumentation: this.configObjects?.get("inlineDocumentationEditable")?.getValue() ?? false,
                            aiSummary: this.configObjects?.get("inlineDocumentationAISummary")?.getValue() ?? false
                        }*/
                    },
                    decorations: {
                        enabled: this.configObjects?.get("decorationsEnabled")?.getValue() ?? true,
                        tenantStage: this.configObjects?.get("decorationsStage")?.getValue() ?? true,
                        tenantStageAside: this.configObjects?.get("decorationsStageSidebar")?.getValue() ?? false,
                        tenantStageHeader: this.configObjects?.get("decorationsStageHeader")?.getValue() ?? true,
                        companyLogo: this.configObjects?.get("decorationsLogo")?.getValue() ?? true
                    },
                    environments: [],
                    performanceMeasurement: {
                        enabled: configuration.sap.integrationSuite?.performanceMeasurement?.enabled ?? true,
                        logLevel: Number(this.configObjects?.get("logLevel")?.domInstance.querySelector("select").value) ?? 19,
                        measureIntervalInSec: configuration.sap.integrationSuite?.performanceMeasurement?.measureIntervalInSec ?? 60
                    },
                    reminders: {
                        lockedArtifacts: this.configObjects?.get("reminderLocks")?.getValue() ?? false,
                        versionUpdates: this.configObjects?.get("reminderVersionUpdate")?.getValue() ?? false
                    }
                }
            },
            version: configVersion,
            isConfigured: true
        }

        Array.from(this.configObjects.entries())
            .filter(it => {
                return it[0].startsWith("mouseMapping")
            })
            .forEach(it => {
                let values = Object.entries(it[1].getValues())[0]
                saveConfig.sap.integrationSuite.cloudIntegration.mouseMapping[uncapitalize(values[0].replace("mouseMapping", ""))] = values[1]
            })

        Array.from(this.configObjects.entries())
            .filter(it => {
                return it[0].startsWith("displayColor_")
            })
            .forEach(it => {
                let values = Object.entries(it[1].getValue())[0]
                saveConfig.sap.integrationSuite.cloudIntegration.integrationContentQuickAccess.artifactColors[values[0].replace("displayColor_", "")] = values[1].color
                if (!saveConfig.sap.integrationSuite.cloudIntegration.integrationContentQuickAccess.artifactTypes) {
                    saveConfig.sap.integrationSuite.cloudIntegration.integrationContentQuickAccess.artifactTypes = {}
                }
                saveConfig.sap.integrationSuite.cloudIntegration.integrationContentQuickAccess.artifactTypes[values[0].replace("displayColor_", "")] = values[1]
            })

        return saveConfig
        //return this.radialModeSelection.getValue()
    }
}

class OverridesTab extends SettingsDialogTab {
    valid = true
    configObjects = new Map()

    constructor(root) {
        super(root)
        this.stripId = "customSettings"
        this.domInstanceHeader = createElementFrom(`
            <div class="sapMTabStripItem" tabindex="-1">
                <div class="sapMTSTexts">
                    <div class="sapMTabStripItemAddText"></div>
                    <div class="sapMTabStripItemLabel">
                        Overrides
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

        let textarea = createElementFrom(`
            <div class="sapMInputBase sapMInputBaseHeightMargin sapMTextArea" style="width: 100%; height: 99%">
                <div class="sapMInputBaseContentWrapper" style="width: 100%; min-height: 42px;">
                    <textarea class="sapMInputBaseInner sapMTextAreaInner sapMTextAreaGrow" style="overflow-y: scroll;">${JSON.stringify(configuration.overrides, null, 7) ?? ""}</textarea>
                    ${debug ? "" : `<div class="overrideBackground noSelect">Careful!<br>Changes may break the extension or your settings</div>`}
                </div>
                <span class="sapUiHiddenPlaceholder"></span>
            </div>
        `)
        textarea.querySelector("textarea").addEventListener('keydown', function (e) {
            if (e.key == 'Tab') {
                e.preventDefault();
                let start = this.selectionStart;
                let end = this.selectionEnd;

                this.value = this.value.substring(0, start) +
                    "\t" + this.value.substring(end);

                this.selectionStart =
                    this.selectionEnd = start + 1;
            }
        })
        contentNode.appendChild(textarea)
        this.domInstanceContentContainer = contentNode


        this.configObjects.set("overrides", textarea)
    }

    getSaveOutput() {
        return this.configObjects.get("overrides").querySelector("textarea").value
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
    if (!color || color.length < 3 || color.length > 9) return sapDefault.textColor
    let outputColor
    if (color.startsWith("#")) {
        if (color.length == 4 || color.length == 5) {
            outputColor = "#" + color.substring(1, 2) + color.substring(1, 2) + color.substring(2, 3) + color.substring(2, 3) + color.substring(3, 4) + color.substring(3, 4)
        } else if (color.length == 7 || color.length == 9) {
            outputColor = "#" + color.substring(1, 7)
        }
    } else {
        if (color.length == 6 || color.length == 8) {
            outputColor = "#" + color.substring(0, 6)
        } else if (color.length == 3 || color.length == 4) {
            outputColor = "#" + color.substring(0, 1) + color.substring(0, 1) + color.substring(1, 2) + color.substring(1, 2) + color.substring(2, 3) + color.substring(2, 3)
        }
    }

    return CSS.supports("color", outputColor) ? outputColor : sapDefault.textColor
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
                <div class="sapMInputBaseContentWrapper">
                    <input type="number" autocomplete="off" class="sapMInputBaseInner"
                           placeholder="Sorting Priority" value="${getTypeConversion("type", "priority", identifier)}" >
                </div>
            </div>
        `)
    }

    getValue() {
        return {
            [this.identifier]: {
                color: this.domInstance.getElementsByTagName("input")[0].value,
                priority: parseInt(this.domInstance.getElementsByTagName("input")[1].value)
            }
        }
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
    constructor(title, value, options) {
        super();
        this.value = value === true
        this.domInstance = createElementFrom(`
            <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription noSelect"
                 style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                <div class="sapMFlexItemAlignAuto sapMFlexBoxBGTransparent sapMFlexItem" style="order: 0; flex: 0 1 auto; min-height: auto; min-width: auto;">
                    <div tabindex="0" class="sapMCb sapMCbHasLabel ${options?.disabled ? "sapMCbBgDis" : ""}">
                        <div class="sapMCbBg sapMCbHoverable sapMCbMark">
                            <input type="CheckBox" ${options?.disabled ? "disabled" : ""}>
                        </div>
                        <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth sapMCbLabel" style="text-align: left;">
                            <span class="sapMLabelTextWrapper">
                                <bdi style="font-weight: ${options?.asHeader ? "bold" : "inherit"}">${title}</bdi>
                            </span>
                            <span data-colon=":" class="sapMLabelColonAndRequired"></span>
                        </span>
                    </div>
                </div>
            </div>
        `)
        if (!options?.disabled) this.domInstance.addEventListener("click", () => {
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

class LogLevelComboBoxLEGACY extends SettingsInputBase {

    constructor(initialValue) {
        super();
        this.value = Math.min(19, initialValue ?? 19)
        this.domInstance = createElementFrom(`
            <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription"
                 style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                <div class="sapMInputDescriptionWrapper" style="width: 150px;">
                    <span class="sapMInputDescriptionText" style="padding-right: 0.5rem;">Log Level</span>
                </div>
                <div class="sapMInputBaseContentWrapper">
                    <select id="twineLogLevelSelect" name="logLevel" class="sapMInputBaseInner">
                        <option value="0">Only Errors/Warnings</option>
                        <option value="4">Standard logging</option>
                        <option value="19">Extended logging</option>
                        <option value="100">Debugging</option>
                    </select>
                </div>
            </div>
        `)

        this.domInstance.querySelector("div > select").value = this.value
    }

    getValue() {
        return this.domInstance.querySelector("div > select").value
    }
}

class ErrorToleranceComboBoxLEGACY extends SettingsInputBase {

    constructor(initialValue) {
        super();
        this.value = Math.max(1, initialValue ?? 1)
        this.domInstance = createElementFrom(`
            <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription"
                 style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                <div class="sapMInputDescriptionWrapper" style="width: 150px;">
                    <span class="sapMInputDescriptionText" style="padding-right: 0.5rem;">Extension Permissions</span>
                </div>
                <div class="sapMInputBaseContentWrapper">
                    <select name="errorTolerance" class="sapMInputBaseInner">
                        <option value="1">No API calls</option>
                        <option value="2">API READ calls only</option>
                        <option value="4">Allow API WRITE calls</option>
                        <option value="6">Allow API DELETE calls</option>
                        <option value="7">Experimental/unpredictable Features</option>
                    </select>
                </div>
            </div>
        `)

        Array.from(this.domInstance.querySelector("div > select").options)[this.value - 1].setAttribute("selected", "")
    }

    getValue() {
        return this.domInstance.querySelector("div > select").value
    }
}

class ComboBox extends SettingsInputBase {

    constructor(title, values, initialValue) {
        super();
        let effInitialValue
        if (typeof initialValue == 'number') {
            effInitialValue = values.filter(it => it.value <= initialValue).reduce((previous, current) => Math.abs(previous.value - initialValue) < Math.abs(current.value - initialValue) ? previous : current).value
        } else {
            effInitialValue = initialValue
        }
        this.domInstance = createElementFrom(`
            <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription"
                 style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                <div class="sapMInputDescriptionWrapper" style="width: 150px;">
                    <span class="sapMInputDescriptionText" style="padding-right: 0.5rem;">${title}</span>
                </div>
                <div class="sapMInputBaseContentWrapper">
                    <select name="errorTolerance" class="sapMInputBaseInner">
                        ${values.map(it => { return `<option value="${it.value}">${it.name}</option>` }).join("")}
                    </select>
                </div>
            </div>
        `)
        let index = values.findIndex(it => it.value == effInitialValue)
        Array.from(this.domInstance.querySelector("div > select").options)[index].setAttribute("selected", "")
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
            createToast("Please enter a valid configuration for all other environments first", {className: "twineReject"})
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
                                    </button>` : ""}
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
            createToast("Please enter a valid configuration for all other tenants first", {className: "twineReject"})
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
        let tenants = this.tenants.map(it => it.isValid())
        let owner = this.commonSettingsTab.getDataset().owner
        let errors = []
        if (owner.length == 0) errors.push("Environment owner cannot be empty")
        if (owner == "New Environment") errors.push("Environment name cannot be \"New Environment\"")
        return {
            environment: owner,
            errors: errors,
            tenants: tenants,
            overall: (tenants.every(it => it.errors.length == 0) && errors.length == 0)
        }
    }

    removeTenant(tenant) {
        this.tenants.splice(this.tenants.indexOf(tenant), 1)
        tenant.domInstanceHeader.remove()
        tenant.domInstanceContent.remove()
    }

    close() {
        let dialog = new Dialog(`Delete environment ${this.environment?.owner ?? this.stripId}`)
            .withContent(new SimpleElement(`<div style="padding: 0.75rem">Do you want to delete this environment and all associated tenants?</div>`))
            .withOptions([new Button("Delete", "NEGATIVE", null, false, false, false, () => {
                this.root.removeEnvironment(this)
                dialog.close(BLOCKER.ABOVE_SAP_DIALOG)
            })])
        dialog.show(BLOCKER.ABOVE_TWINE_DIALOG)
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
                        <img src="${environment?.logo ?? sapLogoSvgData}" ${environment?.logo ? `data-src="${environment.logo}"` : ""} alt="" class="sapMImg" style="width: 7em; height: 3em; padding: 0 8px">
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
                    ${new ComboBox("Enabled Features", errorToleranceOptions, Math.max(tenant?.errorTolerance ?? 2, 1)).domInstance.outerHTML}
                    <br>
                    
                    <span class="sapMLabel sapUiSelectable sapMLabelMaxWidth" style="text-align: left;">
                        <span class="sapMLabelTextWrapper">
                            <bdi style="font-weight: bold">Tenant:</bdi>
                        </span>
                        <span data-colon=":" class="sapMLabelColonAndRequired"></span>
                    </span>
                    <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription"
                         style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                            <button class="sapMBtnBase sapMBtn">
                                <span class="sapMBtnInner sapMBtnHoverable sapMFocusable sapMBtnText sapMBtnDefault">
                                    <span class="sapMBtnContent">
                                        <bdi>Read from URL</bdi>
                                    </span>
                                </span>
                            </button>
                    </div>
                    <div class="sapMInputBase sapMInputBaseHeightMargin sapMInput sapMInputWithDescription"
                         style="width: 100%;display: flex;align-items: baseline;justify-content: flex-start;">
                        <div class="sapMInputDescriptionWrapper" style="">
                            <span class="sapMInputDescriptionText" style="padding-right: 0.5rem;"><b>https://</b></span>
                        </div>
                        <div class="sapMInputBaseContentWrapper" style="">
                            <input type="text" autocomplete="off" class="sapMInputBaseInner ${canEdit ? "" : "sapMInputBaseDisabled "}" placeholder="Tenant ID" value="${tenant?.id ?? ""}" ${canEdit ? "" : "disabled"}>
                        </div>
                        <div class="sapMInputDescriptionWrapper" style="">
                            <span class="sapMInputDescriptionText" style="padding-right: 0.5rem;">
                                <b>.integrationsuite</b>
                            </span>
                        </div>
                        <div class="sapMInputBaseContentWrapper" style="">
                            <input type="text" autocomplete="off" class="sapMInputBaseInner ${canEdit ? "" : "sapMInputBaseDisabled "}" placeholder="System ID or empty" value="${tenant?.system ?? ""}" ${canEdit ? "" : "disabled"}>
                        </div>
                        <div class="sapMInputDescriptionWrapper" style="">
                            <span class="sapMInputDescriptionText" style="padding-right: 0.5rem;">
                                <b>.cfapps.</b>
                            </span>
                        </div>
                        <div class="sapMInputBaseContentWrapper" style="">
                            <input type="text" autocomplete="off" class="sapMInputBaseInner ${canEdit ? "" : "sapMInputBaseDisabled "}" placeholder="Datacenter ID" value="${tenant?.datacenter ?? ""}" ${canEdit ? "" : "disabled"}>
                        </div>
                        <div class="sapMInputDescriptionWrapper" style="">
                            <span class="sapMInputDescriptionText"><b>.hana.ondemand.com</b></span>
                        </div>
                    </div>
                </div>
            </div>
        `)
        this.domInstanceContent.style.display = "none"
        let inputs = this.domInstanceContent.querySelectorAll("input, select, button")

        this.colorInput = inputs[1]
        this.errorToleranceInput = inputs[2]
        this.tagInput = inputs[0]
        let urlReader = inputs[3]
        this.idInput = inputs[4]
        this.systemInput = inputs[5]
        this.datacenterInput = inputs[6]

        urlReader.addEventListener("click", e => {
            this.updateIDs({target:{value:window.location.href}})
        })
        this.tagInput.addEventListener("input", e => {
            this.domInstanceHeader.querySelector("div > div:nth-of-type(2)").innerText = e.target.value
            this.stripId = e.target.value
        })

        this.idInput.addEventListener("input", e => {
            this.updateIDs(e)
        })
        this.systemInput.addEventListener("input", e => {
            this.updateIDs(e)
        })
        this.datacenterInput.addEventListener("input", e => {
            this.updateIDs(e)
        })
    }

    updateIDs(e) {
        if (e.target.value.startsWith("https://")) {
            try {
                let id = e.target.value.split(".integrationsuite")[0].split("://")[1]
                let system = e.target.value.split(".integrationsuite")[1].split(".cfapps")[0]
                let datacenter = e.target.value.split(".hana.ondemand")[0].split("cfapps.")[1]
                if (id == null || datacenter == null || system == null || id.startsWith("https://") || datacenter.startsWith("https://") || system.startsWith("https://") || /\.\//.test(id) || /\.\//.test(datacenter) || /\.\//.test(system)) {
                    throw new Error()
                }
                this.stripId = id
                this.idInput.value = id
                this.systemInput.value = system
                this.datacenterInput.value = datacenter
            } catch (exception) {
                createToast("You need to paste a URL like the one you are at right now")
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
        let datacenter = this.datacenterInput.value
        let tag = this.tagInput.value
        let errors = []

        if (datacenter.length != 4 && datacenter.length != 8) errors.push("Datacenter length must be 4 or 8")
        if (tag.length == 0) errors.push("Tag cannot be empty")
        if (tag == "New Tenant") errors.push("Tag cannot be \"New Tenant\"")
        return {tenant: tag, errors: errors}
    }

    close() {
        let dialog = new Dialog(`Delete tenant ${this.tenant?.name ?? this.stripId}`)
            .withContent(new SimpleElement(`<div style="padding: 0.75rem">Do you want to delete this tenant?</div>`))
            .withOptions([new Button("Delete", "NEGATIVE", null, false, false, false, () => {
                this.root.removeTenant(this)
                dialog.close(BLOCKER.ABOVE_SAP_DIALOG)
            })])
        dialog.show(BLOCKER.ABOVE_TWINE_DIALOG)
    }
}

let sapLogoSvgData = String.raw`data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgNDEyLjM4IDIwNCI+PGRlZnM+PHN0eWxlPi5jbHMtMSwuY2xzLTJ7ZmlsbC1ydWxlOmV2ZW5vZGQ7fS5jbHMtMXtmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50KTt9LmNscy0ye2ZpbGw6I2ZmZjt9PC9zdHlsZT48bGluZWFyR3JhZGllbnQgaWQ9ImxpbmVhci1ncmFkaWVudCIgeDE9IjIwNi4xOSIgeDI9IjIwNi4xOSIgeTI9IjIwNCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzAwYjhmMSIvPjxzdG9wIG9mZnNldD0iMC4wMiIgc3RvcC1jb2xvcj0iIzAxYjZmMCIvPjxzdG9wIG9mZnNldD0iMC4zMSIgc3RvcC1jb2xvcj0iIzBkOTBkOSIvPjxzdG9wIG9mZnNldD0iMC41OCIgc3RvcC1jb2xvcj0iIzE3NzVjOCIvPjxzdG9wIG9mZnNldD0iMC44MiIgc3RvcC1jb2xvcj0iIzFjNjViZiIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzFlNWZiYiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjx0aXRsZT5TQVBfZ3JhZF9SX3Njcm5fWmVpY2hlbmZsw6RjaGUgMTwvdGl0bGU+PHBvbHlsaW5lIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSIwIDIwNCAyMDguNDEgMjA0IDQxMi4zOCAwIDAgMCAwIDIwNCIvPjxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTI0NC43MywzOC4zNmwtNDAuNiwwdjk2LjUyTDE2OC42NywzOC4zM0gxMzMuNTFsLTMwLjI3LDgwLjcyQzEwMCw5OC43LDc5LDkxLjY3LDYyLjQsODYuNCw1MS40Niw4Mi44OSwzOS44NSw3Ny43Miw0MCw3MmMuMDktNC42OCw2LjIzLTksMTguMzgtOC4zOCw4LjE3LjQzLDE1LjM3LDEuMDksMjkuNzEsOGwxNC4xLTI0LjU1Qzg5LjA2LDQwLjQyLDcxLDM2LjIxLDU2LjE3LDM2LjE5aC0uMDljLTE3LjI4LDAtMzEuNjgsNS42LTQwLjYsMTQuODNBMzQuMjMsMzQuMjMsMCwwLDAsNS43Nyw3NC43QzUuNTQsODcuMTUsMTAuMTEsOTYsMTkuNzEsMTAzYzguMSw1Ljk0LDE4LjQ2LDkuNzksMjcuNiwxMi42MiwxMS4yNywzLjQ5LDIwLjQ3LDYuNTMsMjAuMzYsMTNBOS41Nyw5LjU3LDAsMCwxLDY1LDEzNWMtMi44MSwyLjktNy4xMyw0LTEzLjA5LDQuMS0xMS40OS4yNC0yMC0xLjU2LTMzLjYxLTkuNTlMNS43NywxNTQuNDJhOTMuNzcsOTMuNzcsMCwwLDAsNDYsMTIuMjJsMi4xMSwwYzE0LjI0LS4yNSwyNS43NC00LjMxLDM0LjkyLTExLjcxLjUzLS40MSwxLS44NCwxLjQ5LTEuMjhMODYuMTcsMTY0LjVIMTIzbDYuMTktMTguODJhNjcuNDYsNjcuNDYsMCwwLDAsMjEuNjgsMy40Myw2OC4zMyw2OC4zMywwLDAsMCwyMS4xNi0zLjI1bDYsMTguNjRoNjAuMTR2LTM5aDEzLjExYzMxLjcxLDAsNTAuNDYtMTYuMTUsNTAuNDYtNDMuMkMzMDEuNzQsNTIuMTksMjgzLjUyLDM4LjM2LDI0NC43MywzOC4zNlpNMTUwLjkxLDEyMWEzNi45MywzNi45MywwLDAsMS0xMy0yLjI4bDEyLjg3LTQwLjU5SDE1MWwxMi42NSw0MC43MUEzOC41LDM4LjUsMCwwLDEsMTUwLjkxLDEyMVptOTYuMi0yMy4zM2gtOC45NFY2NC45MWg4Ljk0YzExLjkzLDAsMjEuNDQsNCwyMS40NCwxNi4xNCwwLDEyLjYtOS41MSwxNi41Ny0yMS40NCwxNi41NyIvPjwvc3ZnPg==`

let spinnerElement
let macroSpinner

function displaySpinner(message) {
    if (!spinnerElement) {
        spinnerElement = createElementFrom(`
            <div class="twineLoadingHeader">
                <div id="__twine-staticElementBusyIndicator" class="twineLoading">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <div class="twineLoadingTask">
                    <span id="__twine-staticElementBusyIndicatorTask">${message ?? ""}</span>
                </div>
            </div>
        `)

        popoverLayer.appendChild(spinnerElement)
    }
    if (message) spinnerElement.lastElementChild.firstElementChild.innerText = message
    spinnerElement.style.display = "inherit"
}

function displayMacroSpinner() {
    if (!macroSpinner) {
        macroSpinner = createElementFrom(`
            <div class="twineLoadingHeader rainbow">
                <div id="__twine-staticElementBusyIndicator" class="twineLoading">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <div class="twineLoadingTask">
                    <span id="__twine-staticElementBusyIndicatorTask">Running Macro</span>
                </div>
            </div>
        `)

        popoverLayer.appendChild(macroSpinner)
    }
    macroSpinner.style.display = "inherit"
}

class Decorator {
    node

    constructor(icon, tooltip, clickHandler) {
        this.node = createElementFrom(`<span data-sap-ui-icon-content="${icon}" class="sapUiIcon sapUiIconMirrorInRTL sapUiIcon sapMTreeItemBaseExtender elementFadeIn" style="font-family: SAP-icons; font-weight: bold; display: none"></span>`)
        if (clickHandler) this.node.addEventListener("click", clickHandler)
        if (tooltip) this.node.title = tooltip
    }

    toggle(state) {
        if (state !== undefined) {
            if (state) {
                this.node.style.display = "inline-block"
            } else {
                this.node.style.display = "none"
            }
            return
        }
        this.node.style.display = this.node.style.display == "none" ? "inline-block" : "none"
    }
}

function hideSpinner() {
    if (spinnerElement) spinnerElement.style.display = "none"
}
function hideMacroSpinner() {
    if (macroSpinner) macroSpinner.style.display = "none"
}

let errorToleranceOptions = Object.freeze([
    {value: 1, name: "No API calls"},
    {value: 2, name: "Only API READ calls"},
    {value: 4, name: "Allow API WRITE calls"},
    {value: 6, name: "All \"Finished\" Features"},
    {value: 7, name: "Experimental/unpredictable Features"}
])

let logLevelOptions = Object.freeze([
    {value: 0, name: "Only Errors/Warnings"},
    {value: 4, name: "Standard logging"},
    {value: 19, name: "Extended logging"},
    {value: 100, name: "Debugging"}
])

/*
Regex for UI5 Component Cleaning => aria-.*?=".+?"\s?|id=".*?"\s?|role=".*?"\s?|data-sap-(?!ui-icon-content).*?=".*?"\s?|data-ui-accesskey=".*?"\s?
*/
