function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

/**
 * Evaluates whether the first version string is greater (1), equal to (0) or lower than (-1) the second
 * @param version
 * @param otherVersion
 * @returns number
 */
function compareVersion(version, otherVersion) {
    if (version?.toLowerCase() == otherVersion?.toLowerCase()) return 0
    if (version == null || otherVersion?.toLowerCase() == "draft") return -1
    else if (otherVersion == null || version?.toLowerCase() == "draft") return 1

    let parts = version.split(".").map(it => parseInt(it))
    let oldParts = otherVersion.split(".").map(it => parseInt(it))

    let year = parts[0] > oldParts[0] ? 1 : parts[0] === oldParts[0] ? 0 : -1
    let month = parts[1] > oldParts[1] ? 1 : parts[1] === oldParts[1] ? 0 : -1
    let day = parts[2] > oldParts[2] ? 1 : parts[2] === oldParts[2] ? 0 : -1
    let id = parts[3] ?? 0 > oldParts[3] ?? 0 ? 1 : parts[3] ?? 0 === oldParts[3] ?? 0 ? 0 : -1

    return year > 0 ? 1 : year < 0 ? -1 : month > 0 ? 1 : month < 0 ? -1 : day > 0 ? 1 : day < 0 ? -1 : id > 0 ? 1 : id < 0 ? -1 : 0
}

function getVersionComponents(version, delimiter = ".") {
    return version.split(delimiter).map(it => Number(it))
}

function openLinkInNewTab(url, newWindow) {
    chrome.runtime.sendMessage({
        type: newWindow ? "OPEN_IN_WINDOW" : "OPEN_IN_TAB",
        url: prependHost(url)
    }).then(response => {

    }).catch(error => {

    })
}

function decodeHtml(html) {
    let txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

function getDocument(document) {
    return new DOMParser().parseFromString(document, "application/xml")
}

function msToTime(s) {
    let ms = s % 1000;
    s = (s - ms) / 1000;
    let secs = s % 60;
    s = (s - secs) / 60;
    let mins = s % 60;
    let hrs = (s - mins) / 60;
    let time = (hrs > 0 ? hrs + 'h ' : "") + (mins > 0 ? mins + 'm ' : "") + (secs > 0 ? secs + 's' : "")
    return time.length > 0 ? time : "1s";
}

function getGradientColor(colorStops, progress) {
    if (progress <= colorStops[0][0]) {
        const [r, g, b] = colorStops[0][1];
        return `rgb(${r}, ${g}, ${b})`;
    }
    if (progress >= colorStops[colorStops.length - 1][0]) {
        const [r, g, b] = colorStops[colorStops.length - 1][1];
        return `rgb(${r}, ${g}, ${b})`;
    }

    for (let i = 0; i < colorStops.length - 1; i++) {
        const [startPercent, startColor] = colorStops[i];
        const [endPercent, endColor] = colorStops[i + 1];

        if (progress >= startPercent && progress <= endPercent) {
            const ratio = (progress - startPercent) / (endPercent - startPercent);

            const r = Math.round(startColor[0] + ratio * (endColor[0] - startColor[0]));
            const g = Math.round(startColor[1] + ratio * (endColor[1] - startColor[1]));
            const b = Math.round(startColor[2] + ratio * (endColor[2] - startColor[2]));

            return `rgb(${r}, ${g}, ${b})`;
        }
    }
}

function tryParseJSON(jsonString) {
    try {
        let o = JSON.parse(jsonString);

        if (o && typeof o === "object") {
            return o;
        }
    } catch (e) {
    }

    return false;
}

function getTextDuration(text, minDuration) {
    return (((text?.length ?? 0) * 55) + (minDuration ?? 1500))
}


let pathTypeRegex = new RegExp('^(?:[a-z+-]+:)?//', 'i')

function isAbsolutePath(path) {
    return pathTypeRegex.test(path)
}

function prependHost(path) {
    if (isAbsolutePath(path)) return path
    return window.location.protocol + "//" + window.location.host + (path.startsWith("/") ? path : "/" + path)
}

function formatDate(date, pattern) {
    const options = {
        'yyyy': date.getUTCFullYear(),
        'MM': String(date.getUTCMonth() + 1).padStart(2, '0'),
        'dd': String(date.getUTCDate()).padStart(2, '0'),
        'HH': String(date.getUTCHours()).padStart(2, '0'),
        'hh': String(date.getUTCHours()),
        'mm': String(date.getUTCMinutes()).padStart(2, '0'),
        'ss': String(date.getUTCSeconds()).padStart(2, '0'),
        'sss': String(date.getUTCMilliseconds()).padStart(2, '0'),

    };

    return pattern.replace(/yyyy|MM|dd|HH|hh|mm|sss|ss/g, match => options[match]);
}

const offsets = Object.freeze({
    "monday": 1,
    "tuesday": 2,
    "wednesday": 3,
    "thursday": 4,
    "friday": 5,
    "saturday": 6,
    "sunday": 0
})
function applyOffsets(date, offsetsStr) {
    const applyOffset = (date, offset) => {
        const matchWeekday = /^LAST_(\w+)$/i   // LAST_DAY
        const matchNextWeekday = /^NEXT_(\w+)$/i // NEXT_DAY
        const matchOffset = /^([+-]?\d+)(day|hour|minute)s?$/i
        const matchDate = /^D(\d{4})-(\d{2})-(\d{2})$/i
        const matchTime = /^T(\d{2}):(\d{2}):(\d{2})$/i

        const matchLast = offset.match(matchWeekday)
        if (matchLast) {
            const dayName = matchLast[1].toLowerCase()
            const targetDay = offsets[dayName]
            if (targetDay !== undefined) {
                const dayOfWeek = date.getDay()
                const daysToSubtract = (dayOfWeek - targetDay + 7) % 7 || 7
                date.setDate(date.getDate() - daysToSubtract)
            }
        }

        const matchNext = offset.match(matchNextWeekday)
        if (matchNext) {
            const dayName = matchNext[1].toLowerCase()
            const targetDay = offsets[dayName]
            if (targetDay !== undefined) {
                const dayOfWeek = date.getDay()
                const daysToAdd = (targetDay - dayOfWeek + 7) % 7 || 7
                date.setDate(date.getDate() + daysToAdd)
            }
        }

        const matchConcreteOffset = offset.match(matchOffset)
        if (matchConcreteOffset) {
            const offset = parseInt(matchConcreteOffset[1])
            switch (matchConcreteOffset[2].toLowerCase()) {
                case "minute":
                    date.setMinutes(date.getMinutes() + offset)
                    break
                case "hour":
                    date.setHours(date.getHours() + offset)
                    break
                case "day":
                    date.setDate(date.getDate() + offset)
                    break
            }
        }

        const matchTimeOffset = offset.match(matchTime)
        if (matchTimeOffset) {
            const [, hours, minutes, seconds] = matchTimeOffset
            date.setHours(parseInt(hours))
            date.setMinutes(parseInt(minutes))
            date.setSeconds(parseInt(seconds))
        }

        const matchDateOffset = offset.match(matchDate)
        if (matchDateOffset) {
            const [, years, months, days] = matchDateOffset
            date.setFullYear(parseInt(years))
            date.setMonth(parseInt(months))
            date.setDate(parseInt(days))
        }
    }

    let offsetDate = new Date(date.getTime())
    offsetsStr.split(',').forEach(offset => applyOffset(offsetDate, offset.trim()))
    return offsetDate
}

function prettyPrintXml(sourceXml) {
    let xmlDoc = new DOMParser().parseFromString(sourceXml, 'application/xml')
    let xsltDoc = new DOMParser().parseFromString([
        // describes how we want to modify the XML - indent everything
        '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
        '  <xsl:strip-space elements="*"/>',
        '  <xsl:template match="para[content-style][not(text())]">', // change to just text() to strip space in text nodes
        '    <xsl:value-of select="normalize-space(.)"/>',
        '  </xsl:template>',
        '  <xsl:template match="node()|@*">',
        '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
        '  </xsl:template>',
        '  <xsl:output indent="yes"/>',
        '</xsl:stylesheet>',
    ].join('\n'), 'application/xml')

    let xsltProcessor = new XSLTProcessor()
    xsltProcessor.importStylesheet(xsltDoc)
    let resultDoc = xsltProcessor.transformToDocument(xmlDoc)
    return new XMLSerializer().serializeToString(resultDoc)
}

async function replaceAsync(str, regex, replacer) {
    const matches = [...str.matchAll(regex)]

    const replacements = await Promise.all(matches.map(async (match) => {
        const result = await replacer(match[1])
        return {match, result}
    }))

    let newStr = str;
    for (const {match, result} of replacements.reverse()) {
        newStr = newStr.slice(0, match.index) + result + newStr.slice(match.index + match[0].length)
    }

    return {success: !replacements.some((match, it) => !it.success), value: newStr, hint: newStr};
}

async function resolveDynamic(dynamic, eval) {
    if (dynamic == null) return
    let evaluation = []
    let result = await replaceAsync(dynamic, /\{\{(.*?)}}/g, async (match) => {
        let replace = await resolveParameter(match, eval)
        if (replace.success) {
            return replace.value
        } else {
            return replace.hint
        }
    })

    if (eval) {
        evaluation.push(result)
        return evaluation
    }
    return result.success ? result.value : "/"
}

let macroRunning = false

async function resolveMacro(macro, eval) {
    if (!eval && !checkErrorTolerance(6)) {
        return [{success: false, value: "Macros are disabled for tenants with unpredictable features disabled", hint: "Macros are disabled for tenants with unpredictable features disabled"}]
    }
    if (macroRunning && !eval) {
        createToast("Another macro is already running", {className: "twineWarning"})
        return [{success: false, value: "Another macro is already running", hint: "Another macro is already running"}]
    } else {
        macroRunning = true
        displayMacroSpinner()
    }

    if (macro == null) {
        macroRunning = false
        hideMacroSpinner()
        return [{success: false, value: `Empty macro: ${macro}`, hint: `Empty macro: ${macro}`}]
    }
    let execution = []
    let matches = macro.match(/\{\{(.*?)}}/g)
    if (!matches || matches.length == 0) {
        macroRunning = false
        hideMacroSpinner()
        return [{success: false, value: `Invalid macro: ${macro}`, hint: `Invalid macro: ${macro}`}]
    }
    for (let [index, match] of matches.entries()) {
        try {
            if (execution.some(it => it.terminate)) {
                execution.push({
                    success: false,
                    value: `More content after terminating statement ${matches[index] ?? ""}`,
                    hint: `More content after terminating statement <b>${matches[index] ?? ""}</b>`
                })
                macroRunning = false
                hideMacroSpinner()
                return execution
            }
            if (execution.length > 0 && (execution[execution.length - 1].success === false)) {
                execution.push({
                    success: false,
                    value: "Can't continue, because previous statement failed",
                    hint: "Can't continue, because previous statement failed"
                })
                macroRunning = false
                hideMacroSpinner()
                return execution
            }
            execution.push(await resolveParameter(match.slice(2, -2), eval, execution))
        } catch (error) {
            execution.push({success: false, value: error, hint: `Error in macro: ${error}`})
        }
    }
    macroRunning = false
    hideMacroSpinner()
    return execution
}

async function resolveParameter(parameter, eval, context) {
    try {
        if (parameter.length == 0) {
            if (eval) return "Empty parameter"
            return {success: true, value: parameter, hint: `Empty parameter`}
        }
        switch (true) {
            //Tenant/Environment Colors
            case /tenant\(.+\)/.test(parameter): {
                let [attribute, tenantId] = parameter.match(/\((.+)\)/)?.[1]?.split(",")
                switch (attribute) {
                    case "color": {
                        let tenant = tenantVariables.globalEnvironment.tenants.filter(it => it.id == tenantId)
                        if (tenantId == null) {
                            return {success: true, value: getTenantColor(), hint: `Use <b style='color: ${getTenantColor()}'>this</b> color`}
                        } else if (tenant.length > 0) {
                            return {success: true, value: tenant[0].color, hint: `Use <b style='color: ${tenant[0].color}'>this</b> color`}
                        } else {
                            return {success: false, value: `Tenant ${tenantId} not found in environment`, hint: `Tenant ${tenantId} not found in environment`}
                        }
                    }
                    default: {
                        return {success: false, value: `Invalid tenant property ${attribute}`, hint: `Invalid tenant property ${attribute}`}
                    }
                }
            }
            case /constant\(.+\)/.test(parameter):
                let id = parameter.match(/\((.+)\)/)
                if (id.length > 0) {
                    id = resolveTokens(id[1], context)
                    let constants = eval ? JSON.parse(settingsDialog.tabs[2].getSaveOutput()) : configuration.overrides?.constant
                    if (eval) constants = Object.assign({}, constants?.constant ?? {}, constants?.environments?.[getTenantOwner()]?.constant ?? {}, constants?.tenants?.[getTenantId()]?.constant ?? {})
                    let constant = constants?.[id]
                    if (constant) {
                        return {success: true, value: constant, hint: `Use constant value <b>${constant}</b>`}
                    } else {
                        return {success: false, value: `Constant ${id} not found`, hint: `Constant <b>${id}</b> not found`}
                    }
                } else {
                    return {success: false, value: `Empty Constant ID`, hint: "Empty Constant ID"}
                }
            case /var\(.+\)/.test(parameter):
                let token = parameter.match(/\((.+)\)/)
                if (token.length > 0) {
                    token = token[1]
                    let variable = variables[token]
                    if (variable === undefined) {
                        return {success: false, value: `Unknown variable ${token}`, hint: `Unknown variable <b>${token}</b>`}
                    } else if (variable === null) {
                        return {success: false, value: `Variable ${token} not initialized`, hint: `Variable <b>${token}</b> not initialized`}
                    } else{
                        return {success: true, value: variable, hint: `Use variable value <b>${variable}</b>`}
                    }
                } else {
                    return {success: false, value: `Empty variable ID`, hint: "Empty variable ID"}
                }
            case parameter.startsWith("date"): {
                let date = new Date()
                if (parameter == "date") {
                    let dateNow = new Date().toISOString()
                    return {success: true, value: dateNow, hint: `Use current date (${dateNow})`}
                } else {
                    let dateModifiers = parameter.match(/\((.+)\)/)
                    if (dateModifiers != null) {
                        let [offset, format] = dateModifiers[1].split("|")
                        let dateWithOffset = offset ? applyOffsets(date, offset) : null
                        let dateWithPattern = format ? formatDate(dateWithOffset ?? date, format) : null
                        return {success: true, value: dateWithPattern ?? dateWithOffset?.toISOString() ?? date.toISOString(), hint: `Use UTC date (${date.toISOString()})${dateWithOffset ? `, apply offset (${dateWithOffset.toISOString()})` : ""} ${dateWithPattern ? `, apply pattern (${dateWithPattern})` : ""}`}
                    } else {
                        return {success: false, value: `Trailing content (<b>${parameter.replace(/date\(?\)?/, "")}</b>) after date function`, hint: `Trailing content (<b>${parameter.replace(/date\(?\)?/, "")}</b>) after date function`}
                    }
                }
            }
            case parameter.startsWith("pingCC"): {
                if (parameter == "pingCC") {
                    return await connectionTestCC(null, eval)
                } else {
                    let ccId = parameter.match(/\((.+)\)/)
                    if (ccId != null) {
                        ccId = resolveTokens(ccId[1], context)
                        return await connectionTestCC(ccId, eval)
                    } else {
                        return {success: false, value: `Missing location ID`, hint: "Missing location ID"}
                    }
                }
            }
            case /delay\(.+\)/.test(parameter): {
                if (context == null) {
                    return {success: false, value: "Function delay can only be used as a macro", hint: "Function <b>delay</b> can only be used as a macro"}
                }
                let delay = parameter.match(/\((.+)\)/)
                if (delay.length > 0) {
                    delay = resolveTokens(delay[1], context)
                    if (isNaN(delay)) {
                        return {success: false, value: `Invalid delay value ${delay}`, hint: `Invalid delay value <b>${delay}</b>`}
                    }
                    delay = parseInt(delay)
                    if (eval) return {success: true, value: delay, hint: `Delay by ${delay}ms`}
                    return await new Promise(resolve => setTimeout(resolve, delay)).then(() => {
                        return {success: true, value: true, hint: `Delay finished by ${delay}ms`}
                    }).catch(error => {
                        return {success: false, value: error, hint: `Error in delay: ${error}`}
                    })
                } else {
                    return {success: false, value: `No delay specified`, hint: "No delay specified"}
                }
            }
            case /(open|navigate)\(.*\)/.test(parameter): {
                if (context == null) {
                    return {success: false, value: "Function open/navigate can only be used as a macro", hint: "Function <b>open/navigate</b> can only be used as a macro"}
                }
                let urlMatch = parameter.match(/(.*)\((.+)\)/)
                if (urlMatch.length > 0) {
                    let url = resolveTokens(urlMatch[2], context)
                    if (urlMatch[1] == "open") {
                        if (!eval) openLinkInNewTab(url, false)
                        return {success: true, value: url, hint: `Open <b>${url}</b> in new tab`}
                    } else if (urlMatch[1] == "navigate") {
                        return {success: true, value: null, terminate: () => { window.location.assign(prependHost(url)) }, hint: `Navigate to ${prependHost(url)}`, terminationAction: `Navigate to ${prependHost(url)}`}
                    } else {
                        return {success: false, value: "DEVELOPER ERROR", hint: "DEVELOPER ERROR"}
                    }
                } else {
                    return {success: false, value: `No URL specified`, hint: "No URL specified"}
                }
            }
            case parameter == "prompt" : {
                if (context == null) {
                    return {success: false, value: "Function prompt can only be used as a macro", hint: "Function <b>prompt</b> can only be used as a macro"}
                }
                return {success: false, value: "Prompt for user input (Not implemented, Execute will fail)", hint: "Prompt for user input (Not implemented, Execute will fail)"}
            }
            case /if\(.+\)/.test(parameter): {
                if (context == null) {
                    return {success: false, value: "Function if can only be used as a macro", hint: "Function <b>if</b> can only be used as a macro"}
                }
                let condition = parameter.match(/\((.+)\)/)
                if (condition.length > 0) {
                    condition = condition[1]
                    let [conditionString, tag] = condition.split(",", 2)
                    let [left, right] = conditionString.split("=", 2)
                    let conditionLeft = resolveTokens(left, context, eval)
                    let conditionRight = resolveTokens(right, context, eval)
                    let tagString = tag ? resolveTokens(tag, context, eval) : null
                    return {success: conditionLeft == conditionRight, value: conditionLeft == conditionRight ? true : `Condition${tag ? ` <b>${tagString}</b>` : ""} not met`, hint: `If <b>${conditionLeft.length <= 30 ? conditionLeft : conditionLeft.slice(0, 5) + "..." + value.slice(-5)}</b> equals <b>${conditionRight.length <= 30 ? conditionRight : conditionRight.slice(0, 5) + "..." + value.slice(-5)}</b> (Result: ${conditionLeft == conditionRight}, Execution result may differ)`}
                } else {
                    return {success: false, value: "No condition specified", hint: "No condition specified"}
                }
            }
            case /copy\(.+\)/.test(parameter): {
                if (context == null) {
                    return {success: false, value: "Function copy can only be used as a macro", hint: "Function <b>copy</b> can only be used as a macro"}
                }
                return {success: false, value: "Not implemented", hint: "Not implemented"}
            }
            case /store\(.+\)/.test(parameter): {
                if (context == null) {
                    return {success: false, value: "Function store can only be used as a macro", hint: "Function <b>store</b> can only be used as a macro"}
                }
                let token = parameter.match(/\((.+)\)/)
                if (token.length > 0) {
                    if (!token[1].includes(",")) {
                        return {success: false, value: `No value to store in ${token[1]}`, hint: "No value to store in <b>${token[1]}</b>"}
                    }
                    let [storeToken, ...storeValue] = token[1].split(",")
                    try {
                        let value = resolveTokens(storeValue.join(","), context, eval)
                        if (eval) {
                            variables.eval = value
                            return {success: true, value: storeToken, hint: `Write value <b>${(value.length <= 30) ? value : value.slice(0, 5) + "..." + value.slice(-5)}</b> to storage`}
                        }
                        variables.storage[storeToken] = value
                        return {success: true, value: storeToken, hint: `Write value <b>${(value.length <= 30) ? value : value.slice(0, 5) + "..." + value.slice(-5)}</b> to storage`}
                    } catch (e) {
                        return {success: false, value: `Could not store value in ${storeToken}`, hint: `Could not store value in <b>${storeToken}</b> (DEVELOPER ERROR)`}
                    }
                } else {
                    return {success: false, value: `Empty storage ID`, hint: "Empty storage ID"}
                }
            }
            case /read\(.+\)/.test(parameter): {
                if (context == null) {
                    return {success: false, value: "Function read can only be used as a macro", hint: "Function <b>read</b> can only be used as a macro"}
                }
                let token = parameter.match(/\((.+)\)/)
                if (token.length > 0) {
                    token = token[1]
                    let variable = eval ? variables.eval : variables.storage?.[token]
                    if (!variable) {
                        return {success: false, value: `Value ${token} not set`, hint: `Value <b>${token}</b> not set`}
                    } else {
                        return {success: true, value: variable, hint: `Read value <b>${(variable.length <= 30) ? variable : variable.slice(0, 5) + "..." + variable.slice(-5)}</b> from storage`}
                    }
                } else {
                    return {success: false, value: `Empty storage ID`, hint: "Empty storage ID"}
                }
            }
            default: {
                return {success: false, value: `Unresolved parameter or function call ${parameter}`, hint: `Unresolved parameter or function call <b>${parameter}</b>`}
            }
        }
    } catch (error) {
        return {success: false, value: error, hint: `Error in parameter ${parameter}: ${error}`}
    }
}

function resolveTokens(tokenString, context) {
    if (context == null) return tokenString
    let tokens = [...tokenString.matchAll(/(?<!\\)\$(\d+)/g)].map(it => parseInt(it[1])).sort().reverse()
    let output = tokenString
    let invalidTokens = []
    tokens.forEach(token => {
        let replacement = context[token].value
        if (replacement == null) {
            invalidTokens.push(token)
        } else {
            output = output.replace(`$${token}`, replacement)
        }
    })
    if (invalidTokens.length > 0) {
        return {success: false, value: invalidTokens, hint: `Invalid tokens: ${invalidTokens.map(it => `<b>${it}</b>`).join(", ")}`}
    }
    return output
}