// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AdvancedNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds = 1;
    uint256 public constant MAX_SUPPLY = 100;
    uint256 public constant MINT_PRICE = 0.01 ether;
    string public baseUrl;
    bool public revealed = false;
    uint256 public revealTime;
    mapping(address => bool) public whitelist;

    event NFTMinted(address indexed owner, uint256 tokenId, string tokenURI);
    event Revealed(string baseURI);

    constructor(
        address _initialOwner,
        string memory _metadataBaseURI
    ) ERC721("AdvancedNFT", "ANFT") Ownable(_initialOwner) {
        baseUrl = string(abi.encodePacked("ipfs://", _metadataBaseURI, "/"));
        revealTime = block.timestamp + 1 days;
    }

    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "Not in whitelist");
        _;
    }

    function addToWhitelist(address user) public onlyOwner {
        whitelist[user] = true;
    }

    function removeFromWhitelist(address user) public onlyOwner {
        whitelist[user] = false;
    }

    function mintNFT(
        address recipient
    ) public payable onlyWhitelisted returns (uint256) {
        require(_tokenIds < MAX_SUPPLY, "Sold out");
        require(msg.value >= MINT_PRICE, "Insufficient funds");

        uint256 newTokenId = _tokenIds;
        _safeMint(recipient, newTokenId);
        _setTokenURI(
            newTokenId,
            string(
                abi.encodePacked(
                    baseUrl,
                    "nft_",
                    Strings.toString(newTokenId),
                    ".json"
                )
            )
        );
        unchecked {
            _tokenIds++;
        }

        emit NFTMinted(recipient, newTokenId, tokenURI(newTokenId));

        if (msg.value > MINT_PRICE) {
            payable(msg.sender).transfer(msg.value - MINT_PRICE);
        }

        return newTokenId;
    }

    function reveal(string memory _newMetadataBaseURI) public onlyOwner {
        require(!revealed, "Already revealed");
        require(block.timestamp >= revealTime, "Reveal time not reached");
        baseUrl = string(abi.encodePacked("ipfs://", _newMetadataBaseURI, "/"));
        revealed = true;
        emit Revealed(baseUrl);
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
