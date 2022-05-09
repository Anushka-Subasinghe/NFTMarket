let ethSigUtil = require("@metamask/eth-sig-util");
let itemCount = 0
let voucherArray = []

for(let i = 0; i < 3; i++) {
    itemCount += 1;
    let paddedHex = (('0000000000000000000000000000000000000000000000000000000000000000' + i.toString(16)).substring("-64"));
    createVoucher(itemCount, "1", `https://ipfs.moralis.io:2053/ipfs/QmPQbSPbRD8vsbS5TA2WdgSpxvC6erFD2ZWgU7GytWU5ib/metadata/${paddedHex}.json`);    
}

console.log(voucherArray)

async function createVoucher(tokenId, minPrice, uri) {
    const voucher = [
        {
          type: "uint256",
          name: "tokenId",
          value: tokenId
        },
        {
          type: "uint256",
          name: "minPrice",
          value: minPrice
        },
        {
            type: "string",
            name: "uri",
            value: uri
        }
    ];
    const privKey = new Buffer.from(
        "df57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e",
        "hex"
    );
    const signature = ethSigUtil.signTypedData({
        privateKey: privKey,
        data: voucher,
        version: "V1"
    });
    voucherArray.push({
        tokenId: tokenId,
        minPrice: minPrice,
        uri: uri,
        signature: signature
    });
} 