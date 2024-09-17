window.addEventListener("load",function () {
    chrome.storage.sync.get(
        ["cloudStatusHideGreen"],
        (items) => {
            toggleCloudStatus(items.cloudStatusHideGreen ?? true)
        }
    )
})

function toggleCloudStatusOnChange(hideValue) {
    toggleCloudStatus(hideValue)
}
function toggleCloudStatus(hideValue) {
    waitForElement("[class^=SolutionsList__solutionWrapper]").then(ignore => {
        document.querySelectorAll("[class^=SolutionsList__listItem]").forEach(e => {
            if (e.querySelectorAll("[class^=ListElement__root] > [class^=sapcom__iconInfo]").length === 0) e.style.display = (hideValue === true) ? "none" : "block"
        })
        document.querySelectorAll("[class^=SolutionsList__solutionContainer]").forEach(e => {
            if (e.querySelectorAll('ul > li:not([style*="display: none"])').length > 0) {
                e.style.display = "block"
            } else {
                e.style.display = "none"
            }
        })
    })
}


chrome.runtime.onMessage.addListener(
    function(message, sender) {
        switch (message.type) {
            case "toggleCloudStatus":
                toggleCloudStatusOnChange(message.hideValue);
                break;
            default:
                break
        }
    }
)