const hre = require("hardhat");

async function main() {
    const PostalService = await hre.ethers.getContractFactory("PostalService");

    // Get the address from the artifact or just attach to the known deployment if we had it saved.
    // Since we don't store the address in a file for this script, we'll try to read it from the client config
    // or just deploy a fresh one if we suspect it's not there? 
    // Better: Read the client config.

    const fs = require('fs');
    const path = require('path');
    const clientConfigPath = path.join(__dirname, "../../user-client/src/contractConfig.json");

    if (!fs.existsSync(clientConfigPath)) {
        console.log("No client config found. Contract might not be deployed.");
        return;
    }

    const config = JSON.parse(fs.readFileSync(clientConfigPath, 'utf8'));
    const address = config.address;
    console.log("Checking Contract at:", address);

    const contract = await PostalService.attach(address);

    const aadhar = "112233445566";
    const user = await contract.getUser(aadhar);

    console.log("Querying Aadhar:", aadhar);
    console.log("Is Registered:", user.isRegistered);
    console.log("Name:", user.name);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
