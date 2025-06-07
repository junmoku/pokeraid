import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  // 0xd186720360294F4a7C9E601f8CC3ac94134429FF
  const contractAddress = '0xE21e2054827347021453E24822130dD97A7F9351';
  const Token = await ethers.getContractAt('MyToken', contractAddress);

  const amount = ethers.utils.parseUnits('100000', 18); // 예: 1000 토큰

  const tx = await Token.mint(deployer.address, amount);
  await tx.wait();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
