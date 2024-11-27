let toolHeaderObserver
let logoElement
let sapLogoElement
let toolHeader
let titleElement
let titleElementObserver
let spacerElement

function initializeDecorations() {
    if (tenantVariables.globalEnvironment != null) {
        waitForId("__image0")
            .then((it) => {
                //Set references
                toolHeader = document.getElementById("shell--toolHeader")
                sapLogoElement = it
                titleElement = document.getElementById("__title0")
                spacerElement = document.getElementById("__spacer0")

                //Configure customized logo
                if (configuration.sap.integrationSuite.decorations.companyLogo === true || configuration.sap.integrationSuite.decorations.tenantStage === true) {
                    logoElement = it.cloneNode(true)
                    logoElement.id = "__twine__image0"
                    logoElement.src = configuration.sap.integrationSuite.decorations.companyLogo === true && tenantVariables.globalEnvironment.logo ? tenantVariables.globalEnvironment.logo : sapLogoSvgData
                    logoElement.style.maxWidth = "auto"
                    logoElement.style.width = "auto"
                    logoElement.style.maxHeight = "auto"
                    logoElement.removeAttribute("data-sap-ui-render")
                    logoElement.removeAttribute("data-sap-ui")
                }
            }).then(() => {
                //Add an observer to re-add the logo if it's removed by UI5
                toolHeaderObserver = new MutationObserver(mutations => {
                    if (mutations.filter(it => it.removedNodes.length > 0).find(it => it.removedNodes[0].id == "__twine__image0")) {
                        updateHeader()
                        updateTitle()
                    }
                    if (mutations.filter(it => it.addedNodes.length > 0).find(it => it.addedNodes[0].id == "__cpihelper")) moveCPIHelper()
                })
                toolHeaderObserver.observe(toolHeader, {
                    childList: true
                });

                updateHeader()
                updateTitle()
            })
    }
}

/**
 * Add the tenant information
 */
function updateHeader() {
    if (logoElement) {
        if (configuration.sap.integrationSuite.decorations.companyLogo === true && tenantVariables.globalEnvironment.logo) {
            sapLogoElement.insertAdjacentElement("afterend", logoElement)
            sapLogoElement.insertAdjacentElement("afterend", createElementFrom("<span class='noSelect'>×</span>"))
        } else {
            sapLogoElement.insertAdjacentElement("afterend", createElementFrom("<div id='__twine__image0'></div>"))
            sapLogoElement.insertAdjacentElement("afterend", createElementFrom("<div id='__twine__cpiHelperPlacementDummy'></div>"))
        }
    }
}

function updateTitle() {
    if (configuration.sap.integrationSuite.decorations.tenantStage === true && titleElement.firstElementChild.innerHTML != `Integration Suite (<span style="color: ${getTenantColor() ?? 'inherit'}">${getTenantName()}</span>)`) {
        titleElement.removeAttribute("data-sap-ui-render")
        titleElement.removeAttribute("data-sap-ui")
        titleElement.tabIndex = -1
        titleElement.inert = true
        titleElement.firstElementChild.innerHTML = `Integration Suite (<span style="color: ${getTenantColor() ?? 'inherit'}">${getTenantName()}</span>)`
    }
}

/**
 * CPI Helper compatibility fix
 * Moves the CPI Helper Credentials & Log Button where it normally is
 */
let catchLoop = false
function moveCPIHelper() {
    //Check if this call belongs to the addedNodes Mutation from the previous call
    //Remove this for a feedback loop
    if(configuration.sap.integrationSuite.decorations.companyLogo)
    if (!catchLoop) {
        catchLoop = true
        if (logoElement) {
            //Move the CPI Helper button behind the SAP Spacer
            toolHeader.insertBefore(document.getElementById("__cpihelper"), spacerElement.nextElementSibling)
        }
    } else {
        catchLoop = false
    }
}