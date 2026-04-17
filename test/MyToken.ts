import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"

const MINTING_AMOUNT = 100n;
const DECIMALS = 18n;

describe("My Token", () => {
  let myTokenC: MyToken;
  let signers: HardhatEthersSigner[];
  beforeEach("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
    ]) as any; 
  });
  describe("Basic state value check", () => {

    it("should return name", async () => {
      expect(await myTokenC.name()).equal("MyToken");
    });
    it("should return symbol", async () => {
      expect(await myTokenC.symbol()).equal("MT");
    });
    it("should return decimals", async () => {
      expect(await myTokenC.decimals()).equal(18);
    });
    it("should return 0 totalSupply", async () => {
      expect(await myTokenC.totalSupply()).equal(MINTING_AMOUNT * 10n ** DECIMALS);
    });
  })

  // 1MT = 1*10^18
  describe("Mint", () => {
    it("should return 1MT balance for signer 0", async () => {
      const signer0 = signers[0];
      expect(await myTokenC.balanceOf(signer0)).equal(MINTING_AMOUNT * 10n ** DECIMALS);
    });
  });
  describe("Transfer", () => {
    it("should have 0.5MT", async () => {
    const signer0 = signers[0];
    const signer1 = signers[1];
    await expect(
      myTokenC.transfer(
      hre.ethers.parseUnits("0.5", DECIMALS), 
      signer1.address
    )
  )
    .to.emit(myTokenC, "Transfer")
    .withArgs(
      signer0.address, 
      signer1.address, 
      hre.ethers.parseUnits("0.5", DECIMALS)
    );
    expect(await myTokenC.balanceOf(signer1.address)).equal(
      hre.ethers.parseUnits("0.5", DECIMALS)
    );
  });
  it("should be reverted with insufficient balance error", async () => {
    const signer1 = signers[1];
    await expect(
      myTokenC.transfer(hre.ethers.parseUnits((MINTING_AMOUNT + 1n).toString(), DECIMALS), 
      signer1.address
    )
    ).to.be.revertedWith("insufficient balance");
  });
  });
  describe("TransferFrom", () => {
    it("should emit Approval event", async () => {
      const signer1 = signers[1];
      await expect(
        myTokenC.approve(signer1.address, hre.ethers.parseUnits("10", DECIMALS))
      )
        .to.emit(myTokenC, "Approval")
        .withArgs(signer1.address, hre.ethers.parseUnits("10", DECIMALS));
    });
    it("should allow signer1 to transfer signer0's tokens after approval", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      const transferAmount = hre.ethers.parseUnits("5", DECIMALS); 

      await myTokenC.approve(signer1.address, transferAmount);
      await expect(
        myTokenC.connect(signer1).transferFrom(
          signer0.address,
          signer1.address,
          transferAmount
        )
      )
        .to.emit(myTokenC, "Transfer")
        .withArgs(signer0.address, signer1.address, transferAmount);

      expect(await myTokenC.balanceOf(signer1.address)).to.equal(transferAmount);
    });
  });
});