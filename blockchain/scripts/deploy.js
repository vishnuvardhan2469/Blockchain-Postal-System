const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const PostalService = await hre.ethers.getContractFactory("PostalService");
    const postalService = await PostalService.deploy();

    await postalService.waitForDeployment();
    const address = await postalService.getAddress();

    console.log("PostalService deployed to:", address);

    // SEED MOCK DATA
    // Seed Controller
    console.log("Registering Admin Controller...");
    await postalService.registerUser(
        "Master Controller",
        "9999999999",
        "vishnuvardhanchinni14@gmail.com",
        "vishnu4617B",
        "1234123412345678",
        "[]",
        true // isController
    );

    // Seed User Raman
    console.log("Registering User Raman...");
    // Note: We use an empty descriptor mock initially. The user will re-register on the frontend to save the real one.
    await postalService.registerUser(
        "Raman",
        "9876543210",
        "raman@user.com",
        "user123", // Password
        "1122334455667788",
        "[]",
        false // isController
    );

    console.log("Seeding Complete!");

    // EXPORT ABI & ADDRESS TO CLIENTS
    const fs = require("fs");
    const path = require("path");

    const artifactsPath = path.join(__dirname, "../artifacts/contracts/PostalService.sol/PostalService.json");
    const contractArtifact = JSON.parse(fs.readFileSync(artifactsPath, "utf8"));

    const config = {
        address: address,
        abi: contractArtifact.abi
    };

    const clients = [
        path.join(__dirname, "../../user-client/src/contractConfig.json"),
        path.join(__dirname, "../../controller-client/src/contractConfig.json")
    ];

    clients.forEach(clientPath => {
        fs.writeFileSync(clientPath, JSON.stringify(config, null, 2));
        console.log(`Exported config to ${clientPath}`);
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

