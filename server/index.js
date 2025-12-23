// server/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require("socket.io");
const axios = require('axios');
const nodemailer = require('nodemailer');
const { users, controllers, transactions, otpStore } = require('./data/mockData');

const app = express();
const server = http.createServer(app);

// --- Nodemailer Setup ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'vishnuvardhanchinni14@gmail.com', // Your Email
        pass: 'enffbibjroyciceg' // Your App Password
    }
});
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for prototype
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(bodyParser.json());

const PORT = 3001;

// --- Helper Functions ---
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit OTP

// --- Routes ---

// USER: Login / Check Aadhar
app.post('/api/user/login', (req, res) => {
    const { mobile, aadhar } = req.body;
    const user = users.find(u => u.mobile === mobile);

    if (!user) {
        return res.status(404).json({ success: false, message: "Mobile number not registered." });
    }

    // In a real app, we'd check if Aadhar matches the mobile record strictly or if it's just a validity check.
    // Requirement: "if entered aadhar number is not matched pop up a notification as Invalid details"
    if (user.aadhar !== aadhar) {
        return res.status(401).json({ success: false, message: "Invalid Aadhar details for this mobile number." });
    }

    res.json({ success: true, user: { name: user.name, mobile: user.mobile, aadhar: user.aadhar } });
});

// CONTROLLER: Login
app.post('/api/controller/login', async (req, res) => {
    const { email, password } = req.body;
    // Simple password check
    const controller = controllers.find(c => c.email === email && c.password === password);

    if (controller) {
        console.log("Login Success for:", email);

        // Generate Real OTP
        const otp = generateOTP();
        otpStore[email] = { otp, expiresAt: Date.now() + 300000 }; // 5 mins validity setting

        // Send Email
        const mailOptions = {
            from: 'vishnuvardhanchinni14@gmail.com',
            to: email, // Sending to the controller himself
            subject: 'Admin Login Verification Code',
            text: `Your OTP for Secure Delivery App Admin Access is: ${otp}`
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`[EMAIL] OTP ${otp} sent to ${email}`);
            res.json({ success: true, message: "OTP sent to mail", otpRequired: true });
        } catch (error) {
            console.error("Email send error:", error);
            res.status(500).json({ success: false, message: "Failed to send email OTP" });
        }

    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// CONTROLLER: Verify Login OTP
app.post('/api/controller/verify-login-otp', (req, res) => {
    const { email, otp } = req.body;

    const record = otpStore[email];

    if (record && record.otp === otp) {
        // Clear OTP after use
        delete otpStore[email];
        res.json({ success: true, token: "mock-controller-token" });
    } else {
        // Allow 1234 as fallback master key for testing if needed, or remove for strict prod
        if (otp === '1234') {
            return res.json({ success: true, token: "mock-controller-token" });
        }
        res.status(400).json({ success: false, message: "Invalid OTP" });
    }
});

// SHARED: Generate OTP for Transaction (Sender or Receiver flow)
app.post('/api/transaction/generate-otp', (req, res) => {
    const { aadhar, type } = req.body; // type: 'SEND' or 'RECEIVE'

    const user = users.find(u => u.aadhar === aadhar);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    // Face Verification Check (if descriptor provided by Controller)
    // Note: The comparison usually happens on Client (Controller), but we can store intent here.
    // For "specific" recognition, the Controller sends the matched Aadhar. 
    // If the Controller says "I matched this face to this Aadhar", we trust the Controller.
    // So current logic is fine: Controller sends Aadhar, we generate OTP.

    // However, we should ensure the user HAS a face registered if we want to enforce it.
    // if (!user.faceDescriptor) {
    //    return res.status(400).json({ success: false, message: "User face not registered. Please register first." });
    // }

    const otp = generateOTP();
    const transactionId = Date.now().toString();

    // Store transaction intent
    const newTransaction = {
        id: transactionId,
        aadhar,
        type,
        otp,
        status: 'PENDING_OTP',
        timestamp: Date.now()
    };
    transactions.push(newTransaction);

    // Broadcast to User Client (simulating SMS/App notification)
    io.emit(`otp-generated-${aadhar}`, { otp, type, transactionId });

    // --- REAL SMS IMPLEMENTATION (ACTIVE) ---
    // Prerequisite: API_KEY from Fast2SMS
    const sendRealSMS = async () => {
        try {
            await axios.get('https://www.fast2sms.com/dev/bulkV2', {
                params: {
                    authorization: "C1UNlmgVqYLZTB2RptPQ3n8DvjhSEkIfGOo5a4w60M7bzKAHxJ6UMt8cqn1QjPJbv0mIGWezKfx7rgkR", // Key updated
                    variables_values: otp,
                    route: "otp",
                    numbers: user.mobile
                }
            });
            console.log(`[REAL SMS] Sent OTP ${otp} to ${user.mobile}`);
        } catch (err) {
            console.error("Failed to send real SMS:", err.message);
        }
    }
    // Fire and forget (don't await to keep UI fast)
    sendRealSMS();
    // --------------------------------------------------

    res.json({ success: true, transactionId, message: "OTP sent to user" });
});

// CONTROLLER: Verify Transaction OTP
app.post('/api/transaction/verify-otp', (req, res) => {
    const { transactionId, otp } = req.body;

    const transaction = transactions.find(t => t.id === transactionId);

    if (!transaction) {
        return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    if (transaction.otp === otp) {
        transaction.status = 'VERIFIED';

        // Notify User that Controller verified the OTP
        io.emit(`transaction-verified-${transaction.aadhar}`, { success: true, transactionId, type: transaction.type });

        res.json({ success: true, message: "OTP Verified" });
    } else {
        res.status(400).json({ success: false, message: "Incorrect OTP" });
    }
});

// USER: Complete Order (Provide Address & Details)
app.post('/api/user/complete-order', (req, res) => {
    const { transactionId, receiverAddress, receiverMobile, packageDescription, packageWeight } = req.body;

    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return res.status(404).json({ success: false });

    transaction.receiverAddress = receiverAddress;
    transaction.receiverMobile = receiverMobile;
    transaction.packageDescription = packageDescription;
    transaction.packageWeight = packageWeight;
    transaction.status = 'IN_TRANSIT';

    // Notify User
    io.emit(`order-status-${transaction.aadhar}`, { status: 'IN_TRANSIT', message: "Order is travelling" });

    res.json({ success: true, message: "Order placed successfully" });
});

// USER: Submit Complaint
app.post('/api/user/complaint', (req, res) => {
    const { mobile, complaint } = req.body;
    console.log(`[COMPLAINT] From ${mobile}: ${complaint}`);
    res.json({ success: true, message: "Complaint submitted successfully" });
});

// USER: Register Face Descriptor
app.post('/api/user/register-face', (req, res) => {
    const { aadhar, descriptor } = req.body;
    const user = users.find(u => u.aadhar === aadhar);

    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    user.faceDescriptor = descriptor;
    console.log(`[FACE REG] Face registered for ${user.name} (${aadhar})`);
    res.json({ success: true, message: "Face registered successfully" });
});

// USER: Get Transaction History
app.get('/api/user/history/:identifier', (req, res) => {
    const { identifier } = req.params; // Can be mobile or aadhar

    // Find the user to get linking details
    const user = users.find(u => u.mobile === identifier || u.aadhar === identifier);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Filter transactions where user is Sender (by Aadhar) or Receiver (by Mobile)
    const userHistory = transactions.filter(t =>
        t.aadhar === user.aadhar || t.receiverMobile === user.mobile
    ).map(t => ({
        id: t.id,
        type: t.aadhar === user.aadhar ? 'SENT' : 'RECEIVED',
        description: t.packageDescription || 'Standard Parcel',
        weight: t.packageWeight,
        date: new Date(t.timestamp).toLocaleDateString(),
        time: new Date(t.timestamp).toLocaleTimeString(),
        status: t.status
    }));

    res.json({ success: true, history: userHistory });
});

// CONTROLLER: Get User Face Descriptor for Verification
app.post('/api/user/get-face-descriptor', (req, res) => {
    const { aadhar } = req.body;
    const user = users.find(u => u.aadhar === aadhar);

    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.faceDescriptor) {
        return res.status(404).json({ success: false, message: "Face not registered for this user" });
    }

    res.json({ success: true, descriptor: user.faceDescriptor });
});

// RECEIVER FLOW (similar logic can be added if needed, leveraging the generic verify-otp)


io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
