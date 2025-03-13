function defaultAPIProxyQueryUrl(apiProxyId) {
    return apiPortalUrl() + `/APIProxies(name='${apiProxyId}')?$expand=successorAPI,proxyEndPoints,targetEndPoints,apiProducts,proxyEndPoints/virtualhosts,proxyEndPoints/routeRules,%20proxyEndPoints/apiResources,proxyEndPoints/apiResources/documentations,deploymentInfo,policies,fileResources,proxyEndPoints/postClientFlow/request/steps,proxyEndPoints/postClientFlow/response/steps,%20proxyEndPoints/preFlow/request/steps,proxyEndPoints/preFlow/response/steps,proxyEndPoints/postFlow/request/steps,proxyEndPoints/postFlow/response/steps,proxyEndPoints/conditionalFlows/request/steps,proxyEndPoints/conditionalFlows/response/steps,proxyEndPoints/faultRules/steps,proxyEndPoints/defaultFaultRule/steps,targetEndPoints/preFlow/request/steps,targetEndPoints/preFlow/response/steps,targetEndPoints/postFlow/request/steps,targetEndPoints/postFlow/response/steps,targetEndPoints/conditionalFlows/request/steps,targetEndPoints/conditionalFlows/response/steps,targetEndPoints/properties,proxyEndPoints/properties,targetEndPoints/faultRules/steps,targetEndPoints/defaultFaultRule/steps,targetEndPoints/additionalApiProviders&$format=json`
}
function onboardingStatusUrl() {
    return uiBaseUrl() + "/api/1.0/onboardingstatus"
}

function apiProductRulesUrl() {
    return "/apiportal/api/1.0/AccessControl.svc/Rules?$format=json"
}