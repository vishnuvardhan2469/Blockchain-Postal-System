const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("Scanning Blockchain Ledger for Users...");

    // 1. Get Contract
    const clientConfigPath = path.join(__dirname, "../../user-client/src/contractConfig.json");
    const config = JSON.parse(fs.readFileSync(clientConfigPath, 'utf8'));
    const PostalService = await hre.ethers.getContractFactory("PostalService");
    const contract = await PostalService.attach(config.address);

    // 2. Query 'UserRegistered' Events
    const filter = contract.filters.UserRegistered();
    const events = await contract.queryFilter(filter);

    const users = [];

    for (const event of events) {
        // Event only emits (aadhar, name). Retrieve full details from storage.
        const { aadhar } = event.args;
        const user = await contract.getUser(aadhar);

        const role = user.isController ? "CONTROLLER" : "CITIZEN";

        users.push({
            Name: user.name,
            Mobile: user.mobile,
            Aadhar: user.aadhar,
            Role: role
        });
    }

    const output = JSON.stringify(users, null, 2);
    console.log(output);
    fs.writeFileSync('users.json', output);
    console.log("\nData written to users.json");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
