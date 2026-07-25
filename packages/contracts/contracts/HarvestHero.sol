// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract HarvestHero is ERC721, ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    struct HarvestRecord {
        uint256 id;
        address farmer;
        string cropType;
        uint256 quantity;
        string qualityGrade;
        uint256 harvestDate;
        bool verified;
        bool rewardMinted;
        uint256 createdAt;
    }

    mapping(uint256 => HarvestRecord) public harvests;
    mapping(address => uint256[]) public farmerHarvests;
    mapping(address => uint256) public totalPoints;

    uint256 private _nextTokenId;
    uint256 public harvestCount;

    event HarvestRecorded(
        uint256 indexed tokenId,
        address indexed farmer,
        string cropType,
        uint256 quantity
    );

    event HarvestVerified(
        uint256 indexed tokenId,
        address indexed verifier,
        bool approved
    );

    event RewardMinted(
        uint256 indexed tokenId,
        address indexed farmer,
        uint256 points
    );

    constructor() ERC721("HarvestHero", "HARVEST") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function recordHarvest(
        address farmer,
        string calldata cropType,
        uint256 quantity,
        string calldata qualityGrade,
        uint256 harvestDate
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        harvestCount++;
        uint256 tokenId = harvestCount;

        harvests[tokenId] = HarvestRecord({
            id: tokenId,
            farmer: farmer,
            cropType: cropType,
            quantity: quantity,
            qualityGrade: qualityGrade,
            harvestDate: harvestDate,
            verified: false,
            rewardMinted: false,
            createdAt: block.timestamp
        });

        farmerHarvests[farmer].push(tokenId);
        emit HarvestRecorded(tokenId, farmer, cropType, quantity);

        return tokenId;
    }

    function verifyHarvest(
        uint256 tokenId,
        bool approved
    ) external onlyRole(VERIFIER_ROLE) {
        HarvestRecord storage record = harvests[tokenId];
        require(record.id != 0, "Harvest not found");
        require(!record.verified, "Already verified");

        record.verified = approved;
        emit HarvestVerified(tokenId, msg.sender, approved);
    }

    function mintReward(
        address farmer,
        uint256 points
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        totalPoints[farmer] += points;

        _safeMint(farmer, tokenId);
        _setTokenURI(tokenId, _generateURI(farmer, points));

        emit RewardMinted(tokenId, farmer, points);
        return tokenId;
    }

    function getFarmerStats(
        address farmer
    ) external view returns (
        uint256 totalHarvests,
        uint256 verifiedHarvests,
        uint256 pts,
        uint256 nftsOwned
    ) {
        uint256[] storage hIds = farmerHarvests[farmer];
        totalHarvests = hIds.length;
        pts = totalPoints[farmer];
        nftsOwned = balanceOf(farmer);

        for (uint256 i = 0; i < hIds.length; i++) {
            if (harvests[hIds[i]].verified) {
                verifiedHarvests++;
            }
        }
    }

    function _generateURI(
        address farmer,
        uint256 pts
    ) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '{"name":"Harvest Reward","farmer":"',
                _addressToString(farmer),
                '","points":',
                _uint256ToString(pts),
                "}"
            )
        );
    }

    function _addressToString(address addr) internal pure returns (string memory) {
        bytes20 value = bytes20(addr);
        bytes memory hexChars = "0123456789abcdef";
        bytes memory result = new bytes(42);
        result[0] = "0";
        result[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            result[2 + i * 2] = hexChars[uint8(value[i] >> 4)];
            result[3 + i * 2] = hexChars[uint8(value[i] & 0x0f)];
        }
        return string(result);
    }

    function _uint256ToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}
