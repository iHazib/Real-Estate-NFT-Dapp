//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    address public nftAddress;
    address payable public seller;
    address public inspector;
    address public lender;
    address public owner;

    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionStatus;
    mapping(uint256 => mapping(address => bool)) public approval;

    // Renting Mappings
    mapping(uint256 => bool) public isRent;
    mapping(uint256 => uint256) public rentPrice;
    mapping(uint256 => address) public tenant;

    constructor(address _nftAddress) {
        nftAddress = _nftAddress;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this");
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call this");
        _;
    }

    function setSeller(address payable _seller) public onlyOwner {
        seller = _seller;
    }

    function setInspector(address _inspector) public onlyOwner {
        inspector = _inspector;
    }

    function setLender(address _lender) public onlyOwner {
        lender = _lender;
    }

    // UPDATED: Removed _buyer argument. Listing is now open to public.
    function list(
        uint256 _nftID,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    ) public payable onlySeller {
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);

        isListed[_nftID] = true;
        isRent[_nftID] = false; // Explicitly set for sale
        purchasePrice[_nftID] = _purchasePrice;
        escrowAmount[_nftID] = _escrowAmount;
        // We reset the buyer so anyone can claim it
        buyer[_nftID] = address(0); 
    }

    function listRent(
        uint256 _nftID,
        uint256 _rentPrice,
        uint256 _escrowAmount
    ) public payable onlySeller {
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);

        isListed[_nftID] = true;
        isRent[_nftID] = true; // Set for rent
        rentPrice[_nftID] = _rentPrice;
        escrowAmount[_nftID] = _escrowAmount;
        tenant[_nftID] = address(0);
    }

    // UPDATED: Removed onlyBuyer modifier.
    // The first person to deposit becomes the buyer.
    function earnestDeposit(uint256 _nftID) public payable {
        require(isListed[_nftID] == true, "Property not listed");
        require(isRent[_nftID] == false, "Property is for rent, not sale");
        require(buyer[_nftID] == address(0), "Property already under contract");
        require(msg.value >= escrowAmount[_nftID], "Not enough ETH");

        buyer[_nftID] = msg.sender; // The caller becomes the buyer
    }

    function rentProperty(uint256 _nftID) public payable {
        require(isListed[_nftID] == true, "Property not listed");
        require(isRent[_nftID] == true, "Property is for sale, not rent");
        require(tenant[_nftID] == address(0), "Property already rented");

        uint256 totalAmount = escrowAmount[_nftID] + rentPrice[_nftID];
        require(msg.value >= totalAmount, "Not enough ETH");

        tenant[_nftID] = msg.sender;
        isListed[_nftID] = false; // Delist so no one else can rent/buy

        // Transfer the rent portion to the seller immediately
        // The deposit (escrowAmount) stays in the contract
        (bool success, ) = payable(seller).call{value: rentPrice[_nftID]}("");
        require(success, "Transfer to seller failed");
    }

    // Allow landlord to end lease and return deposit (or claim it)
    // For simplicity: We return deposit to tenant.
    function endLease(uint256 _nftID) public onlySeller {
        require(isRent[_nftID] == true, "Not a rental");
        require(tenant[_nftID] != address(0), "No tenant");

        address payable _tenant = payable(tenant[_nftID]);
        tenant[_nftID] = address(0);
        isListed[_nftID] = true; // Relist

        // Return deposit
        (bool success, ) = _tenant.call{value: escrowAmount[_nftID]}("");
        require(success, "Transfer to tenant failed");
    }

    function inspectionUpdate(uint256 _nftID, bool _passed)
        public
        onlyInspector
    {
        inspectionStatus[_nftID] = _passed;
    }

    function approveSale(uint256 _nftID) public {
        approval[_nftID][msg.sender] = true;
    }

    function finalizeSale(uint256 _nftID) public {
        require(inspectionStatus[_nftID] == true);
        require(approval[_nftID][buyer[_nftID]]);
        require(approval[_nftID][seller]);
        require(approval[_nftID][lender]);
        require(address(this).balance >= purchasePrice[_nftID]);

        isListed[_nftID] = false;

        (bool success, ) = payable(seller).call{value: address(this).balance}(
            ""
        );
        require(success);

        IERC721(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID);
    }

    function cancelSale(uint256 _nftID) public {
        if (inspectionStatus[_nftID] == false) {
            payable(buyer[_nftID]).transfer(address(this).balance);
        } else {
            payable(seller).transfer(address(this).balance);
        }
    }

    receive() external payable {}

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}