// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MyToken {
    string public name;
    string public symbol;
    uint8 public decimals; // uint8 --> 8 bit unsigned int, uint16, ... , uint256

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    constructor(string memory _name, string memory _symbol, uint8 _decimal) {
        name = _name;
        symbol = _symbol;
        decimals = _decimal;
        // transaction
        // from, to, data, value, gas, ...
        _mint(1*10**18, msg.sender); // 1 MT
    }

    function _mint(uint256 amount, address owner) internal {
        // totalSupply = totalSupply + amount;
        // balanceOf[owner] = balanceOf[owner] + amount;
        totalSupply += amount;
        balanceOf[owner] += amount;
    }

    // function totalSupply() external view returns (uint256) {
    //     return totalSupply;
    // }

    // function balanceOf(address owner) external view returns (uint256) {
    //     return balanceOf[owner];
    // }

    // function name() external view returns (string memory) {
    //     return name;
    // }
}