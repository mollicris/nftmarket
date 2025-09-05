//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "forge-std/console.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Use openzeppelin to inherit battle-tested implementations (ERC20, ERC721, etc)
// import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * A smart contract that allows changing a state variable of the contract and tracking the changes
 * It also allows the owner to withdraw the Ether in the contract
 * @author BuidlGuidl
 */
contract YourContract is ERC721, Ownable{

    uint256 private _tokenIds;
    mapping(uint256 => uint256) private tokenPrices; // Mapea el ID del token a su precio en wei

    mapping(string => address) private imageOwner;
    mapping(string => uint256) private imagePrice;

    mapping(uint256 => string) private _tokenURIs;

    constructor(address initialOwner)
        ERC721("NFTToken", "N2T")
        Ownable(initialOwner)
    {
        //owner = initialOwner;
        //console.log("YourContract deployed by:", initialOwner);
    }
    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }

    function getCurrentId() public view returns (uint256) {
        return _tokenIds;
    }
    
    function mintNFT(address recipient, string memory tokenURI, uint256 price) 
        public 
        onlyOwner 
        returns (uint256) 
    {
        _tokenIds++;
        uint256 newItemId = _tokenIds;
        
        _mint(recipient, newItemId);
        //_setTokenURI(newItemId, tokenURI);
        _tokenURIs[newItemId] = tokenURI;
        
        if (price > 0) {
            tokenPrices[newItemId] = price;
        }
        
        return newItemId;
    }

     function setImageOwner(string memory imageId, address owner) public {
        imageOwner[imageId] = owner;
    }
    function buyImage(string memory imageId) public payable {
        //imageOwner[imageId] = address(0xa0Ee7A142d267C1f36714E4a8F75612F20a79720);
        imagePrice[imageId] = 0.00000001 ether; // Set a default price for the image
        uint256 price = imagePrice[imageId];

        address seller = imageOwner[imageId];
         // Clear the owner to prevent re-entrancy
        require(msg.value >= price, "Not enough Ether sent");
        require(seller != address(0), "Image not for sale");

        // Transferir Ether al vendedor
        (bool sent, ) = seller.call{value: price}("");
        require(sent, "Failed to send Ether");

        // Transferir la propiedad de la imagen al comprador
        imageOwner[imageId] = msg.sender;

         // Si envió más Ether, se le devuelve el excedente
         if (msg.value > price) {
          (bool refund, ) = msg.sender.call{value: msg.value - price}("");
            require(refund, "Refund failed");
        }
    }




    

    /**
     * Function that allows the contract to receive ETH
     */
    receive() external payable { }
}
