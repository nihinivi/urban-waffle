import * as anchor from '@project-serum/anchor';
import { web3 } from '@project-serum/anchor';
import { SCALP_EMPIRE_GOLD_EDITION_HASHES, SCALP_EMPIRE_SILVER_EDITION_HASHES, SCALP_EMPIRE_BRONZE_EDITION_HASHES, MODULE_MINT_BOT, MODULE_AUTO_BUY, MODULE_ANALYTIC } from './constants';

export function getConnection(env): anchor.web3.Connection {
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

export interface AssetHold {
    assets: Array<string>,
    types: Array<number>
}

export async function loadAssetsForWallet(connection: anchor.web3.Connection, pubkey: anchor.web3.PublicKey): Promise<AssetHold> {
    const result: AssetHold = {
        assets: new Array<string>(),
        types: new Array<number>()
    };
    const programId = new anchor.web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    const response = await connection.getTokenAccountsByOwner(pubkey, {programId: programId})
    for (const v of response.value) {
        const r = await connection.getParsedAccountInfo(v.pubkey)
        if("parsed" in r.value.data) {
            const m = r.value.data.parsed.info.mint
            const amount = r.value.data.parsed.info.tokenAmount.uiAmount
            if(amount === 1 && SCALP_EMPIRE_GOLD_EDITION_HASHES.includes(m)) {
                result.assets.push(m)
                result.types.push(MODULE_ANALYTIC)
            }
            if(amount === 1 && SCALP_EMPIRE_SILVER_EDITION_HASHES.includes(m)) {
                result.assets.push(m)
                result.types.push(MODULE_MINT_BOT)
            }
            if(amount === 1 && SCALP_EMPIRE_BRONZE_EDITION_HASHES.includes(m)) {
                result.assets.push(m)
                result.types.push(MODULE_AUTO_BUY)
            }
        }
    }

    return result
}