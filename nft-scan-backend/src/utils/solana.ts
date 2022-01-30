import * as anchor from '@project-serum/anchor';
import { web3 } from '@project-serum/anchor';
import { ParsedConfirmedTransaction } from '@solana/web3.js';

export function getConnection(env) {
    let url = getConnectionUrl(env);
    return new anchor.web3.Connection(url);
}

export function getConnectionUrl(env) {
    let url = undefined;
    if (env === 'mainnet-beta' || env === 'devnet' || env === 'testnet') {
        url = web3.clusterApiUrl(env);
    } else if (env === 'genesysgo') {
        url = 'https://ssc-dao.genesysgo.net/'
    }
    return url;
}

export const getTxAt = async (
    address: anchor.web3.PublicKey | string,
    connection: anchor.web3.Connection,
    index: number
): Promise<ParsedConfirmedTransaction> => {
    try {
        let pubkey = undefined
        if(typeof address === 'string') {
            pubkey = new anchor.web3.PublicKey(address)
        } else {
            pubkey = address
        }
        let oldestTx = null
        let loop = true
        let tx = null
        while(loop) {
            const res = await connection.getConfirmedSignaturesForAddress2(pubkey, { before: oldestTx, limit: 1000 })
            const oldestTxObject = res.at(-index)
            if(typeof oldestTxObject === 'undefined') {
                return null
            } else {
                oldestTx = oldestTxObject['signature']
                if(res.length < 1000) {
                tx = await connection.getParsedConfirmedTransaction(oldestTx)
                loop = false
                }
            }
        }

        return tx
    } catch(err) {

    }
}

export function decodeBase58Data(base58Data: string, slice: number = undefined): string {
    let decodedData = anchor.utils.bytes.bs58.decode(base58Data)
    if(slice !== undefined) {
        decodedData = decodedData.slice(slice) 
    }
    return decodedData.toString()
}

export interface NameUrlData {
    name: string,
    rawName: string,
    url: string
    rawUrl: string
}

export function extractNameUrlFromData(decodedData: string, limit: number): Array<NameUrlData> {
    const result: Array<NameUrlData> = []
    const tokens = decodedData.split('\x00\x00\x00')
    for(let i = 0; i < tokens.length - 1; i++) {
        let potentialName = tokens[i]
        let potentialUrl = tokens[i + 1]
        if(potentialUrl.includes('https://')) {
            let sanitizedUrl = sanitizeUrl(potentialUrl)
            if(i == tokens.length - 2) {
                sanitizedUrl = potentialUrl
            }
            result.push({
                name: sanitizeName(potentialName),
                rawName: potentialName,
                url: sanitizedUrl,
                rawUrl: potentialUrl
            })
        }
        if(result.length == limit) {
            break
        }
    }

    return result
}


function sanitizeName(name: string): string {
    return name.slice(0, -1)
}

function sanitizeUrl(url: string): string {
    /* const chars = [...url]
    chars.forEach((c, i) => {
        console.log(c, i)
    }); */
    return url.slice(0, -1)
}