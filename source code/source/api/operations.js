function operationsUrl() {
    return `https://${window.location.host}/Operations`
}

function setLogLevelUrl() {
    return operationsUrl() + "/com.sap.it.op.tmn.commands.dashboard.webui.IntegrationComponentSetMplLogLevelCommand"
}

function secureMaterialsUrl() {
    return operationsUrl() + "/com.sap.it.km.api.commands.SecurityMaterialsListCommand"
}

function runtimeArtifactsUrl() {
    return operationsUrl() + "/com.sap.it.op.tmn.commands.dashboard.webui.IntegrationComponentsListCommand"
}

function runtimeArtifactDetailsUrl(runtimeId) {
    return operationsUrl() + `/com.sap.it.op.tmn.commands.dashboard.webui.IntegrationComponentDetailCommand?artifactId=${runtimeId}`
}

function runtimeArtifactDownloadUrl(runtimeId, tenantId) {
    return operationsUrl() + `/com.sap.it.nm.commands.deploy.DownloadContentCommand?artifactIds=${runtimeId}&tenantId=${tenantId}`
}

function runtimeArtifactUndeployUrl(runtimeId, tenantId) {
    return operationsUrl() + `/com.sap.it.nm.commands.deploy.DeleteContentCommand?artifactIds=${runtimeId}&tenantId=${tenantId}`
}

function runtimeLocationListUrl() {
    return operationsUrl() + "/com.sap.it.op.srv.web.cf.RuntimeLocationListCommand"
}