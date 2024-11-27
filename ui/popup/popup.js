document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('cloudStatusHideGreen').addEventListener('click', saveOptions);
    restoreOptions()
})

function saveOptions() {
    let cloudStatusHideGreen = document.getElementById('cloudStatusHideGreen').checked;
    chrome.storage.sync.set(
        { cloudStatusHideGreen: cloudStatusHideGreen }, () => {
            toggleCloudStatus(cloudStatusHideGreen)
        }
    )
}

function restoreOptions() {
    chrome.storage.sync.get(
        { cloudStatusHideGreen: true },
        (items) => {
            document.getElementById('cloudStatusHideGreen').checked = items.cloudStatusHideGreen
        }
    )
}

function toggleCloudStatus(hideValue) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {type: "toggleCloudStatus", hideValue: hideValue});
    })
}