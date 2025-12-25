// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PostalService {
    
    // STRUCTURES
    // STRUCTURES
    struct User {
        string name;
        string mobile;
        string email; // NEW
        string password; // NEW (Hashed)
        string aadhar;
        string faceDescriptor;
        bool isRegistered;
        bool isController;
    }

    struct Order {
        string id; // Changed from uint256 to string for Manual ID
        string senderAadhar;
        string receiverMobile;
        string receiverEmail; // NEW
        string receiverAddress;
        string description;
        string weight;
        string status; // PENDING, IN_TRANSIT, DELIVERED
        uint256 timestamp;
        uint256 deliveryTimestamp;
    }

    // STATE VARIABLES
    mapping(string => User) public usersByAadhar;
    mapping(string => string) public emailToAadhar; // For Login
    mapping(string => Order) public ordersById; // Lookup order by ID
    string[] public orderIds; // Keep track of all IDs
    
    address public owner;

    // EVENTS
    event UserRegistered(string aadhar, string name, string email);
    event OrderCreated(string orderId, string sender, string receiver);
    event OrderStatusUpdated(string orderId, string status);
    
    // SIGNALING
    event UserVerified(string aadhar);
    event AccessGranted(string aadhar);

    constructor() {
        owner = msg.sender;
    }

    // USER MANAGEMENT
    function registerUser(string memory _name, string memory _mobile, string memory _email, string memory _password, string memory _aadhar, string memory _faceDescriptor, bool _isController) public {
        if (_isController) {
            require(msg.sender == owner, "Only owner can create controllers");
        }
        require(!usersByAadhar[_aadhar].isRegistered, "User already registered");
        require(bytes(emailToAadhar[_email]).length == 0, "Email already used");
        
        usersByAadhar[_aadhar] = User({
            name: _name,
            mobile: _mobile,
            email: _email,
            password: _password,
            aadhar: _aadhar,
            faceDescriptor: _faceDescriptor,
            isRegistered: true,
            isController: _isController
        });

        emailToAadhar[_email] = _aadhar;
        emit UserRegistered(_aadhar, _name, _email);
    }

    function updateFaceDescriptor(string memory _aadhar, string memory _faceDescriptor) public {
        require(usersByAadhar[_aadhar].isRegistered, "User not found");
        usersByAadhar[_aadhar].faceDescriptor = _faceDescriptor;
    }
    
    function verifyUser(string memory _aadhar) public {
        emit UserVerified(_aadhar);
    }

    function authorizeUser(string memory _aadhar) public {
        emit AccessGranted(_aadhar);
    }

    function getUser(string memory _aadhar) public view returns (User memory) {
        return usersByAadhar[_aadhar];
    }
    
    // AUTH
    function login(string memory _email, string memory _password) public view returns (bool success, User memory user) {
        string memory aadhar = emailToAadhar[_email];
        if (bytes(aadhar).length == 0) return (false, usersByAadhar[""]); // Not found
        
        User memory u = usersByAadhar[aadhar];
        // Simple string comparison for demo (In prod, use formatting)
        if (keccak256(bytes(u.password)) == keccak256(bytes(_password))) {
            return (true, u);
        }
        return (false, u);
    }

    // ORDER MANAGEMENT
    function createOrder(string memory _orderId, string memory _senderAadhar, string memory _receiverMobile, string memory _receiverEmail, string memory _receiverAddress, string memory _description, string memory _weight) public {
        
        ordersById[_orderId] = Order({
            id: _orderId,
            senderAadhar: _senderAadhar,
            receiverMobile: _receiverMobile,
            receiverEmail: _receiverEmail,
            receiverAddress: _receiverAddress,
            description: _description,
            weight: _weight,
            status: "IN_TRANSIT",
            timestamp: block.timestamp,
            deliveryTimestamp: 0
        });
        
        orderIds.push(_orderId);
        emit OrderCreated(_orderId, _senderAadhar, _receiverMobile);
    }

    function updateOrderStatus(string memory _orderId, string memory _status) public {
        ordersById[_orderId].status = _status;
        if (keccak256(bytes(_status)) == keccak256(bytes("DELIVERED"))) {
            ordersById[_orderId].deliveryTimestamp = block.timestamp;
        }
        emit OrderStatusUpdated(_orderId, _status);
    }

    function getOrders() public view returns (Order[] memory) {
        Order[] memory allOrders = new Order[](orderIds.length);
        for (uint i = 0; i < orderIds.length; i++) {
            allOrders[i] = ordersById[orderIds[i]];
        }
        return allOrders;
    }
}
