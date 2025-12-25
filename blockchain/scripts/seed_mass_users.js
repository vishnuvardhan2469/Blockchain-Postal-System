const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("Connecting to Contract...");

    // 1. Get Contract Address
    const clientConfigPath = path.join(__dirname, "../../user-client/src/contractConfig.json");
    if (!fs.existsSync(clientConfigPath)) {
        console.log("Error: Client config not found.");
        return;
    }
    const config = JSON.parse(fs.readFileSync(clientConfigPath, 'utf8'));
    const address = config.address;

    // 2. Attach
    const PostalService = await hre.ethers.getContractFactory("PostalService");
    const contract = await PostalService.attach(address);

    // 3. Generate and Register 10 Users
    console.log("\n--- SEEDING 10 RANDOM USERS ---");

    const names = ["Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Reyansh", "Vivaan", "Krishna", "Ishaan", "Shaurya"];

    for (let i = 0; i < 10; i++) {
        // Generate Random 10-digit Mobile (starts with 6-9)
        const mobile = (Math.floor(Math.random() * 4000000000) + 6000000000).toString();

        // Generate Random 16-digit Aadhar
        let aadhar = "";
        for (let j = 0; j < 16; j++) {
            aadhar += Math.floor(Math.random() * 10).toString();
        }

        const name = names[i] || `User_${i}`;

        process.stdout.write(`Registering ${name} (${mobile} / ${aadhar})... `);

        try {
            const tx = await contract.registerUser(
                name,
                mobile,
                aadhar,
                "[]", // No face descriptor for bulk seed
                false // Not controller
            );
            await tx.wait();
            console.log("DONE");
        } catch (err) {
            console.log("FAILED", err.message);
        }
    }

    console.log("\n--- SEEDING COMPLETE ---");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
