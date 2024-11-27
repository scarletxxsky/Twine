document.addEventListener('DOMContentLoaded', function () {
    addFeatureSelectionEnableListener("ISQuickAccess")
    addFeatureSelectionEnableListener("ISContentQuickAccess")
    addFeatureSelectionEnableListener("ISDocumentationRead")
    addFeatureSelectionEnableListener("ISDocumentationWrite")
    document.getElementById("close-modal").addEventListener("click", () => document.getElementById('modal').style.display='none')
    document.getElementById("function-reset").addEventListener("click", resetOptions)
    document.getElementById("function-import").addEventListener("click", openImportModal)
    document.getElementById("function-export").addEventListener("click", openExportModal)
    document.getElementById("function-changeLog").addEventListener("click", openChangeLog)
})

function addFeatureSelectionEnableListener(featureCategory) {
    document.getElementById(featureCategory)?.addEventListener("change", (event) => {
        console.log(event)
        Array.prototype.forEach.call(document.getElementsByClassName(`${featureCategory}_Feature`), (it) => {
            it.querySelector("input").disabled = !event.target.checked
        })
    })
}

function saveOptions(configuration) {
    persistLocal({configuration: configuration}).then((resolve) => {
        document.getElementById("close-modal").click()
        updateUIConfig(configuration)
        updateSessionConfig(configuration)
    }).catch((reject) => {
        console.log(reject)
        alert("Could not process input")
    })
}

function resetOptions() {
    chrome.runtime.sendMessage({type: "RESET_DATA"})
}

function updateUIConfig(configuration) {

}

function updateSessionConfig(configuration) {
    persistSession({configuration: configuration})
        .then(() => console.log("Session updated"))
        .catch(() => console.log("Couldn't update session config"))
}

function promptSaveConfig() {

}

function exportConfig() {

}
function openExportModal() {
    let modalContent = document.createElement("div")
    modalContent.classList.add("w3-panel")
    modalContent.id = "modal-inner"
    modalContent.name = "export"
    modalContent.innerHTML = `
        <p>
            <pre id="import-input" class="w3-input w3-border" style="height: 60vh; resize: none; overflow-x: clip; overflow-y: scroll" name="config" disabled></pre>
            <div class="w3-panel"></div>
        </p>
    `
    document.getElementById("modal-inner").replaceWith(modalContent)
    readLocal("configuration").then((resolve) => {
        document.getElementById("modal-title").textContent = "Export Configuration"
        if (resolve.configuration != null) {
            document.getElementById("import-input").innerHTML = syntaxHighlight(JSON.stringify(resolve.configuration, null, 2))
        } else {
            chrome.runtime.sendMessage({type: "CFG_REQUEST"}).then(response => {
                document.getElementById("import-input").innerHTML = syntaxHighlight(JSON.stringify(response.configuration, null, 2))
            })
        }
        document.getElementById("modal").style.display = "block"
    }).catch((reject) => {
        console.log(reject)
        alert("Could not read configuration")
    })
}

function importConfig() {
    
}
function openImportModal() {
    let modalContent = document.createElement("div")
    modalContent.classList.add("w3-panel")
    modalContent.id = "modal-inner"
    modalContent.name = "import"
    modalContent.innerHTML = `
        <p>
            <textarea id="import-input" class="w3-input w3-border" style="height: 60vh; resize: none" name="config"></textarea>
            <div class="w3-panel">
                <div class="w3-bar w3-center">
                    <input id="hidden-file-input" type="file" name="hidden" style="display: block; visibility: hidden; width: 0; height: 0" accept=".json, .txt">
                    <button id="file-input-proxy" class="w3-button w3-black w3-round-large">Import File</button>
                    <button id="import-save-options" class="w3-button w3-black w3-round-large">Save</button>
                </div>
            </div>
        </p>
    `
    let currentModal = document.getElementById("modal-inner")
    if (currentModal.name != "import") currentModal.replaceWith(modalContent)
    document.getElementById("modal").style.display = "block"
    document.querySelector("[id=modal-inner] > p >textarea").focus()
    document.getElementById("file-input-proxy").addEventListener("click", () => {
        document.getElementById('hidden-file-input').click()
    })
    document.getElementById("hidden-file-input").addEventListener("change", pasteImportedFile)
    document.getElementById("import-save-options").addEventListener("click", () => {
        let configuration
        try {
            configuration = JSON.parse(document.getElementById("import-input").value)
        } catch (e) {
            alert("Couldn't parse your input. Check if it's valid JSON")
            return
        }
        saveOptions(configuration)
    })
    document.getElementById("modal-title").textContent = "Import Configuration"
}

function pasteImportedFile() {
    let file = document.getElementById("hidden-file-input").files[0]
    if (file) {
        let reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            document.getElementById("import-input").value = evt.target.result;
        }
        reader.onerror = function (evt) {
            alert("File could not be read")
        }
    }
}

function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function openChangeLog() {
    chrome.runtime.sendMessage({type: "OPEN_IN_TAB", url: "https://workflowy.com/s/twine-change-log/5nIRSAm3sdTyBsZZ#/be95e468de52"})
}