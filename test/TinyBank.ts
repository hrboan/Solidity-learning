import hre from "hardhat";
import { expect } from "chai";
import { DECIMALS, MINTING_AMOUNT } from "./constant";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TinyBank", () => {
    let signers: HardhatEthersSigner[];
    let myTokenC: any;
    let tinyBankC: any;

    beforeEach(async () => {
        signers = await hre.ethers.getSigners();
        myTokenC = await hre.ethers.deployContract("MyToken", [
            "MyToken",
            "MT",
            DECIMALS,
            MINTING_AMOUNT,
        ]);

        const managers = [
            signers[0].address,
            signers[1].address,
            signers[2].address
        ];

        tinyBankC = await hre.ethers.deployContract("TinyBank", [
            await myTokenC.getAddress(),
            managers
        ]);
        await myTokenC.setManager(await tinyBankC.getAddress());
    });

    describe("Initialized state check", () => {
        it("should return totalStaked 0", async () => {
            expect(await tinyBankC.totalStaked()).equal(0)
        });
        it("should return staked 0 amount of signer0", async () => {
            const signer0 = signers[0];
            expect(await tinyBankC.staked(signer0.address)).equal(0)
        });
    });

    describe("Staking", () => {
        it("should return staked amount", async () => {
            const signer0 = signers[0];
            const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
            await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
            await tinyBankC.stake(stakingAmount);
            expect(await tinyBankC.staked(signer0.address)).equal(stakingAmount);
            expect(await tinyBankC.totalStaked()).equal(stakingAmount);
            expect(await myTokenC.balanceOf(tinyBankC)).equal(
                await tinyBankC.totalStaked()
            );
        });
    });

    describe("Withdraw", () => {
         it("should return 0 staked after withdrawing total token", async () => {
            const signer0 = signers[0];
            const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
            await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
            await tinyBankC.stake(stakingAmount);
            await tinyBankC.withdraw(stakingAmount);
            expect(await tinyBankC.staked(signer0.address)).equal(0);
        });
    });

    describe("reward", () => {
        it("should reward 1MT every blocks", async () => {
            const signer0 = signers[0];
            const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
            await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
            await tinyBankC.stake(stakingAmount);

            const BLOCKS = 5n;
            const transferAmount = hre.ethers.parseUnits("1", DECIMALS);
            for (var i = 0; i < BLOCKS; i++) {
                await myTokenC.transfer(transferAmount, signer0.address);
            }

            await tinyBankC.withdraw(stakingAmount);
            expect(await myTokenC.balanceOf(signer0.address)).equal(
                hre.ethers.parseUnits((BLOCKS + MINTING_AMOUNT + 1n).toString())
            );
        });

        it("Should revert when changing rewardPerBlock by hacker", async () => {
            const hacker = signers[3];
            const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);
            
            await expect(
                tinyBankC.connect(hacker).setRewardPerBlock(rewardToChange)
            ).to.be.revertedWith("You are not a manager");
        });

        it("Should revert when not all managers confirmed", async () => {
            const signer0 = signers[0];
            const signer1 = signers[1];
            const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);

            await tinyBankC.connect(signer0).confirm();
            await tinyBankC.connect(signer1).confirm();

            await expect(
                tinyBankC.connect(signer0).setRewardPerBlock(rewardToChange)
            ).to.be.revertedWith("Not all confirmed yet");
        });

        it("Should successfully change rewardPerBlock when all managers confirmed", async () => {
            const signer0 = signers[0];
            const signer1 = signers[1];
            const signer2 = signers[2];
            const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);

            await tinyBankC.connect(signer0).confirm();
            await tinyBankC.connect(signer1).confirm();
            await tinyBankC.connect(signer2).confirm();

            await tinyBankC.connect(signer0).setRewardPerBlock(rewardToChange);

            expect(await tinyBankC.rewardPerBlock()).equal(rewardToChange);
        });
    });
});