async function fetchRuntimeArtifactContent(artifactId, tenantId) {
    return callXHR("GET", runtimeArtifactDownloadUrl(artifactId, tenantId ?? getTenantId()), null, null, false)
}