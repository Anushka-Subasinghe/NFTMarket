import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'
import axios from 'axios'
const { TypedDataUtils } = require('ethers-eip712')

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

import {
    nftaddress, nftmarketaddress
} from '../config'

import Market from '../artifacts/contracts/NFTMakret.sol/NFTMarket.json'
import Web3 from 'web3'

export default function CreateItem () {
    const [fileUrl, setFileUrl] = useState(null)
    const [formInput, updateFormInput] = useState({price: '', name: '', description: ''})
    const router = useRouter()

    async function onChange(e) {
        const file = e.target.files[0]
        try {
            const added = await client.add(
                file,
                {
                    progress: (prog) => console.log(`received: ${prog}`)
                }
            )
            const url = `https://ipfs.infura.io/ipfs/${added.path}` 
            setFileUrl(url)       
        } catch (e) {
            console.log(e)
        }
    }

    async function createItem() {
        const {name, description, price} = formInput
        if (!name || !description || !price || !fileUrl) return
        const data = JSON.stringify({
            name, description, image: fileUrl
        })
        try {
            const added = await client.add(data)
            const url = `https://ipfs.infura.io/ipfs/${added.path}`          
            createSale(url, null)
        } catch (error) {
            console.log('Error uploading file ', error)
        }
    }

    async function _formatVoucher(voucher) {
        const types = {
            EIP712Domain: [
              {name: "name", type: "string"},
              {name: "version", type: "string"},
              {name: "chainId", type: "uint256"},
              {name: "verifyingContract", type: "address"},
            ],
            NFTVoucher: [
              {name: "tokenId", type: "uint256"},
              {name: "minPrice", type: "uint256"},
              {name: "uri", type: "string"},  
            ]
        }
        const domain = await _signingDomain()
        return {
          domain,
          types: types,
          primaryType: 'NFTVoucher',
          message: voucher,
        }
    }

    async function _signingDomain() {
        const chainId = 1337
        const domain = {
            name: "Web3Club",
            version: "1",
            chainId: chainId,
            verifyingContract: nftmarketaddress,
        }
        return domain
    }

    async function bulkCreateVouchers() {
        for(let i = 0; i < 3; i++) {
            let paddedHex = (('0000000000000000000000000000000000000000000000000000000000000000' + i.toString(16)).substring("-64"));
            createSale(`ipfs://QmUx46XznwkRFJZgqxgELp2BEE2F9UMtkMdx2zfnW4WhvQ/metadata/${paddedHex}.json`, 10)    
        }
    }

    async function createVoucher(tokenId, minPrice, uri) {
        const web3modal = new Web3Modal()
        const connection = await web3modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        const voucher = { tokenId, minPrice, uri }
        const typedData = await _formatVoucher(voucher)
        const digest = TypedDataUtils.encodeDigest(typedData)
        const signature = await signer.signMessage(digest)
        console.log(signature)
        // const domain = await _signingDomain()
        // const types = {
        //     NFTVoucher: [
        //         {name: "tokenId", type: "uint256"},
        //         {name: "minPrice", type: "uint256"},
        //         {name: "uri", type: "string"},  
        //     ]
        // }
       // const signature = await signer._signTypedData(domain, types, voucher)
        
        if (localStorage.getItem("vouchers") == null) {
            localStorage.setItem("vouchers", "[]")
        }

        let old_data = JSON.parse(localStorage.getItem("vouchers"))
        old_data.push({
            ...voucher,
            signature
        })
        localStorage.setItem("vouchers", JSON.stringify(old_data))
    } 

    async function createSale(url, p) {
        const itemCount = JSON.parse(localStorage.getItem("itemCount"))
        let tokenId;
        if (itemCount == null) {
            localStorage.setItem("itemCount", JSON.stringify(1))
            tokenId = 1
        } else {
            tokenId = itemCount + 1
            localStorage.setItem("itemCount", JSON.stringify(itemCount + 1))
        }
        const price = ethers.utils.parseUnits(p == null ? formInput.price.toString() : p.toString(), 'ether')
        const tx = await createVoucher(
            tokenId, price, url
        )
        router.push('/')    
    }

    return(
        <div className='flex justify-center'>
            <div className='w-1/2 flex flex-col pb-12'>
                <input
                    placeholder='Asset Name'
                    className='mt-8 border rounded p-4'
                    onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
                />
                <textarea
                    placeholder='Asset Description'
                    className='mt-2 border rounded p-4'
                    onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
                />
                <input
                    placeholder='Asset Price in Matic'
                    className='mt-2 border rounded p-4'
                    onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
                />
                <input
                    type="file"
                    name="Asset"
                    className='my-4'
                    onChange={onChange}
                />
                {
                    fileUrl && (
                       <img className='rounded mt-4' width="350" src={fileUrl} /> 
                    )
                }
                <button 
                    onClick={createItem} 
                    className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
                    Create Digital Asset
                </button>
                <button 
                    onClick={bulkCreateVouchers} 
                    className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
                    Bulk Mint
                </button>  
            </div>
        </div>
    )

}