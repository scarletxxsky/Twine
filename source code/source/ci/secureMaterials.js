async function fetchSecureMaterials() {
    let response = await chrome.runtime.sendMessage({type:"SAP_IS_UNIFY_REQUEST", requestType: "secureMaterials", tenantId: getTenantUid(), maxAge: integrationContent.secureMaterials.maxAge})

    if (response.status == "request" || response.status == "reassign") {
        /*if (integrationContent.secureMaterials.content.length > 0 && !UserActivation.isActive && response.status != "reassign") {
            info("User inactive. Skipping request (Secure Materials)")
            return
        }*/
        return callXHR("GET", secureMaterialsUrl(), null, null, false, {headers: {"Cache-Control": "no-cache, no-store, max-age=0"}}).then(result => {
            let runStart = window.performance.now()
            let secureMaterialXml = getDocument(result)

            let secureMaterials = (Array.from(secureMaterialXml.querySelectorAll("artifactInformations")).length > 0 ? Object.entries(
                Array.prototype.reduce.call(Array.from(secureMaterialXml.querySelectorAll("artifactInformations")), (data, artifact) => {
                    let type = artifact.querySelector(`tags[name='sec:credential.kind'], tags[name='type']`)?.getAttribute("value")
                    if (!data[type]) {
                        data[type] = []
                    }
                    data[type].push(artifact)
                    return data
                }, {})
            ) : []).filter(property => {
                return Array.isArray(property[1])
            })
                .sort((a, b) => {
                    return (getTypeConversion("type", "priority", a[0]) < getTypeConversion("type", "priority", b[0])) ? -1 : (getTypeConversion("type", "priority", a[0]) < getTypeConversion("type", "priority", b[0])) ? 1 : 0
                }).map(typeList => {
                    return {
                        title: getTypeConversion("type", "displayNameP", typeList[0]),
                        meta: {
                            twineContext: "TREE_IBRANCH",
                            twineContextType: typeList[0]
                        },
                        children: typeList[1].map(it => {
                            let id = it.querySelector("id").innerHTML
                            return {
                                title: it.querySelector("id").innerHTML,
                                meta: {
                                    twineContext: "TREE_LEAF",
                                    twineContextType: "SecureMaterial",
                                    secureMaterialId: id,
                                    secureMaterialType: typeList[0],
                                    secureMaterialUser: it.querySelector("tags[name=user]")?.getAttribute("value"),
                                    search: id.replaceAll(/[\s_\-()\[\]]|(?<!^):/g, "").toLowerCase(),
                                    shortText: it.querySelector("description")?.innerHTML,
                                    deployedBy: it.querySelector(`tags[name='deployed.by']`)?.getAttribute("value"),
                                    deployedOn: it.querySelector(`tags[name='deployed.on']`)?.getAttribute("value"),
                                    tokenUrl: it.querySelector(`tags[name='sec:server.url']`)?.getAttribute("value"),
                                    tenantId: it.querySelector("tenantId").innerHTML
                                },
                                children: null
                            }
                        })
                            .sort((a, b) => {
                                return (a.title < b.title) ? -1 : (a.title > b.title) ? 1 : 0
                            })
                    }
                })
            chrome.runtime.sendMessage({
                type:"SAP_IS_UNIFY_RESOLVE",
                requestType: "secureMaterials",
                tenantId: getTenantUid(),
                data: secureMaterials
            })

            integrationContent.secureMaterials.content = secureMaterials
            info("Request finished (Secure Materials)")
            elapsedTime += window.performance.now() - runStart
        }).catch(reject => {
            console.error(reject)
        })
    } else if (response.status == "subscribed") {
        info("Passive response (Secure Materials)")
        integrationContent.secureMaterials.content =  response.data
    } else if (response.status == "cache") {
        info("Cached response (Secure Materials)")
        integrationContent.secureMaterials.content =  response.data
    }
}