const path = require("path");
const fs = require("fs");

const downloadDtsFiles = async (fileListResponse) => {
    // Filter out only the .d.ts files
    const filteredFile = fileListResponse.data.filter((item) =>
        item.name.endsWith(".d.ts")
    );

    // Download the .d.ts files from the vscode repository
    for (const element of filteredFile) {
        const item = element;
        const fileName = path.basename(item.download_url);
        const filePath = path.join("./types", fileName);
        const response = await fetch(item.download_url);
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));
    }
}

module.exports = async (github, isLocal = false) => {
    // Read the package.json file to get the version number
    let packageJson = JSON.parse(
        await fs.readFileSync("package.json", "utf-8")
    );

    // Set the built_at timestamp
    const createdAt = Date.now().toString();

    // Get the list of proposed APIs from the vscode repository
    const vscodeDtsFiles = await github.rest.repos.getContent({
        owner: "microsoft",
        repo: "vscode",
        path: "src/vscode-dts",
        ref: `release/${packageJson.version.split(".").slice(0, 2).join(".")}`,
    });

    // Filter out the proposed APIs from the list of files
    const proposedApis = vscodeDtsFiles.data
        .map((item) => item.name)
        .filter((item) => item.startsWith("vscode.proposed."))
        .filter((item) => item.endsWith(".d.ts"))
        .map((item) => item.replace("vscode.proposed.", ""))
        .map((item) => item.replace(".d.ts", ""));

    // Update the package.json file
    packageJson.enabledApiProposals = proposedApis;
    packageJson.engines = {};
    packageJson.engines.vscode = `^${packageJson.version}`;
    packageJson.createdAt = createdAt;

    // Write the extension.hash file
    if (!isLocal) {
        await fs.writeFileSync("extension.hash", createdAt)
    }

    // Write the updated package.json file
    await fs.writeFileSync(
        "package.json",
        JSON.stringify(packageJson, null, 2)
    );

    // Create the types directory if it doesn't exist
    if (!fs.existsSync("./types")) {
        fs.mkdirSync("./types", { recursive: true });
    }

    // Download the .d.ts files from the vscode repository
    await downloadDtsFiles(vscodeDtsFiles);

    // Get the list of git APIs from the vscode repository
    const gitDtsFiles = await github.rest.repos.getContent({
        owner: "microsoft",
        repo: "vscode",
        path: "extensions/git/src/api",
        ref: `release/${packageJson.version.split(".").slice(0, 2).join(".")}`,
    });

    // Download the .d.ts files from the vscode repository
    await downloadDtsFiles(gitDtsFiles);
};
