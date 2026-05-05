// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract ManagedAccess {
    address public owner;
    address[] public managers;
    mapping(address => bool) public isManager;

    mapping(address => bool) public isConfirmed;
    uint256 public confirmCount;

    constructor(address _owner, address[] memory _managers) {
        owner = _owner;
        for(uint i = 0; i < _managers.length; i++) {
            isManager[_managers[i]] = true;
            managers.push(_managers[i]);
        }
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not authorized");
        _;
    }

    modifier onlyManager() {
        require(isManager[msg.sender], "You are not authorized to manage this token");
        _;
    }

    modifier onlyAllConfirmed() {
        require(isManager[msg.sender], "You are not a manager");
        require(confirmCount == managers.length && managers.length > 0, "Not all confirmed yet");
        _;
    }

    function confirm() external {
        require(isManager[msg.sender], "You are not a manager");
        require(!isConfirmed[msg.sender], "Already confirmed");
        isConfirmed[msg.sender] = true;
        confirmCount++;
    }

    function resetConfirmations() internal {
        for(uint i = 0; i < managers.length; i++) {
            isConfirmed[managers[i]] = false;
        }
        confirmCount = 0;
    }
}