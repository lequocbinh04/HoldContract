const { expect } = require("chai");
const { ethers, network, waffle } = require("hardhat");
const provider = waffle.provider;
const createFixtureLoader = waffle.createFixtureLoader;
const BigNumber = ethers.BigNumber;

describe("HoldContract", function () {
  let HoldInstance, owner, holder, BUSD, ETH;
  it("Deploy contract", async () => {
    [owner, holder] = await ethers.getSigners();
    DemoToken = await ethers.getContractFactory("DemoToken");
    BUSD = await DemoToken.deploy(
      "BUSD",
      "BUSD",
      ethers.utils.parseEther("10000000000")
    );
    ETH = await DemoToken.deploy(
      "ETH",
      "ETH",
      ethers.utils.parseEther("10000000000")
    );
    const HoldContract = await ethers.getContractFactory("HoldToken");
    HoldInstance = await HoldContract.deploy();
  });
  it("Hold Token BUSD", async () => {
    await BUSD.transfer(holder.address, ethers.utils.parseEther("1000000"));
    await BUSD.connect(holder).approve(
      HoldInstance.address,
      ethers.utils.parseEther("1000000")
    );
    let tx = await HoldInstance.connect(holder).createNewHoldToken(
      BUSD.address,
      ethers.utils.parseEther("1000000"),
      3
    );
    //track event HoldCreated
    let receipt = await tx.wait();
    let event = receipt.events.find((e) => e.event === "HoldCreated");
    const id = event.args.id;
    expect(event.args.token).to.equal(BUSD.address);
    expect(event.args.owner).to.equal(holder.address);
    expect(event.args.amount).to.equal(ethers.utils.parseEther("1000000"));
    expect(event.args.period).to.equal(3);

    console.log(
      "======================= withdraw after 3 day ======================="
    );
    await sleep(86400 * 4);
    expect(await BUSD.connect(holder).balanceOf(holder.address)).to.equal(
      ethers.utils.parseEther("0")
    );
    tx = await HoldInstance.connect(owner).withdrawHoldToken(id);
    receipt = await tx.wait();
    expect(await BUSD.connect(holder).balanceOf(holder.address)).to.equal(
      ethers.utils.parseEther("1000000")
    );
  });
  it("Hold Token ETH", async () => {
    await ETH.transfer(holder.address, ethers.utils.parseEther("1000000"));
    await ETH.connect(holder).approve(
      HoldInstance.address,
      ethers.utils.parseEther("1000000")
    );
    let tx = await HoldInstance.connect(holder).createNewHoldToken(
      ETH.address,
      ethers.utils.parseEther("1000000"),
      3
    );
    //track event HoldCreated
    let receipt = await tx.wait();
    let event = receipt.events.find((e) => e.event === "HoldCreated");
    const id = event.args.id;
    expect(event.args.token).to.equal(ETH.address);
    expect(event.args.owner).to.equal(holder.address);
    expect(event.args.amount).to.equal(ethers.utils.parseEther("1000000"));
    expect(event.args.period).to.equal(3);

    console.log(
      "======================= withdraw after 3 day ======================="
    );
    await sleep(86400 * 4);
    expect(await ETH.connect(holder).balanceOf(holder.address)).to.equal(
      ethers.utils.parseEther("0")
    );
    tx = await HoldInstance.connect(holder).withdrawHoldToken(id);
    receipt = await tx.wait();
    expect(await ETH.connect(holder).balanceOf(holder.address)).to.equal(
      ethers.utils.parseEther("1000000")
    );
  });
});

async function sleep(seconds) {
  await network.provider.request({
    method: "evm_increaseTime",
    params: [seconds],
  }); // add 10 seconds block.timestamp;
  await network.provider.send("evm_mine", []);
}
