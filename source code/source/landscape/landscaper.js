let diffDisplay

let newLineRegEx = new RegExp("[\\r\\n]+", "g")

async function openOtherTenant(element) {
    let url = window.location.href.replace(new RegExp(String.raw`${tenantVariables.currentTenant.id}`, "g"), element.id)
    if (tenantVariables.currentTenant.datacenter) {
        url = url.replace(/(?<=cfapps\.).*?(?=\.hana)/, element.datacenter).replace(/(?<=\.integrationsuite).*?(?=\.cfapps)/, element.system)
    }
    openLinkInNewTab(url, true)
}

async function getCrossTenantResource(details) {
    return chrome.runtime.sendMessage({
        type: "LANDSCAPER",
        resourceDetails: details
    })
}

/**
 *
 * @param runtimeId Runtime ID of the requested artifact
 * @param requestedTenant Tenant object of the requested tenant
 * @returns {Promise<*>}
 */
async function getCrossTenantRuntimeArtifactDownload(runtimeId, requestedTenant) {
    let xTenantUid = getCrossTenantUid(requestedTenant.id)
    if (!xTenantUid) return


    let url = window.location.host
        .replace(new RegExp(String.raw`${tenantVariables.currentTenant.id}`, "g"), requestedTenant.id)
        .replace(/(?<=cfapps\.).*?(?=\.hana)/, requestedTenant.datacenter)
        .replace(/(?<=\.integrationsuite).*?(?=\.cfapps)/, requestedTenant.system)

    return getCrossTenantResource({
        type: "XTENANT_RUNTIME_ARTIFACT_DOWNLOAD",
        tenantUrl: `https://${url}/*`,
        runtimeId: runtimeId
    })
}

/**
 *
 * @param packageId Package ID of the containing package
 * @param designtimeId Designtime ID of the requested artifact
 * @param requestedTenant Tenant object of the requested tenant
 * @returns {Promise<*>}
 */
async function getCrossTenantWorkspaceArtifactDownload(packageId, designtimeId, requestedTenant){
    let xTenantUid = getCrossTenantUid(requestedTenant.id)
    if (!xTenantUid) return

    let url = window.location.host
        .replace(new RegExp(String.raw`${tenantVariables.currentTenant.id}`, "g"), requestedTenant.id)
        .replace(/(?<=cfapps\.).*?(?=\.hana)/, requestedTenant.datacenter)
        .replace(/(?<=\.integrationsuite).*?(?=\.cfapps)/, requestedTenant.system)

    return getCrossTenantResource({
        type: "XTENANT_DESIGNTIME_ARTIFACT_DOWNLOAD",
        tenantUrl: `https://${url}/*`,
        packageId: packageId,
        designtimeId: designtimeId
    })
}

/**
 *
 * @param packageId reg_id of the containing package
 * @param designtimeId reg_id of the requested artifact
 * @returns {Promise<*>}
 */
async function getWorkspaceArtifactDownload(packageId, designtimeId){
    return callXHR("POST", deepWorkspaceArtifactGroupDownloadUrl(packageId, csrfToken), `{selectedIds: ["${designtimeId}"]}`, null, true, {asBlob: true, blobType: "application/zip"})
}

/**
 *
 * @param packageId reg_id of the containing package
 * @param designtimeId reg_id of the requested artifact
 * @returns {Promise<*>}
 */
async function getWorkspaceArtifactExplicitDownload(packageId, designtimeId){
    return callXHR("GET", deepWorkspaceArtifactEntityUrl(packageId, designtimeId), null, null, false, {asBlob: true, blobType: "application/zip"})
}

function getCrossTenantUid(requestedTenant) {
    let tenant = tenantVariables.globalEnvironment.tenants.find(it => {
        return it.id == requestedTenant
    })
    if (!tenant) return

    return tenant.id + tenant.system + tenant.datacenter
}

function getZipContent(zipBase64) {
    let zip = atob(zipBase64)
    let array = [];
    for (let i = 0; i < zip.length; i++) {
        array.push(zip.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {type: 'application/zip'})
}

class IntegrationArtifact {
    manifest
    files
    tenant
    isRuntime

    constructor(manifest, files, tenant, isRuntime) {
        this.manifest = manifest
        this.files = files
        this.tenant = tenant
        this.isRuntime = isRuntime
    }

    static async init(files, tenant) {
        let manifest = new Manifest(await files.find(it => it.filename.endsWith("META-INF/MANIFEST.MF")).getData(new zip.TextWriter()))
        let isRuntime = (manifest.data["SAP-ArtifactId"] != null)
        let artifactType = getTypeConversion("operationsType", isRuntime ? "runtimeObjectType" : "designtimeObjectType", manifest.data["SAP-BundleType"])
        return new artifactType(manifest, files, tenant, isRuntime)
    }

    async compare(other) {
        let close = document.getElementById("__twine-staticElement-DiffDisplay-Header-Close")
        let closeReplace = close.cloneNode(true)
        close.replaceWith(closeReplace)
        closeReplace.addEventListener("mouseup", e => {
            toggleDiffDisplay()
        })

        let popout = document.getElementById("__twine-staticElement-DiffDisplay-Header-Popout")
        let popoutReplace = popout.cloneNode(true)
        popout.replaceWith(popoutReplace)
        popoutReplace.addEventListener("mouseup", e => {
            let popup = window.open('', this.manifest["Bundle-SymbolicName"], "scrollable,resizable");

            if (popup.location.href === 'about:blank') {
                popup.document.write(document.getElementById("__twine-staticElement-DiffDisplay").outerHTML);
            }

            toggleDiffDisplay()
            popup.focus()
        })

        let download = document.getElementById("__twine-staticElement-DiffDisplay-Header-Download")
        let downloadReplace = download.cloneNode(true)
        download.replaceWith(downloadReplace)
        downloadReplace.addEventListener("mouseup", e => {

            clipBoardCopyRich([
                new ClipboardItem({"text/html": new Blob([document.getElementById("__twine-staticElement-DiffDisplay-View-Content").outerHTML], {
                        type: 'text/html'
                    })})
            ])
        })

        let color = ''
        let span = null

        let diff = Diff.diffLines(await this.convertToComparable(), await other.convertToComparable()),
            fragment = document.createDocumentFragment();

        let differences = 0
        diff.forEach(function (part) {
            color = part.added ? 'green' : part.removed ? 'red' : 'dimgray'
            span = document.createElement('span')
            span.style.color = color
            if (part.added || part.removed) {
                span.style.fontWeight = "bold"
                differences++
            }
            span.appendChild(document.createTextNode(part.value))
            fragment.appendChild(span)
        })

        let fragmentContent = document.createElement("div");
        fragmentContent.appendChild(fragment);
        document.getElementById("__twine-staticElement-DiffDisplay-Header-Meta-Artifact").innerText= this.manifest.data["Origin-Bundle-SymbolicName"] ?? this.manifest.data["Bundle-SymbolicName"]
        document.getElementById("__twine-staticElement-DiffDisplay-Header-Meta-Note").innerText = ""
        document.getElementById("__twine-staticElement-DiffDisplay-View-Content").innerHTML = fragmentContent.innerHTML
        document.getElementById("__twine-staticElement-DiffDisplay-Header-SourceRole").innerText = this.getArtifactRole()
        document.getElementById("__twine-staticElement-DiffDisplay-Header-TargetRole").innerText = other.getArtifactRole()
        document.getElementById("__twine-staticElement-DiffDisplay-View-Previous").style.display = "none"
        document.getElementById("__twine-staticElement-DiffDisplay-View-Next").style.display = "none"
        document.getElementById("__twine-staticElement-DiffDisplay-Header-DifferenceCount").innerText = differences == 1 ? "1 Difference" : differences > 1 ? `${differences} Differences` : "Artifacts are identical"
        hideSpinner()
        toggleDiffDisplay(true)

        return new TwineStatusCode(204, "Diff View displayed")
    }

    getArtifactRole() {
        return `${this.isRuntime ? "Runtime" : "Designtime"} (${this.tenant})`
    }
}
class Manifest {
    data

    constructor(data) {
        this.data = Object.fromEntries(data.split(new RegExp("[\\r\\n]+(?!\\s)", "g")).filter(it => !(it == "")).map(it => {
            let pair = it.split(": ", 2)
            return [pair[0], pair[1].replaceAll(new RegExp("[\\r\\n]+ ", "g"), "")]
        }))
    }
}

class ValueMappingIntegrationArtifact extends IntegrationArtifact {

    async convertToCsv() {
        let maps = new XMLParser({
            "numberParseOptions": {
                "leadingZeros": false
            },
            "trimValues": false
        }).parse(
            await this.files
                .find(it => it.filename == `value_mapping.xml`)
                .getData(new zip.TextWriter())
        )


    }

    async convertToComparable() {
        let maps = new XMLParser({
            "numberParseOptions": {
                "leadingZeros": false
            },
            "trimValues": false
        }).parse(
            await this.files
                .find(it => it.filename == `value_mapping.xml`)
                .getData(new zip.TextWriter())
        )

        let lia = "", lis = "", loa = "", los = "", indent = 1
        let output = ""

        maps.vm.group
            .sort((a, b) => {
                return (
                    a.entry[0].agency.localeCompare(b.entry[0].agency) ||
                    a.entry[1].agency.localeCompare(b.entry[1].agency) ||
                    a.entry[0].schema.localeCompare(b.entry[0].schema) ||
                    a.entry[1].schema.localeCompare(b.entry[1].schema) ||
                    a.entry[0].value.toString().localeCompare(b.entry[0].value.toString())
                );
            })
            .forEach((item) => {
                const { agency: agencyA, schema: schemaA } = item.entry[0];
                const { agency: agencyB, schema: schemaB } = item.entry[1];

                if (lia + lis + loa + los !== agencyA + schemaA + agencyB + schemaB) {
                    if (lia) output += "\n"
                    indent--
                    output += `${"\t".repeat(indent)}${agencyA}: ${schemaA} -> ${agencyB}: ${schemaB}\n`
                    indent++
                }

                lia = agencyA
                lis = schemaA
                loa = agencyB
                los = schemaB
                output += `${"\t".repeat(indent)}${item.entry[0].value ?? ""} <=> ${item.entry[1].value ?? ""}\n`
            })
        return output
    }
}
class ValueMappingDesigntimeArtifact extends ValueMappingIntegrationArtifact {
    constructor(manifest, files, tenant, isRuntime) {
        super(manifest, files, tenant, isRuntime)
        return this
    }
}
class ValueMappingRuntimeArtifact extends ValueMappingIntegrationArtifact {
    constructor(manifest, files, tenant, isRuntime) {
        super(manifest, files, tenant, isRuntime)
        return this
    }
}

class IntegrationFlowIntegrationArtifact extends IntegrationArtifact {
    effectiveConfiguration
    defaultConfiguration

    async compare(other) {
        let close = document.getElementById("__twine-staticElement-DiffDisplay-Header-Close")
        let closeReplace = close.cloneNode(true)
        close.replaceWith(closeReplace)
        closeReplace.addEventListener("mouseup", e => {
            toggleDiffDisplay()
        })

        let popout = document.getElementById("__twine-staticElement-DiffDisplay-Header-Popout")
        let popoutReplace = popout.cloneNode(true)
        popout.replaceWith(popoutReplace)
        popoutReplace.addEventListener("mouseup", e => {
            let popup = window.open('', this.manifest["Bundle-SymbolicName"], "scrollable,resizable");

            if (popup.location.href === 'about:blank') {
                popup.document.write(document.getElementById("__twine-staticElement-DiffDisplay-View-Content").outerHTML);
            }

            toggleDiffDisplay()
            popup.focus()
        })

        let color = ''
        let span = null

        let diff = Diff.diffLines(await this.convertToComparable(), await other.convertToComparable()),
            fragment = document.createDocumentFragment();
        let visualDiff = Diff.diffLines(await this.getDiagram(), await other.getDiagram()).filter(it =>  it.added || it.removed ).length

        let differences = 0
        diff.forEach(function (part) {
            color = part.added ? 'green' : part.removed ? 'red' : 'dimgray'
            span = document.createElement('span')
            span.style.color = color
            if (part.added || part.removed) {
                span.style.fontWeight = "bold"
                differences++
            }
            span.appendChild(document.createTextNode(part.value))
            fragment.appendChild(span)
        })

        let fragmentContent = document.createElement("div");
        fragmentContent.appendChild(fragment);
        document.getElementById("__twine-staticElement-DiffDisplay-Header-Meta-Artifact").innerHTML = this.manifest.data["Origin-Bundle-SymbolicName"] ?? this.manifest.data["Bundle-SymbolicName"]
        document.getElementById("__twine-staticElement-DiffDisplay-View-Content").innerHTML = fragmentContent.innerHTML
        document.getElementById("__twine-staticElement-DiffDisplay-Header-SourceRole").innerText = this.getArtifactRole()
        document.getElementById("__twine-staticElement-DiffDisplay-Header-TargetRole").innerText = other.getArtifactRole()
        document.getElementById("__twine-staticElement-DiffDisplay-View-Previous").style.display = "none"
        document.getElementById("__twine-staticElement-DiffDisplay-View-Next").style.display = "none"
        document.getElementById("__twine-staticElement-DiffDisplay-Header-Meta-Note").innerHTML = "Mapping and script comparison are not implemented yet.<br>Some contents were removed for clarity."
        document.getElementById("__twine-staticElement-DiffDisplay-Header-DifferenceCount").innerText = (differences > 0 || visualDiff > 0 ? (`${differences} technical difference(s)` + (visualDiff > 0 ? `, ${visualDiff} visual difference(s) excluded` : "")) : "Artifacts are identical")
        hideSpinner()
        toggleDiffDisplay(true)
        return new TwineStatusCode(204, "Diff View displayed")
    }

    async getDiagram() {
        let xml = getDocument(
            (await this.files.find(it => it.filename.endsWith(".iflw"))
                .getData(new zip.TextWriter()))
        )
        return xml.getElementsByTagNameNS("*", "BPMNDiagram")[0].outerHTML
    }
}
class IntegrationFlowDesigntimeArtifact extends IntegrationFlowIntegrationArtifact {
    constructor(manifest, files, tenant, isRuntime) {
        super(manifest, files, tenant, isRuntime)
        return this
    }

    async convertToComparable() {
        let xml = getDocument(
            (await this.files.find(it => it.filename.endsWith(".iflw"))
                .getData(new zip.TextWriter()))
        )

        xml.getElementsByTagNameNS("*", "BPMNDiagram")[0].parentNode.removeChild(xml.getElementsByTagNameNS("*", "BPMNDiagram")[0])

        xml.querySelectorAll("property").forEach(property => {
            property.replaceWith(`${property.firstElementChild.innerHTML}=${property.lastElementChild.innerHTML}`)
        })

        let comparable = xml.documentElement.outerHTML

        this.effectiveConfiguration = Object.fromEntries((await this.files.find(it => it.filename == `src/main/resources/parameters.prop`)?.getData(new zip.TextWriter()))?.split(newLineRegEx).slice(1, -1).map(it => it.split("=", 2)) ?? [])

        if (Object.keys(this.effectiveConfiguration).length > 0) {
            comparable = resolveExternalParameters(comparable, this.effectiveConfiguration)
        }
        comparable = comparable.replaceAll(new RegExp("(id=\"FormalExpression_SequenceFlow_\\d+)_\\d+\"", "g"), "$1")
            .replaceAll(new RegExp("<bpmn2:", "g"), "<")
            .replaceAll(new RegExp("</bpmn2:", "g"), "</")

        return comparable
    }
}
class IntegrationFlowRuntimeArtifact extends IntegrationFlowIntegrationArtifact {
    constructor(manifest, files, tenant, isRuntime) {
        super(manifest, files, tenant, isRuntime)
        return this
    }

    async convertToComparable() {
        let xml = getDocument(
            (await this.files.find(it => it.filename.endsWith(".iflw"))
                .getData(new zip.TextWriter()))
        )

        xml.getElementsByTagNameNS("*", "BPMNDiagram")[0].parentNode.removeChild(xml.getElementsByTagNameNS("*", "BPMNDiagram")[0])

        xml.querySelectorAll("property").forEach(property => {
            property.replaceWith(`${property.firstElementChild.innerHTML}=${property.lastElementChild.innerHTML}`)
        })

        let comparable = xml.documentElement.outerHTML

        this.defaultConfiguration = await this.files.find(it => it.filename == "src/main/resources/parameters.prop")?.getData(new zip.TextWriter())
        this.effectiveConfiguration = await this.files.find(it => it.filename == "src/main/resources/externalconfig.prop")?.getData(new zip.TextWriter())

        this.defaultConfiguration = Object.fromEntries(this.defaultConfiguration?.split(newLineRegEx).slice(1, -1).map(it => it.split("=", 2)))
        this.effectiveConfiguration = Object.assign(this.defaultConfiguration ?? [], Object.fromEntries(this.effectiveConfiguration?.split(newLineRegEx).slice(1, -1).map(it => it.split("=", 2)) ?? []))

        if (Object.keys(this.effectiveConfiguration).length > 0) {
            comparable = resolveExternalParameters(comparable, this.effectiveConfiguration)
        }
        comparable = comparable
            .replaceAll(new RegExp("(id=\"FormalExpression_SequenceFlow_\\d+)_\\d+\"", "g"), "$1")
            .replaceAll(new RegExp("<bpmn2:", "g"), "<")
            .replaceAll(new RegExp("</bpmn2:", "g"), "</")

        return comparable
    }
}

class MessageMappingIntegrationArtifact extends IntegrationArtifact {
    async convertToComparable() {
        return prettyPrintXml(getDocument((await this.files.find(it => it.filename.endsWith(".mmap")).getData(new zip.TextWriter()))).documentElement.outerHTML)
    }
}
class MessageMappingDesigntimeArtifact extends MessageMappingIntegrationArtifact {}
class MessageMappingRuntimeArtifact extends MessageMappingIntegrationArtifact {}

class FunctionLibraryIntegrationArtifact extends IntegrationArtifact {

    async init() {
        this.maps = new XMLParser({
            "numberParseOptions": {
                "leadingZeros": false
            }
        }).parse(
            await this.files
                .find(it => it.filename == `value_mapping.xml`)
                .getData(new zip.TextWriter())
        )
    }
}
class FunctionLibraryDesigntimeArtifact extends FunctionLibraryIntegrationArtifact {}
class FunctionLibraryRuntimeArtifact extends FunctionLibraryIntegrationArtifact {}

class DataTypeDesigntimeArtifact extends FunctionLibraryIntegrationArtifact {}
class DataTypeRuntimeArtifact extends FunctionLibraryIntegrationArtifact {}

class MessageTypeDesigntimeArtifact extends FunctionLibraryIntegrationArtifact {

    async init(files) {
        super.init(files)

        this.scripts = await Promise.all(
            files
                .filter(it => it.filename.startsWith(`src/main/resources/mapping/`) && it.filename.length > 5)
                .map(async it => { return ScriptFile.from(it)})
        )
    }
}
class MessageTypeRuntimeArtifact extends FunctionLibraryIntegrationArtifact {}

class ScriptCollectionIntegrationArtifact extends IntegrationArtifact {}
class ScriptCollectionDesigntimeArtifact extends ScriptCollectionIntegrationArtifact {
    scripts
    comparisons = []
    fileIndex = 0

    async init(files) {
        super.init(files)

        this.scripts = await Promise.all(
            files
                .filter(it => it.filename.startsWith(`src/main/resources/script/`) && it.filename.length > 7)
                .map(async it => { return ScriptFile.from(it)})
        )
    }

    compare(other) {
        diffDisplay.addEventListener("contextmenu", event => {
            this.comparisons[this.fileIndex].style.display = "none"
            this.fileIndex++

            if (this.fileIndex >= this.scripts.length) {
                this.fileIndex = 0
            }
            this.comparisons[this.fileIndex].style.display = "block"
            preventDefaultAction(event)
        })

        let fragment = document.createDocumentFragment()

        //Scripts not present on this tenant
        let thisMiss = other.scripts.filter(it => {
            return !(this.scripts.map(it => it.filename.substring(it.filename.lastIndexOf('/')+1).includes(it.filename.substring(it.filename.lastIndexOf('/')+1))))
        })
        //Scripts not present on other artifact
        let otherMiss = this.scripts.filter(it => {
            return !(other.scripts.map(it => it.filename.substring(it.filename.lastIndexOf('/')+1).includes(it.filename.substring(it.filename.lastIndexOf('/')+1))))
        })
        this.scripts
            .filter(it => other.scripts.map(it => it.filename.substring(it.filename.lastIndexOf('/')+1).includes(it.filename.substring(it.filename.lastIndexOf('/')+1))))
            .forEach((it, index) => {
                let diff = Diff.diffLines(it.script, other.scripts.find(otherScript => otherScript.filename == it.filename).script)
                let scriptFragment = document.createElement("pre")
                scriptFragment.id = `__twine-staticElement_sccompare-${index}`
                scriptFragment.style.padding = "10px"
                scriptFragment.style.marginTop = "30px"

                scriptFragment.appendChild(createElementFrom(`
                    <p style="font-weight: bold">${this.manifest.data["Bundle-SymbolicName"]}: ${it.filename}</p>
                `))

                let color = ''
                let span = null
                diff.forEach(part => {
                    color = part.added ? 'green' : part.removed ? 'red' : 'dimgray'
                    span = document.createElement('span')
                    span.style.color = color
                    span.appendChild(document.createTextNode(part.value))
                    scriptFragment.appendChild(span)
                    scriptFragment.style.display = (index == this.fileIndex) ? "block" : "none"
                })
                this.comparisons.push(scriptFragment)

                fragment.appendChild(scriptFragment)
            })
        thisMiss.forEach((it, index) => {

        })
        otherMiss.forEach((it, index) => {

        })

        let fragmentContent = document.createElement("div");
        fragmentContent.appendChild(fragment);
        document.getElementById("__twine-staticElement-DiffDisplay-View-Meta").innerHTML = this.manifest.data["Origin-Bundle-SymbolicName"] ?? this.manifest.data["Bundle-SymbolicName"]
        document.getElementById("__twine-staticElement-DiffDisplay-View-Content").innerHTML = fragmentContent.innerHTML
        hideSpinner()
        toggleDiffDisplay(true)
        return new TwineStatusCode(204, "Diff View displayed")
    }
}
class ScriptCollectionRuntimeArtifact extends ScriptCollectionIntegrationArtifact {
    scripts
    comparisons = []
    fileIndex = 0

    async init(files) {
        await super.init(files)

        this.scripts = await Promise.all(files.filter(it => it.filename.startsWith("script/") && it.filename.length > 7).map(async it => { return ScriptFile.from(it)}))
    }

    compare(other) {
        diffDisplay = createElementFrom(`
            <div>
                <div style='position:fixed; padding: 10px; display: flex; align-items: center'>
                    <span style='font-weight: bold; font-size: xx-large; cursor: pointer'>&times;</span> 
                    <span style='color: red; padding: 0 0 0 5px'>Local Values</span>, 
                    <span style='color: green; padding: 0 0 0 5px'>Values on other artifact</span>, 
                    <span style='padding: 0 0 0 5px'>Results may be inaccurate</span>
                </div>
                <div style="margin: 0" id="__twine-staticElement"></div>
            </div>
        `)
        diffDisplay.addEventListener("contextmenu", event => {
            this.comparisons[this.fileIndex].style.display = "none"
            this.fileIndex++

            if (this.fileIndex >= this.scripts.length) {
                this.fileIndex = 0
            }
            this.comparisons[this.fileIndex].style.display = "block"
            preventDefaultAction(event)
        })
        diffDisplay.firstElementChild.firstElementChild.addEventListener("mouseup", e => {
            diffDisplay.remove()
            diffDisplay = null
        })

        let fragment = document.createDocumentFragment()


        //Scripts not present on this tenant
        let thisMiss = other.subtypeArtifact.scripts.filter(it => {
            return !(this.scripts.map(it => it.filename).includes(it.filename))
        })
        //Scripts not present on other artifact
        let otherMiss = this.scripts.filter(it => {
            return !(other.subtypeArtifact.scripts.map(it => it.filename).includes(it.filename))
        })
        this.scripts
            .filter(it => other.subtypeArtifact.scripts.map(it => it.filename).includes(it.filename))
            .forEach((it, index) => {
                let diff = Diff.diffLines(it.script, other.subtypeArtifact.scripts.find(otherScript => otherScript.filename == it.filename).script)
                let scriptFragment = document.createElement("pre")
                scriptFragment.id = `__twine-staticElement_sccompare-${index}`
                scriptFragment.style.padding = "10px"
                scriptFragment.style.marginTop = "30px"

                scriptFragment.appendChild(createElementFrom(`
                    <p style="font-weight: bold">${this.manifest.data["Bundle-SymbolicName"]}: ${it.filename}</p>
                `))

                let color = ''
                let span = null
                diff.forEach(part => {
                    color = part.added ? 'green' : part.removed ? 'red' : 'dimgray'
                    span = document.createElement('span')
                    span.style.color = color
                    span.appendChild(document.createTextNode(part.value))
                    scriptFragment.appendChild(span)
                    scriptFragment.style.display = (index == this.fileIndex) ? "block" : "none"
                })
                this.comparisons.push(scriptFragment)

                fragment.appendChild(scriptFragment)
            })
        thisMiss.forEach((it, index) => {

        })

        diffDisplay.lastElementChild.appendChild(fragment)
        diffDisplay.style.top = `0`
        diffDisplay.style.left = `0`
        diffDisplay.style.bottom = `0`
        diffDisplay.style.right = `0`
        diffDisplay.style.background = "#f1f1f1"
        diffDisplay.style.display = "block"
        diffDisplay.style.position = "absolute"
        diffDisplay.style.zIndex = "70"
        diffDisplay.style.overflow = "scroll"

        hideSpinner()
        popoverLayer.appendChild(diffDisplay)
        return new TwineStatusCode(204, "Diff View displayed")
    }
}

class ScriptFile {
    filename
    script

    static async from(file) {
        let scriptfile = new ScriptFile()
        scriptfile.filename = file.filename.substring(file.filename.lastIndexOf("/"))
        scriptfile.script = await file.getData(new zip.TextWriter())
        return scriptfile
    }
}

function resolveExternalParameters(str, mapObj){
    let re = new RegExp(Object.keys(mapObj).map(it => String.raw`\{\{${it}\}\}`).join("|"),"g")

    return str.replace(re, function(matched){
        return mapObj[matched.slice(2, -2)]
    })
}

function toggleDiffDisplay(show) {
    if (show) {
        diffDisplay.style.display = "inherit"
        diffDisplay.scrollTop = 0
    } else {
        diffDisplay.style.display = "none"
    }
}