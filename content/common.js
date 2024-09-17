let measureInterval, updateRun = 0, avgPerfomance = 0.0, elapsedTime = 0.0

function generateFormDataBoundary() {
    return "----WebKitFormBoundaryqF3iAW4rz4VUV2wq"
}

function createElementFrom(string) {
    let div = document.createElement('template');
    div.innerHTML = string;
    return div.content.children[0];
}

async function waitForId(id, interval = 1100) {
    return new Promise(resolve => {
        let runStart = window.performance.now()

        let element = document.getElementById(id)
        if (element != null) {
            elapsedTime += window.performance.now() - runStart
            return resolve(element);
        }

        setTimeout(function tick() {
            let runStart = window.performance.now()

            let element = document.getElementById(id)
            if (element != null) {
                elapsedTime += window.performance.now() - runStart
                return resolve(element);
            }
            elapsedTime += window.performance.now() - runStart
            setTimeout(tick, interval)
        }, interval)

        elapsedTime += window.performance.now() - runStart
    });
}

async function waitForElement(selector, parentElement) {
    return new Promise(resolve => {
        let runStart = window.performance.now()

        let element = (parentElement ?? document).querySelector(selector)
        if (element != null) {
            elapsedTime += window.performance.now() - runStart
            return resolve(element);
        }

        let observer = new MutationObserver(mutations => {
            let runStart = window.performance.now()
            let element = (parentElement ?? document).querySelector(selector)
            if (element != null) {
                observer.disconnect();
                elapsedTime += window.performance.now() - runStart
                resolve(element);
            }
        });

        observer.observe((parentElement ?? document.documentElement), {
            childList: true,
            subtree: true
        });

        elapsedTime += window.performance.now() - runStart
    });
}

function preventDefaultAction(event) {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
}

function someOfAll(arr, callback) {
    let result = false

    arr.forEach((element, index) => {
        if (callback(element, index, arr)) {
            result = true
        }
    })

    return result
}