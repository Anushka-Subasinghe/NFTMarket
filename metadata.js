let fs = require('fs');
let axios = require('axios');

let ipfsArray = [];

for(let i = 0; i < 3; i++) {
    let paddedHex = (('0000000000000000000000000000000000000000000000000000000000000000' + i.toString(16)).substring("-64"));
    ipfsArray.push({
        path: `metadata/${paddedHex}.json`,
        content: {
            name: `My NFT #${i}`,
            description: "Awesome NFT",
            image: `ipfs://QmavkFLNpB2ZEbSFM5kKzn1arbWAch6zaGadNBDYit4UTu/images/${paddedHex}.jpg`,
            seller_fee_basis_points: 100,
            fee_recipient: "0x9b022cA52B5a90dd8A2ffCe73C7DE84757662Cbb"
        }
    })
}

axios.post(
    "https://deep-index.moralis.io/api/v2/ipfs/uploadFolder", 
    ipfsArray,
    {
        headers: {
            "X-API-KEY": '3YQ9eWyZMxVUdvYwNzLzkcBFDp7cY1RjytfzxzOuDdLS44QwdQBxcfoMVX3Vowoh',
            "Content-Type": "application/json",
            "accept": "application/json"
        }
    }
).then((res) => {
    console.log(res.data)
}).catch ((error) => {
    console.log(error)
})
