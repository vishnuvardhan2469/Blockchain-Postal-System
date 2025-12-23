// server/data/mockData.js

const users = [
    {
        aadhar: "1234567812345678",
        mobile: "6304509328",
        name: "vishnu",
        address: "ABC"
    },
    {
        aadhar: "1234567891234567",
        mobile: "1234567891",
        name: "vardhan",
        address: "DEF"
    }
];

const controllers = [
    {
        email: "vishnuvardhanchinni14@gmail.com",
        password: "vishnu4617B", // Plain text for prototype simplicity
        name: "Main"
    }
];

// In-memory store for active transactions/orders
// Structure: { id: string, senderAadhar: string, receiverAddress: string, status: string, otp: string, type: 'SEND' | 'RECEIVE' }
let transactions = [];

// In-memory store for OTPs
// Structure: { mobile: string, otp: string, expiresAt: number }
let otpStore = {};

module.exports = {
    users,
    controllers,
    transactions,
    otpStore
};
