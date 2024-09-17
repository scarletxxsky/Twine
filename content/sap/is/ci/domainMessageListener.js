chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        try {
            switch (message.type) {
                case "checkHost":
                    sendResponse(checkHost());
                    break;
                default:
                    sendResponse({errorCode: "INVALID_MESSAGE", host: window.location.host});
            }
        } catch (err) {
            sendResponse({errorCode: "UNKNOWN_ERROR", description: String.raw`Das dürfte eigentlich nicht passieren können ☹`, host: window.location.host});
        }
    }
);
function checkHost() {
    return {valid: Boolean(exporters[window.location.host]), content: {errorCode: "NO_CONFIG", host: window.location.host}}
}