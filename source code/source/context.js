async function connectionTestCC(cc = null, eval) {
    let ccId = cc ?? document.querySelector("[id^=location_id][id$=_input-scrollContainer]")?.childNodes
    if (!cc && ccId) ccId = Array.from(ccId).map(node => node.id.startsWith("__input") ? node.firstElementChild.firstElementChild.value : node.innerText).join("")
    if (!ccId) {
        return {success: false, value: "No location ID selectable in CI Editor", hint: "No location ID selectable in CI Editor"}
    }
    if (eval) return {success: true, value: true, hint: `Ping CC ${ccId} (Evaluation does <b>not</b> perform a ping)`}
    let response = await callXHR("POST", operationsUrl() + "/com.sap.esb.monitoring.connection.test.command.CcConnectionTestCommand", `{"locationId": "${ccId}"}`, "application/json;charset=UTF-8", true)
    if (getDocument(response).querySelector("pingSuccessful").innerHTML == "true") {
        return {success: true, value: true, hint: true}
    } else if (getDocument(response).querySelector("pingSuccessful").innerHTML == "false") {
        return {success: true, value: false, hint: false}
    } else {
        return {success: false, value: "Error in CC response", hint: "Error in CC response"}
    }
}

let variables = {
    subaccountBasePath: null,
    monitoringBasePath: "/shell/monitoring/Messages",
    storage: {

    }
}