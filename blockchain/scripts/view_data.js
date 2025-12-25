const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("Connecting to Local Blockchain...");

    // 1. Get Contract Address from Client Config
    const clientConfigPath = path.join(__dirname, "../../user-client/src/contractConfig.json");
    if (!fs.existsSync(clientConfigPath)) {
        console.log("Error: Client config not found. Is the contract deployed?");
        return;
    }
    const config = JSON.parse(fs.readFileSync(clientConfigPath, 'utf8'));
    const address = config.address;

    // 2. Attach to Contract
    const PostalService = await hre.ethers.getContractFactory("PostalService");
    const contract = await PostalService.attach(address);
    console.log(`Connected to PostalService at: ${address}\n`);

    // 3. Query Known Users
    console.log("--- USERS (Known IDs) ---");
    const knownAadhars = [
        "1122334455667788", // Raman
        "1234123412345678"  // Controller
    ];

    for (const aadhar of knownAadhars) {
        const user = await contract.getUser(aadhar);
        if (user.isRegistered) {
            console.log(`[USER FOUND]`);
            console.log(`  Name: ${user.name}`);
            console.log(`  Aadhar: ${user.aadhar}`);
            console.log(`  Mobile: ${user.mobile}`);
            console.log(`  Role: ${user.isController ? "CONTROLLER" : "CITIZEN"}`);
            console.log(`  Face Data: ${user.faceDescriptor.length > 50 ? "(Present, Encrypted/Hashed)" : "(Empty/None)"}`);
            console.log("");
        } else {
            console.log(`[User ${aadhar}] NOT FOUND`);
        }
    }

    // 4. Query All Orders
    console.log("--- ORDERS (All) ---");
    const orders = await contract.getOrders();
    if (orders.length === 0) {
        console.log("No orders found on the ledger.");
    } else {
        orders.forEach((order) => {
            console.log(`[ORDER #${order.id}]`);
            console.log(`  Sender: ${order.senderAadhar}`);
            console.log(`  Receiver Mobile: ${order.receiverMobile}`);
            console.log(`  Description: ${order.description}`);
            console.log(`  Status: ${order.status}`);
            console.log(`  Timestamp: ${new Date(Number(order.timestamp) * 1000).toLocaleString()}`);
            console.log("");
        });
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
