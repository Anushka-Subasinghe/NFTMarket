// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTMarket is ERC721URIStorage, ERC2981, EIP712, AccessControl, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _soldNFTs;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    string private constant SIGNING_DOMAIN = "Web3Club";
    string private constant SIGNATURE_VERSION = "1";
    string public contractURI;    

    constructor(address payable minter, uint96 _royaltyFeesInBips, string memory _contractURI)
        ERC721("LazyNFT", "LAZ") 
        EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {
            _setupRole(MINTER_ROLE, minter);
            setRoyaltyInfo(msg.sender, _royaltyFeesInBips);
            contractURI = _contractURI;
    }

    struct NFTVoucher {
        uint tokenId;
        uint minPrice;
        string uri;
        bytes signature;
    }

    struct NFT {
        uint itemId;
        uint tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
    }

    mapping(uint256 => NFT) private idToNFT;

    event NFTCreated (
        uint256 indexed itemId,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price
    );

    function redeem(NFTVoucher calldata voucher) public payable returns (uint256) {
        // make sure signature is valid and get the address of the signer
        address signer = _verify(voucher);

        // make sure that the signer is authorized to mint NFTs
        /* require(hasRole(MINTER_ROLE, signer), "Signature invalid or unauthorized"); */

        // make sure that the redeemer is paying enough to cover the buyer's cost
        require(msg.value >= voucher.minPrice, "Insufficient funds to redeem");

        // first assign the token to the signer, to establish provenance on-chain
        _mint(signer, voucher.tokenId);
        _setTokenURI(voucher.tokenId, voucher.uri);
        
        // transfer the token to the redeemer
        _transfer(signer, msg.sender, voucher.tokenId);

        bool sent = payable(signer).send(msg.value);
        require(sent, "Transfer Failed");
        console.log(sent);
        console.log(signer);
        console.log(payable(signer));
        _soldNFTs.increment();

        idToNFT[_soldNFTs.current()] = NFT(
            _soldNFTs.current(),
            voucher.tokenId,
            payable(signer),
            payable(msg.sender),
            voucher.minPrice
        );

        return voucher.tokenId;
    }

    function _verify(NFTVoucher calldata voucher) internal view returns (address) {
        bytes32 digest = _hash(voucher);
        return ECDSA.recover(digest, voucher.signature);
    }

    function _hash(NFTVoucher calldata voucher) internal view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(
        keccak256("NFTVoucher(uint256 tokenId,uint256 minPrice,string uri)"),
        voucher.tokenId,
        voucher.minPrice,
        keccak256(bytes(voucher.uri))
        )));
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override (AccessControl, ERC2981, ERC721) returns (bool) {
        return ERC721.supportsInterface(interfaceId) || AccessControl.supportsInterface(interfaceId);
    }

    function setRoyaltyInfo(address _receiver, uint96 _royaltyFeesInBips) public onlyOwner {
        _setDefaultRoyalty(_receiver, _royaltyFeesInBips);
    }

    function setContractURI(string calldata _contractURI) public onlyOwner {
        contractURI = _contractURI;        
    }

    function fetchMyNFTS() public view returns (NFT[] memory) {
        uint totalItemCount = _soldNFTs.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for(uint i = 0; i < totalItemCount; i++) {
            if(idToNFT[i + 1].owner == msg.sender) {
                itemCount += 1;
            }
        }

        NFT[] memory items = new NFT[](itemCount);

        for(uint i = 0; i < totalItemCount; i++) {
            if(idToNFT[i + 1].owner == msg.sender) {
                uint currentId = idToNFT[i + 1].itemId;
                NFT storage currentItem = idToNFT[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function fetchItemsCreated() public view returns (NFT[] memory) {
        uint totalItemCount = _soldNFTs.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for(uint i = 0; i < totalItemCount; i++) {
            if(idToNFT[i + 1].seller == msg.sender) {
                itemCount += 1;
            }
        }

        NFT[] memory items = new NFT[](itemCount);

        for(uint i = 0; i < totalItemCount; i++) {
            if(idToNFT[i + 1].seller == msg.sender) {
                uint currentId = idToNFT[i + 1].itemId;
                NFT storage currentItem = idToNFT[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

}