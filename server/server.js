require('dotenv').config();
const { ethers } = require('ethers');
const Safe = require('@safe-global/protocol-kit').default;
const SafeApiKit = require('@safe-global/api-kit').default;
const Hapi = require('@hapi/hapi');


const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const ownerSigner = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
const safeAddress = process.env.SAFE_ADDRESS;
const erc20Address = process.env.TAO_CONTRACT_ADDRESS;
const erc20Abi = [
    "function transfer(address to, uint amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)",
];
const erc20Contract = new ethers.Contract(erc20Address, erc20Abi, provider);


const apiKit = new SafeApiKit({
    chainId: process.env.CHAIN_ID
})

let protocolKit = null;


async function sendTAO(address, transferAmount) {
    const destination = address;
    const amount = ethers.parseUnits(transferAmount, 18);
    const transferData = erc20Contract.interface.encodeFunctionData("transfer", [destination, amount]);

    const safeTransaction = await protocolKit.createTransaction({
        transactions: [{
            to: erc20Address,
            value: "0",
            data: transferData,
            operation: 0
        }]
    })
    const safeTxHash = await protocolKit.getTransactionHash(safeTransaction)
    const signature = await protocolKit.signHash(safeTxHash)

    // Propose transaction to the service
    await apiKit.proposeTransaction({
        safeAddress: safeAddress,
        safeTransactionData: safeTransaction.data,
        safeTxHash,
        senderAddress: ownerSigner.address,
        senderSignature: signature.data
    })

    // execute the transaction 
    const executeTxResponse = await protocolKit.executeTransaction(safeTransaction)

    return executeTxResponse.hash
}

async function start() {

    protocolKit = await Safe.init({
        provider: process.env.RPC_URL,
        signer: process.env.OWNER_PRIVATE_KEY,
        safeAddress,
    })
    const server = Hapi.server({
        port: process.env.HTTP_PORT,
        host: '0.0.0.0',
        routes: {
            "cors": true
        }
    });

    server.route({
        method: 'POST',
        path: '/api/sendTAO',
        handler: async (request) => {
            let address = request.payload.address

            if (ethers.isAddress(address) == false) {
                return {
                    status: "fail",
                    message: "错误的地址",
                    data: {
                        address: address
                    }
                }
            }


            let balance = await erc20Contract.balanceOf(address)
            balance = ethers.formatUnits(balance, 18)
            // 校验这个地址是否有TAO了
            if (balance == "0.0") {
                // 可以领取
                let tx = await sendTAO(address, "10")
                return {
                    status: "success",
                    message: "sent",
                    data: {
                        address: address,
                        tx: tx,
                        amount: "10"
                    }
                }
            }

            return {
                status:"fail",
                message:"这个地址已经有TAO了,留给其他人吧",
                data:{
                    address:address,
                    amount:balance
                }
            }

        }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
}

start();