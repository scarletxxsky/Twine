function monitoringDatabaseTableSize() {
    return `https://${window.location.host}/api/v1/resourceusage?type=mon-db-table-size&time=hourly&from=2024-08-13T16:00:00.000Z&to=2024-08-14T16:00:00.000Z&timezoneid=Europe/Berlin`
}

function deepWorkspacePackageUrl() {
    return `${deepWorkspaceUrl()}/package/${tenantVariables.currentArtifact.package.reg_id}`
}

function workspaceFileUrl(fileId) {
    return (workspaceUrl() + "/Files" + (fileId ? `('${fileId}')/$value` : ""))
}

function workspacePackageFilesUrl(packageId) {
    if (!packageId) {
        log("No packageId")
        return
    }
    return workspacePackageUrl(packageId) + "/Files"
}

function workspacePackageUrl(packageId) {
    return (workspaceUrl() + "/ContentEntities.ContentPackages" + (packageId ? `('${packageId}')` : ""))
}

function workspaceArtifactUrl(artifactId, artifactType) {
    return `${workspaceUrl()}/Artifacts(Name='${artifactId}',Type='${artifactType}')?$format=json`
}

function deepWorkspaceDocumentsUrl() {
    return `${deepWorkspacePackageUrl()}/documents`
}

function deepWorkspaceDocumentEntityUrl() {
    return `${deepWorkspacePackageUrl()}/documents/${tenantVariables.currentArtifact.ContentPackages?.results?.[0]?.Files?.results?.find(it => it.FileName == `Twine_${tenantVariables.currentArtifact.Name}.txt`)}`
}

function deepWorkspaceFileLockUrl(lock = false, fileinfo = false) {
    return `${deepWorkspaceDocumentEntityUrl()}?webdav=${lock ? "LOCK" : "UNLOCK"}&fileinfo=${fileinfo}`
}

async function getCsrfToken() {
    if (true) {
        return new Promise(async function (resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.withCredentials = true;
            xhr.open("GET", "/api/1.0/user");

            xhr.setRequestHeader("X-CSRF-Token", "Fetch");

            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    if (loggedInUser == null) loggedInUser = JSON.parse(xhr.responseText)[0]
                    resolve(xhr.getResponseHeader("x-csrf-token"));
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                }
            };

            xhr.onerror = function () {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            };
            xhr.send();
            }
        );
    } else {
        /*TODO: Add cache*/
    }
}

async function callFetch(method, url, payload, formDataBoundary) {
    let csrfToken = await getCsrfToken()
    fetch(url, {
        "headers": {
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9,de-DE;q=0.8,de;q=0.7",
            "Content-Type": `multipart/form-data; boundary=${formDataBoundary}`,
            "X-CSRF-Token": csrfToken
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": payload,
        "method": method,
        "mode": "cors",
        "credentials": "include"
    }).then(response => {
        response.json().then(data => {
            tenantVariables.currentArtifact.deepWorkspace = data
        })
    })
}

async function callXHR(method, url, payload = null, contentType = null, withCSRF = true, parameters = {}) {
    return new Promise(async function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open(method, url);

        if (contentType) xhr.setRequestHeader('Content-Type', contentType)
        if (withCSRF) xhr.setRequestHeader("X-CSRF-Token", await getCsrfToken())

        xhr.timeout = parameters.timeout ?? 30000
        xhr.ontimeout = function(e) {
            reject({status: -1, statusText: "Timeout", reason: "TIMEOUT"})
        }
        if (parameters.headers) Object.entries(parameters.headers).forEach(key => {
            xhr.setRequestHeader(key[0], key[1])
        })

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {  // Request is done
                if (this.status >= 200 && this.status < 300) {
                    resolve(this.responseText)
                } else if (this.status >= 400 && this.status < 600) {
                    reject({status: xhr.status, statusText: xhr.statusText, reason: "ERROR"})
                } else console.log(xhr.status, xhr.statusText)
            }
        }

        xhr.onerror = function() {
            reject({status: this.status, statusText: this.statusText, reason: "ERROR"});
        };

        xhr.onabort = function() {
            reject({status: this.status, statusText: this.statusText, reason: "ABORT"});
        }

        if (payload)
            xhr.send(payload)
        else
            xhr.send()
    })
}