async function fetchSecureMaterials() {
    let response = await chrome.runtime.sendMessage({type:"SAP_IS_UNIFY_REQUEST", requestType:"secureMaterials", tenantId:getTenantId(), maxAge: 3600})
    let secureMaterials

    if (response.status == "request") {
        secureMaterials = await callXHR("GET", secureMaterialsUrl(), null, null, true, {headers: {"Cache-Control": "no-cache, no-store, max-age=0"}}).then(result => {
            let secureMaterialXml = new DOMParser().parseFromString(result, "application/xml")

            return (Array.from(secureMaterialXml.querySelectorAll("artifactInformations")).length > 0 ? Object.entries(
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
                                    search: id.replaceAll(/[\s_\-()\[\]]|(?<!^):/g, "").toLowerCase(),
                                    shortText: it.querySelector("description")?.innerHTML,
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
        }).catch(reject => {
            console.log(reject)
        })

        chrome.runtime.sendMessage({type:"SAP_IS_UNIFY_RESOLVE", requestType:"secureMaterials", tenantId:getTenantId(), data:secureMaterials})

    } else if (response.status = "subscribed") {
        console.log(response)
        return response.secureMaterials
    } else if (response.status = "cache") {
        console.log(response)
        return response.secureMaterials
    }

    return secureMaterials
}