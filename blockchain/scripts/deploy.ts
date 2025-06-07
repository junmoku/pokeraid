import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.deploy();

  console.log(token)

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});