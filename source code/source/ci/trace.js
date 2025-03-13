function setLogLevel(artifact, logLevel = LOGLEVEL.TRACE, runtimeLocationId = "") {
    const artifactId = artifact.meta.artifactId
    const artifactName = artifact.meta.artifactName
    if (cloudRuntimeOnly === false) {
        createToast("Not available on multi  tenants yet", {
            className: "twineReject"
        })
        return
    }
    if (artifact.runtimeMeta) {
        callXHR(
            "POST",
            setLogLevelUrl(),
            `{"artifactSymbolicName":"${artifactId}","mplLogLevel":"${logLevel.toUpperCase()}","nodeType":"IFLMAP"${runtimeLocationId}}`,
            "application/json",
            true,
            null
        ).then(response => {
            createToast(`Log level for ${artifactName} set to ${logLevel.toUpperCase()}`, {})
        }).catch(error => {
            console.error(error)
            createToast("Could not change log level", {
                className: "twineReject"
            })
        })
    } else {
        createToast("Artifact is not deployed", {
            className: "twineReject"
        })
    }
}

