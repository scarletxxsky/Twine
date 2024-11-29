function operationsUrl() {
    return `https://${window.location.host}/Operations`
}

function logLevelUrl() {
    return operationsUrl() + "/com.sap.it.op.tmn.commands.dashboard.webui.IntegrationComponentSetMplLogLevelCommand"
}

function secureMaterialsUrl() {
    return operationsUrl() + "/com.sap.it.km.api.commands.SecurityMaterialsListCommand"
}