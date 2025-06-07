import { Wallet } from "ethers";
import { randomBytes } from "crypto";

// 32바이트 랜덤 프라이빗 키 생성
const random = randomBytes(32);
const privateKey = "0x29eec5cc035c288408380f522542735db5e8fedaf3219f8d99b1bbd100539bb8";

// 지갑 생성
const wallet = new Wallet(privateKey);

// 결과 출력
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);