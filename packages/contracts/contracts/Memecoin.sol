// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Memecoin
 * @dev ERC20 token for streamer memecoins
 * Created automatically when a stream starts
 * Total supply: 1 billion tokens
 * Bonding curve supply: 800 million tokens
 */
contract Memecoin is ERC20, Ownable {
  uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10 ** 18; // 1 billion tokens
  uint256 public constant BONDING_CURVE_SUPPLY = 800_000_000 * 10 ** 18; // 800 million on curve

  address public immutable bondingCurve;
  address public immutable creator;

  /**
   * @dev Constructor
   * @param name_ Token name (e.g., "Streamer John Coin")
   * @param symbol_ Token symbol (e.g., "JOHN420")
   * @param creator_ Address of the stream creator
   * @param bondingCurve_ Address of the bonding curve contract
   */
  constructor(
    string memory name_,
    string memory symbol_,
    address creator_,
    address bondingCurve_
  ) ERC20(name_, symbol_) Ownable(msg.sender) {
    require(creator_ != address(0), "Invalid creator address");
    require(bondingCurve_ != address(0), "Invalid bonding curve address");

    creator = creator_;
    bondingCurve = bondingCurve_;

    // Mint total supply to this contract
    _mint(address(this), TOTAL_SUPPLY);

    // Transfer bonding curve supply to bonding curve contract
    _transfer(address(this), bondingCurve_, BONDING_CURVE_SUPPLY);

    // Transfer remaining tokens to creator (200 million)
    uint256 creatorSupply = TOTAL_SUPPLY - BONDING_CURVE_SUPPLY;
    _transfer(address(this), creator_, creatorSupply);
  }
}
