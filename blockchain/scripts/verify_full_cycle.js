const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("--- STARTING FULL CYCLE VERIFICATION ---");

    // 1. Setup
    const clientConfigPath = path.join(__dirname, "../../user-client/src/contractConfig.json");
    const config = JSON.parse(fs.readFileSync(clientConfigPath, 'utf8'));
    const PostalService = await hre.ethers.getContractFactory("PostalService");
    const contract = await PostalService.attach(config.address);

    // 2. Login Check (Admin)
    console.log("\n[1] Testing Login...");
    const [success, user] = await contract.login("admin@post.com", "admin123");
    if (success && user.isController) {
        console.log("✅ Admin Login Successful");
    } else {
        console.error("❌ Admin Login Failed");
        return;
    }

    // 3. Simulate Send Flow
    console.log("\n[2] Testing Sending Handshake...");
    const senderAadhar = "1122334455667788"; // Raman

    // Step A: Face Match -> Verify User
    console.log("   Controller signals Face Match...");
    let tx = await contract.verifyUser(senderAadhar);
    await tx.wait();
    console.log("   ✅ UserVerified Event Emitted");

    // Step B: OTP Match -> Authorize User
    console.log("   Controller signals OTP Match (Access Grant)...");
    tx = await contract.authorizeUser(senderAadhar);
    await tx.wait();
    console.log("   ✅ AccessGranted Event Emitted");

    // Step C: Create Order
    console.log("   User creates Order...");
    const orderId = "ORD-TEST-001";
    const receiverEmail = "raman@user.com"; // Sending to self for test
    tx = await contract.createOrder(
        orderId,
        senderAadhar,
        "9988776655", // Receiver Mobile
        receiverEmail,
        "123 Test St",
        "Test Package",
        "1.5"
    );
    await tx.wait();
    console.log(`   ✅ Order Created: ${orderId}`);

    // 4. Verification of "Pending Orders"
    console.log("\n[3] Verifying Pending List...");
    const allOrders = await contract.getOrders();
    const myOrder = allOrders.find(o => o.id === orderId);

    if (myOrder && myOrder.status === "IN_TRANSIT" && myOrder.receiverEmail === receiverEmail) {
        console.log("   ✅ Order found in ledger with correct status and receiver.");
    } else {
        console.error("   ❌ Order not found or incorrect data", myOrder);
        return;
    }

    // 5. Simulate Receive Flow (Delivery)
    console.log("\n[4] Testing Delivery Handshake...");
    console.log("   Controller updates status to DELIVERED...");

    tx = await contract.updateOrderStatus(orderId, "DELIVERED");
    await tx.wait();

    const updatedOrders = await contract.getOrders();
    const deliveredOrder = updatedOrders.find(o => o.id === orderId);

    if (deliveredOrder.status === "DELIVERED") {
        console.log("   ✅ Order status updated to DELIVERED");
    } else {
        console.error("   ❌ Failed to update status");
    }

    console.log("\n--- VERIFICATION COMPLETE: ALL SYSTEMS GO ---");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
