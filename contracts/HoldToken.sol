//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract HoldToken {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct HoldInfo {
        uint256 id;
        uint256 amount;
        address owner;
        address token;
        bool completed;
        uint256 period;
        uint256 createdAt;
        uint256 updatedAt;
    }
    HoldInfo[] private _holds;
    mapping(address => EnumerableSet.UintSet) private _userHoldIds;
    uint256 private _period = 86400;

    event HoldCreated(uint256 indexed id, address indexed owner, address token, uint256 amount, uint256 period);

    function createNewHoldToken(address token, uint256 amount, uint256 period) external {
        require(amount > 0, "AMOUNT_NOT_VAILD");
        require(IERC20(token).allowance(msg.sender, address(this)) >= amount, "TOKEN_ALLOWANCE_NOT_ENOUGH");
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        uint256 id = _holds.length;
        HoldInfo memory hold = HoldInfo(id, amount, msg.sender, token, false, period, block.timestamp, block.timestamp);
        _holds.push(hold);
        _userHoldIds[msg.sender].add(id);
        emit HoldCreated(id, msg.sender, token, amount, period);
    }
    function withdrawHoldToken(uint256 id) external {
        HoldInfo memory hold = _holds[id];
        require(hold.owner == msg.sender, "NOT_OWNER");
        require(block.timestamp > hold.createdAt + (hold.period * _period), "NOT_TIME_TO_WITHDRAW");
        require(!hold.completed, "ALREADY_COMPLETED");
        IERC20(hold.token).transfer(msg.sender, hold.amount);

        _holds[id].completed = true;
        _holds[id].updatedAt = block.timestamp;
        _userHoldIds[msg.sender].remove(id);
    }

    function getHoldsOfId(uint256 id) external view returns (HoldInfo memory) {
        return _holds[id];
    }
    function getHoldsOfUser(address user) public view returns (HoldInfo[] memory) {
        uint256[] memory ids = _userHoldIds[user].values();
        HoldInfo[] memory holds = new HoldInfo[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            holds[i] = _holds[ids[i]];
        }
        return holds;
    }
    function getHoldsIdsOfUser(address user) public view returns (uint256[] memory) {
        uint256[] memory ids = _userHoldIds[user].values();
        return ids;
    }
    receive() external payable {}

    fallback() external payable {}
}

