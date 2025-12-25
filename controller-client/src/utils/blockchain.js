import { ethers } from 'ethers';
import contractConfig from '../contractConfig.json';

// Hardhat Default Account #0 Private Key (for Demo/System use)
const SYSTEM_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const LOCAL_RPC_URL = "http://localhost:8545";

export const getContract = async () => {
    try {
        const provider = new ethers.JsonRpcProvider(LOCAL_RPC_URL);
        const wallet = new ethers.Wallet(SYSTEM_PRIVATE_KEY, provider);

        const contract = new ethers.Contract(
            contractConfig.address,
            contractConfig.abi,
            wallet
        );

        return contract;
    } catch (error) {
        console.error("Blockchain Connection Error:", error);
        return null;
    }
};

export const parseError = (error) => {
    if (error.reason) return error.reason;
    if (error.message) return error.message;
    return "Unknown Blockchain Error";
};
