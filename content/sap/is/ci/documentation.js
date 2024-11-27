let svgLayer
let documentationPopover
let documentationDetailList
let popoverContentObserver = new MutationObserver(mutations => {
    if (mutations.find(it => it.attributeName === "style")) {
        let popoverContent = documentationPopover.getElementsByTagName("div")[0]
        if (popoverContent.style.width !== "max-content") popoverContent.style.width = "max-content"
        if (popoverContent.style.maxWidth !== "80em") popoverContent.style.maxWidth = "80em"
    }
})

function initializeDocumentation() {
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === "childList") {
                mutation.addedNodes.forEach((node) => {
                    if (node.id.match(new RegExp("__popover\\d{1,6}-popover"))) {
                        info("Step documentation displayed")
                        documentationPopover = node
                        popoverContentObserver.observe(node.getElementsByTagName("div")[0], {attributes: true})
                        node.removeAttribute("data-sap-ui-render")
                        node.getElementsByTagName("div")[0].style.width = "auto"

                        removePopoverOnHidden(node)
                        documentationDetailList = node.querySelector("div > div > div > div > div")
                        let stepId = documentationDetailList.querySelector("div > div > div:nth-of-type(2) > span").innerText
                        let doc = buildDocumentation(stepId)
                        documentationDetailList.appendChild(doc)
                    }
                })
            }
        }
    })

    observer.observe(popoverLayer, {
        childList: true
    })

    info("Observer attached to popover layer")
}

async function waitForSvgLayer() {
    return waitForElement("svgZoomToolLayer-1")
}

async function updateArtifactInfo() {
    let runStart = window.performance.now()

    let path = window.location.pathname.split("/")
    if (path.length < 7) {
        tenantVariables.currentArtifact.artifact = null
        info("Current location isn't an artifact")
        elapsedTime += window.performance.now() - runStart
        return
    }
    if (tenantVariables.currentArtifact?.Name == path[6]) {
        info("Artifact unchanged")
        elapsedTime += window.performance.now() - runStart
        return
    }
    tenantVariables.currentArtifact.artifact = null
    tenantVariables.currentArtifact.package = null
    tenantVariables.currentArtifact.documentation = null
    callXHR("GET", `${workspaceUrl()}/Artifacts(Name='${path[6]}',Type='${artifactTypeConfiguration.find(it => it.urlType == path[5]).type}')?$expand=ContentPackages,ContentPackages/Files&$select=Name,Type,DisplayName,reg_id,ContentPackages/TechnicalName,ContentPackages/DisplayName,ContentPackages/reg_id,ContentPackages/TechnicalName,ContentPackages/Files/DisplayName,ContentPackages/Files/FileName,ContentPackages/Files/TechnicalName,ContentPackages/Files/reg_id,ContentPackages/Files/Version&$format=json`, null).then(response => {
        let runStart = window.performance.now()
        let data = JSON.parse(response).d
        {
            let { __metadata, ContentPackages, ...artifactInfo } = data
            tenantVariables.currentArtifact.artifact = artifactInfo
            {
                let { __metadata, Files, ...packageInfo} = ContentPackages.results[0]
                tenantVariables.currentArtifact.package = packageInfo
                {
                    let file = Files.results.find(it => it.FileName == `Twine_${tenantVariables.currentArtifact.artifact.Name}.txt`)
                    if (file) {
                        const { __metadata, ...fileInfo} = file
                        tenantVariables.currentArtifact.documentationObject = fileInfo

                        callXHR("GET", workspaceFileUrl(tenantVariables.currentArtifact.documentationObject.TechnicalName)).then((resolve) => {
                            tenantVariables.currentArtifact.documentation = JSON.parse(resolve)
                        }).catch((reject) => {
                            console.error(reject)
                            tenantVariables.currentArtifact.documentation = null
                        })
                    }
                }
            }
        }
        log("Artifact info fetched")
        elapsedTime += window.performance.now() - runStart
    }).catch ((e) => {
        error("Couldn't fetch artifact info")
        console.error(e)
    })

    elapsedTime += window.performance.now() - runStart
}

async function acquireDocumentationFileLock() {
    return Promise.all([
        callXHR("PUT", deepWorkspaceFileLockUrl(true, true), null, null, true), callXHR("PUT", deepWorkspaceFileLockUrl(true), null, null, true)
    ])
}

function addDocumentationEditButton() {
    let info = svgLayer.getElementById("Info")
    if (info && !(info.parentElement.querySelector("[id=__twine-editDocumentation]"))) {
        documentationEditButton.stepId =
            info.parentElement.appendChild(createDocumentationEditButton())
    }
}

function removePopoverOnHidden(popover) {
    let popoverObserver = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === "attributes") {
                if (mutation.target.style.visibility == "hidden") {
                    popover.remove()
                    popoverContentObserver.disconnect()
                    popoverObserver.disconnect()
                }
            }
        }
    })
    popoverObserver.observe(popover, {
        attributes: true
    })
}

function buildDocumentation(stepId) {
    let title
    let content
    let step
    if (tenantVariables.currentArtifact.documentation != null) {
        switch (true) {
            case /(^Process|^SubProcess)/.test(stepId):
                step = tenantVariables.currentArtifact.documentation.documentation.lanes.find(it => it.id == stepId)
                title = step?.content_sections.find(it => it.name == "Description").name ?? "Note"
                content = step?.content_sections.find(it => it.name == "Description").content ?? "Documentation not found"
                break;
            case /(^CallActivity|^StartEvent|^EndEvent|^SequenceFlow|^ExclusiveGateway)/.test(stepId):
                step = tenantVariables.currentArtifact.documentation.documentation.lanes.map(it => it.steps).flat().find(it => it.id == stepId)
                title = step?.content_sections.find(it => it.name == "Description").name ?? "Note"
                content = step?.content_sections.find(it => it.name == "Description").content ?? "Documentation not found"
                break;
            case /^Participant/.test(stepId):
                step = tenantVariables.currentArtifact.documentation.documentation.participants.find(it => it.id == stepId)
                title = step?.content_sections.find(it => it.name == "Description").name ?? "Note"
                content = step?.content_sections.find(it => it.name == "Description").content ?? "Documentation not found"
                break;
            default:
                title = "Note"
                content = "Documentation not found"
                break
        }
    } else {
        title = "Note"
        content = "Documentation not found"
    }

    let htmlString = `
        <div class="sapUiVltCell sapuiVltCell sapUiSmallMarginTop">
            <div data-sap-ui-render class="sapUiRespGrid sapUiRespGridMedia-Std-LargeDesktop sapUiRespGridHSpace1 sapUiRespGridVSpace1 cpides-infoGridLayout">
                <div class="sapUiRespGridSpanXL10 sapUiRespGridSpanL10 sapUiRespGridSpanM10 sapUiRespGridSpanS10">
                    <span data-sap-ui-render class="sapMLabel sapUiSelectable sapMLabelMaxWidth mem-m-label">
                        <span class="sapMLabelTextWrapper">
                            <bdi>${title}:</bdi>
                        </span>
                        <span data-colon=":" class="sapMLabelColonAndRequired"></span>
                    </span>
                </div>
            </div>
            <div data-sap-ui-render class="sapUiRespGrid sapUiRespGridMedia-Std-LargeDesktop sapUiRespGridHSpace1 sapUiRespGridVSpace1 cpides-infoGridLayout">
                <div class="sapUiRespGridSpanXL10 sapUiRespGridSpanL10 sapUiRespGridSpanM10 sapUiRespGridSpanS10">
                    <span data-sap-ui-render dir="auto" class="sapMText sapUiSelectable sapMTextBreakWord sapMTextMaxWidth" style="text-align: left;">${content}</span>
                </div>
            </div>
        </div>
    `

    return createElementFrom(htmlString)
}

function getFormData(formDataBoundary) {
    let filename = "documentation.txt"
    return `--${formDataBoundary}\r
Content-Disposition: form-data; name="simpleUploader"; filename="${filename}"\r
Content-Type: text/plain\r
\r
${getDocumentationBody()}\r
--${formDataBoundary}\r
Content-Disposition: form-data; name="_charset_"\r
\r
UTF-8\r
--${formDataBoundary}\r
Content-Disposition: form-data; name="simpleUploader-data"\r
\r
{"name":"DUMMY","description":"","type":"File","fileName":"${filename}","id":"30160d6313494bce966b6668895473a5","entityID":"30160d6313494bce966b6668895473a5"}\r
--${formDataBoundary}--\r
`
}

function getDocumentationBody() {
    return JSON.stringify(tenantVariables.currentArtifact.documentation)
}