# Secure Blockchain Postal Delivery System

A decentralized postal delivery tracking system built with **Blockchain technology**, ensuring transparency, security, and immutability of delivery records.

##  Features

- **Decentralized Tracking**: Orders are tracked on the Ethereum blockchain (Hardhat).
- **Three-Portal System**:
  - **Landing Page**: Public entry point.
  - **User Portal**: For customers to book, track, and manage deliveries.
  - **Controller Portal**: For postal admins to update status and manage logistics.
- **Secure Authentication**: Face registration and verification for secure access.
- **Delivery Timestamp**: Immutably records exactly when an order was delivered.

##  Tech Stack

- **Frontend**: React.js, Vite, TailwindCSS
- **Blockchain**: Solidity, Hardhat, Ethers.js
- **Backend**: Node.js, Express
- **Database**: MongoDB (for user data), Blockchain (for order transactions)

##  Project Structure

- `blockchain/`: Smart Contract (Solidity) & Hardhat scripts.
- `server/`: Backend API server.
- `user-client/`: Customer dashboard.
- `controller-client/`: Admin/Postman dashboard.
- `landing-client/`: Main landing page website.

##  How to Run

1. **Install Dependencies**:
   Run `npm install` in all subdirectories (`server`, `user-client`, `controller-client`, `landing-client`, `blockchain`).

2. **Start the Blockchain**:
   ```bash
   cd blockchain
   npx hardhat node
   ```

3. **Deploy Smart Contract**:
   ```bash
   cd blockchain
   npx hardhat run scripts/deploy.js --network localhost
   ```

4. **Start the App**:
   You can use the provided batch script to start all services at once:
   ```bash
   restart_app_blockchain.bat
   ```
