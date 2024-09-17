let logoObserver
let logoElement
let titleElement

function initializeDecorations() {
    if (tenantVariables.globalEnvironment != null) {
        if (tenantVariables.globalEnvironment.logo == null) tenantVariables.globalEnvironment.logo = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/SAP_2011_logo.svg/320px-SAP_2011_logo.svg.png"
        waitForId("__image0")
            .then((it) => {
                logoElement = it
                titleElement = document.getElementById("__title0")
                updateHeader()
            }).then(() => {
            logoObserver = new MutationObserver(mutations => {
                updateHeader(mutations[0])
            });

            logoObserver.observe(logoElement, {
                attributeFilter: ["src"],
                attributeOldValue: true
            });
        })
    }
}

function updateHeader(mutation) {
    if (tenantVariables.globalEnvironment.logo != null) {
        if (mutation == null || mutation.target.src != tenantVariables.globalEnvironment.logo) {
            logoElement.removeAttribute("data-sap-ui-render")
            titleElement.removeAttribute("data-sap-ui-render")
            logoElement.removeAttribute("data-sap-ui")
            titleElement.removeAttribute("data-sap-ui")

            logoElement.tabIndex = -1
            logoElement.inert = true
            if (tenantVariables.globalEnvironment.logo !== "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/SAP_2011_logo.svg/320px-SAP_2011_logo.svg.png") {
                logoElement.style.width = "7rem"
                logoElement.style.maxHeight = "auto"
            }
            logoElement.src = tenantVariables.globalEnvironment.logo

            titleElement.tabIndex = -1
            titleElement.inert = true
            titleElement.firstElementChild.innerHTML = `Integration Suite (<span style="color: ${getTenantColor() ?? 'inherit'}">${getTenantName()}</span>)`
        }
    }
}