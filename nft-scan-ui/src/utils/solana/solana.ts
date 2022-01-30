import * as anchor from '@project-serum/anchor';
import { MODULE_ANALYTIC, MODULE_AUTO_BUY, MODULE_MINT_BOT, SCALP_EMPIRE_BRONZE_EDITION_HASHES, 
    SCALP_EMPIRE_GOLD_EDITION_HASHES, SCALP_EMPIRE_SILVER_EDITION_HASHES, STORAGE_LEVEL, VIP_WALLETS } from '../../constants';

export interface AssetHoldResult {
    status: string,
    level: string
}

export const verifyHolder = async (connection: anchor.web3.Connection, pubkey: string|undefined): Promise<AssetHoldResult> => {
    if(pubkey == null || typeof pubkey === 'undefined') {
        return {
            status: 'NOK',
            level: 'none'
        }
    } else {
        if(VIP_WALLETS.includes(pubkey)) {
            return {
                status: 'OK',
                level: 'gold'
            }
        }
        try {
            interface AssetHold {
                assets: Array<string>,
                types: Array<number>
            }
            const assetsOwned: AssetHold = {
                assets: new Array<string>(),
                types: new Array<number>()
            };
            const programId = new anchor.web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
            const response = await connection.getTokenAccountsByOwner(new anchor.web3.PublicKey(pubkey), {programId: programId})
            for (const v of response.value) {
                const r = await connection.getParsedAccountInfo(v.pubkey)
                if(r != null && r.value != null) {
                    const data = r.value.data
                    if("parsed" in data) {
                        const amount = data.parsed.info.tokenAmount.uiAmount
                        const m = data.parsed.info.mint
                        if(amount === 1 && SCALP_EMPIRE_GOLD_EDITION_HASHES.includes(m)) {
                            assetsOwned.assets.push(m)
                            assetsOwned.types.push(MODULE_ANALYTIC)
                        }
                        if(amount === 1 && SCALP_EMPIRE_SILVER_EDITION_HASHES.includes(m)) {
                            assetsOwned.assets.push(m)
                            assetsOwned.types.push(MODULE_MINT_BOT)
                        }
                        if(amount === 1 && SCALP_EMPIRE_BRONZE_EDITION_HASHES.includes(m)) {
                            assetsOwned.assets.push(m)
                            assetsOwned.types.push(MODULE_AUTO_BUY)
                        }
                    }
                }
            }
            let level: string = 'none'
            let result: boolean = false
            if(assetsOwned.assets.length > 0) {
                if(assetsOwned.types.includes(MODULE_ANALYTIC)) {
                    level = 'gold'
                    result = true
                } else if(assetsOwned.types.includes(MODULE_MINT_BOT)) {
                    level = 'silver'
                    result = true
                } else if(assetsOwned.types.includes(MODULE_AUTO_BUY)) {
                    level = 'bronze'
                    result = true
                }
                return {
                    status: 'OK',
                    level: level
                }
            }
            return {
                status: 'NOK',
                level: level
            }
        } catch(err) {
            return {
                status: 'NOK',
                level: 'none'
            }
        }
    }
}