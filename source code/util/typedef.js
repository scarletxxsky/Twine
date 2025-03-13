class RuntimeArtifactDetails {
    artifactDependencies;
    adapterDependencies;
    endpoints;
    logConfig;

    constructor(rawData) {
        const details = JSON.parse(rawData);
        this.endpoints = this.extractEndpoints(details.endpointInformation);
        this.logConfig = details.logConfiguration;
        const dependencies = this.parseDependencies(details.artifactInformation?.typeSpecificTags);
        this.artifactDependencies = this.parseArtifactDependencies(dependencies);
        this.adapterDependencies = this.parseAdapterDependencies(dependencies);
    }

    // Extract and flatten endpoint instances
    extractEndpoints(endpointInformation) {
        return endpointInformation?.flatMap(info => info.endpointInstances ?? []) ?? [];
    }

    // Parse type-specific tags for dependency information
    parseDependencies(typeSpecificTags) {
        const requireCapabilityTag = typeSpecificTags?.find(tag => tag.name === "Require-Capability")?.value;
        return requireCapabilityTag ? requireCapabilityTag.split(",").map(dep => dep.split(";")) : [];
    }

    // Extract artifact dependencies with 4 components
    parseArtifactDependencies(dependencies) {
        return dependencies
            .filter(dependency => dependency.length === 4)
            .map(dependency => new RuntimeArtifactDependency(dependency));
        }

    // Extract adapter dependencies with 2 components
    parseAdapterDependencies(dependencies) {
        return dependencies
            .filter(dependency => dependency.length === 2)
            .map(dependency => new RuntimeAdapterDependency(dependency));
    }
}

class RuntimeAdapterDependency {
    provider;
    name;
    id;

    constructor(dependencyComponents) {
        const [provider, name] = dependencyComponents[0].split("-", 2);
        this.provider = provider;
        this.name = name;
        this.id = `${name}${provider !== "SAP" ? `_${provider}` : ""}`.toUpperCase();
    }
}

class RuntimeArtifactDependency {
    type;
    id;

    constructor(dependencyComponents) {
        this.type = dependencyComponents[2].split("=")[1]?.slice(1, -1);
        this.id = dependencyComponents[0]?.split(".", 2)[1];
    }
}

class TwineStatusCode {
    code;
    message;
    actualMessage;

    constructor(code, message, explicitMessage) {
        this.code = code;
        this.message = message;
        this.actualMessage = explicitMessage;
    }
}

