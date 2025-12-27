# Secure Blockchain Postal Delivery System

I designed and built a **Secure Decentralized Logistics Platform** to eliminate trust issues in traditional postal systems. I engineered a hybrid architecture using **Ethereum Smart Contracts (Solidity)** for immutable transaction recording and **React.js/Node.js** for a responsive user interface. To prevent identity fraud, I integrated a custom **client-side biometric authentication system** (face-api.js) that verifies users before granting blockchain write access. The system features a 3-portal ecosystem (Admin, User, Public) and ensures data integrity through cryptographic proofs.

##  Demo Video

[![Watch the Demo](https://img.youtube.com/vi/IvXB2HSMP50/0.jpg)](https://youtu.be/IvXB2HSMP50)

> **Click the image above to watch the full walkthrough.**

##  Features

- **Decentralized Tracking**: Orders are tracked on the Ethereum blockchain (Hardhat).
- **Three-Portal System**:
  - **Landing Page**: Public entry point.
  - **User Portal**: For customers to book, track, and manage deliveries.
  - **Controller Portal**: For postal admins to update status and manage logistics.
- **Secure Authentication**: Face registration and verification for secure access.
- **Delivery Timestamp**: Immutably records exactly when an order was delivered.
- **Account Management**: Users can securely delete their account, removing their access from the blockchain.

##  Tech Stack

### Frontend & Interface
- **React.js** to build the interactive User, Controller, and Landing portals.
- **Vite** as the build tool for its Hot Module Replacement (HMR) and fast performance.
- **Tailwind CSS** to design the modern, glassmorphism UI and responsive grids.
- **Framer Motion** to add smooth animations and interactive transitions.
- **face-api.js** to implement client-side facial recognition and verification.
- **Lucide React** for consistent, clean iconography throughout the app.

### Blockchain & Security
- **Solidity** to write the `PostalService.sol` smart contract that handles logic and data storage.
- **Hardhat** to compile, test, and deploy my local blockchain environment.
- **Ethers.js** to connect my React frontend to the Ethereum network.
- **SHA-256 Hashing** within the smart contract for secure password verification.

### Backend & Data
- **Node.js & Express** to handle backend processes and Face API model serving.
- **MongoDB** to store heavy user metadata off-chain for efficiency.

### Tools & DevOps
- **Git** for version control and code management.
- **Batch Scripts** to automate the startup of multiple servers and blockchain nodes simultaneously.

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
