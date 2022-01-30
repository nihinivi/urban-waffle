import * as anchor from '@project-serum/anchor';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getTxAt, extractNameUrlFromData, decodeBase58Data } from '../../../utils/solana';
import { CANDY_MACHINE_V2_PROGRAM } from '../../../utils/constants';
import { datesAreOnSameDay } from '../../../utils/date';
import moment from 'moment';
import fetch from 'node-fetch'
import fs from 'fs'

export interface CandyMachineStateV2 {
  itemsAvailable: number;
  itemsRedeemed: number;
  itemsRemaining: number;
  treasury: anchor.web3.PublicKey;
  tokenMint: anchor.web3.PublicKey;
  isSoldOut: boolean;
  isActive: boolean;
  isPresale: boolean;
  goLiveDate: anchor.BN;
  price: anchor.BN;
  gatekeeper: null | {
    expireOnUse: boolean;
    gatekeeperNetwork: anchor.web3.PublicKey;
  };
  endSettings: null | [number, anchor.BN];
  whitelistMintSettings: null | {
    mode: any;
    mint: anchor.web3.PublicKey;
    presale: boolean;
    discountPrice: null | anchor.BN;
  };
  hiddenSettings: null | {
    name: string;
    uri: string;
    hash: Uint8Array;
  };
}

export interface ExtraDataSerialize {
  collectionName: string,
  metadataUrl: string
  imageUrl: string
}

export interface CandyMachineSerialized {
  id: string;
  date: string|null;
  price: number|null;
  treasury: string;
  itemsAvailable: number;
  itemsRedeemed: number;
  itemsRemaining: number;
  isPresale: boolean|null;
  tokenMint: string;
  gatekeeper: Gatekeeper|null;
  endSettings: EndSettings|null;
  whitelistMintSettings: WhitelistSettings|null;
  hiddenSettings: HiddenSettings|null;
  data: ExtraDataSerialize|null;
}

export interface EndSettings {
  endSettingType : object, // improve
  value: number
}

export interface Gatekeeper {
  gatekeeperNetwork: string,
  expireOnUse: boolean
}

export interface WhitelistSettings {
  mode: object, // improve
  mint: string,
  presale: boolean,
  discountPrice: number,
}

export interface HiddenSettings {
  name: string,
  uri: string,
  hash: string
}

export interface CandyMachineAccount {
  id: anchor.web3.PublicKey;
  program: anchor.Program;
  state: CandyMachineStateV2;
}

export const getCandyMachineStateV2 = async (
  anchorWallet: anchor.Wallet,
  candyMachineId: anchor.web3.PublicKey,
  connection: anchor.web3.Connection,
): Promise<CandyMachineAccount> => {
  const provider = new anchor.Provider(connection, anchorWallet, {
    preflightCommitment: 'recent',
  });

  let state: any
  let program: anchor.Program
  try {
    const idl = await anchor.Program.fetchIdl(CANDY_MACHINE_V2_PROGRAM, provider);
    const program = new anchor.Program(idl, CANDY_MACHINE_V2_PROGRAM, provider);
    state = await program.account.candyMachine.fetch(candyMachineId);
  } catch(err) {
      return null
  }
  const itemsAvailable = state.data.itemsAvailable.toNumber();
  const itemsRedeemed = state.itemsRedeemed.toNumber();
  const itemsRemaining = itemsAvailable - itemsRedeemed;
  const presale = state.data.whitelistMintSettings?.presale &&
    (!state.data.goLiveDate || state.data.goLiveDate.toNumber() > new Date().getTime() / 1000);

  return {
    id: candyMachineId,
    program,
    state: {
      itemsAvailable,
      itemsRedeemed,
      itemsRemaining,
      isSoldOut: itemsRemaining === 0,
      isActive:
        (presale ||
          state.data.goLiveDate?.toNumber() < new Date().getTime() / 1000) &&
        (state.endSettings
          ? state.endSettings?.endSettingType.date
            ? state.endSettings?.number.toNumber() > new Date().getTime() / 1000
            : itemsRedeemed < state.endSettings?.number.toNumber()
          : true),
      isPresale: presale,
      goLiveDate: state.data.goLiveDate,
      treasury: state.wallet,
      tokenMint: state.tokenMint,
      gatekeeper: state.data.gatekeeper,
      endSettings: state.data.endSettings,
      whitelistMintSettings: state.data.whitelistMintSettings,
      hiddenSettings: state.data.hiddenSettings,
      price: state.data.price,
    },
  };
};



export class CandyMachineResultV2 {
    id: anchor.web3.PublicKey
    program: anchor.Program
    state: CandyMachineStateV2
    data?: CandyMachineDataV2;

    constructor(
        id: anchor.web3.PublicKey,
        state: CandyMachineStateV2,
        data?: CandyMachineDataV2
    ) {
        this.id = id
        this.state = state
        this.data = data
    }

    isStartDateNullOrGreaterThan(date: Date): boolean {
        if(this.state.goLiveDate == null || typeof this.state.goLiveDate === 'undefined') {
            return true
        }
        return new Date(this.state.goLiveDate.toNumber() * 1000) > date
    }

    isStartDateDayEqualsTo(date: Date): boolean {
        if(this.state.goLiveDate == null || typeof this.state.goLiveDate === 'undefined') {
          return false
        }
        return  datesAreOnSameDay(new Date(this.state.goLiveDate.toNumber() * 1000), date)
    }

    toString(): string {
        let price = undefined
        try {
            price = this.state.price.toNumber() / LAMPORTS_PER_SOL
        } catch(err) {

        }
        let returnValue = 
        `--------------------------------------------
           Candy-Machine ID: ${this.id.toBase58()}
                  Live date: ${new Date(this.state.goLiveDate?.toNumber() * 1000).toString()}
                      Price: ${price}
                Treasury ID: ${this.state.treasury.toBase58()}
            Items available: ${this.state.itemsAvailable}
             Items redeemed: ${this.state.itemsRedeemed}
            Items remaining: ${this.state.itemsRemaining}
                 Is presale: ${this.state.isPresale}
                 Token mint: ${this.state.tokenMint?.toBase58()}
                 Gatekeeper: ${this.state.gatekeeper}
               End settings: ${this.state.endSettings}
    Whitelist Mint Settings: ${this.state.whitelistMintSettings}
            Hidden Settings: ${this.state.hiddenSettings}
        --------DATA--------
        ${this.data?.toString()} 
        `
        return returnValue
    }

    serialize(): CandyMachineSerialized {
        let price = null
        try {
            price = this.state.price.toNumber() / LAMPORTS_PER_SOL
        } catch(err) {}
        let date = null
        try {
            date = moment(this.state.goLiveDate?.toNumber() * 1000).utc(false).format()
        } catch(err) {

        } 
        let gatekeeper = null
        if(typeof this.state.gatekeeper !== 'undefined' && this.state.gatekeeper != null) {
            gatekeeper = {
                "gatekeeperNetwork": this.state.gatekeeper.gatekeeperNetwork.toBase58(),
                "expireOnUse": this.state.gatekeeper.expireOnUse
           }
        }
        let endSettings = null
        if(typeof this.state.endSettings !== 'undefined' && this.state.endSettings != null) {
            let type = null
            let value = null
            if(typeof this.state.endSettings["endSettingType"] !== 'undefined') {
                if(typeof this.state.endSettings["endSettingType"]['amount'] !== 'undefined') {
                    type = {'amount': true}
                }
                if(typeof this.state.endSettings["endSettingType"]['date'] !== 'undefined') {
                    type = {'date': true}
                }
                value = this.state.endSettings['number'].toNumber()
            }
            endSettings = {
              "endSettingType" : type,
              "value": value
            }

        }

        let whitelistMintSettings = null
        if(typeof this.state.whitelistMintSettings !== 'undefined' && this.state.whitelistMintSettings != null) {
            let mode = null
            if(typeof this.state.whitelistMintSettings.mode['burnEveryTime'] !== 'undefined') {
                mode = {
                    "burnEveryTime": true
                }
            }
            if(typeof this.state.whitelistMintSettings.mode['neverBurn'] !== 'undefined') {
                mode = {
                    "neverBurn": true
                }
            }
            let discountPrice = 0
            if(typeof this.state.whitelistMintSettings.discountPrice !== 'undefined' && this.state.whitelistMintSettings.discountPrice != null) {
              discountPrice = this.state.whitelistMintSettings.discountPrice.toNumber() / LAMPORTS_PER_SOL
            }
            whitelistMintSettings = {
                "mode": mode,
                "mint": this.state.whitelistMintSettings.mint.toBase58(),
                "presale": this.state.whitelistMintSettings.presale,
                "discountPrice": discountPrice,
            }
        }
        let hiddenSettings = null
        if(typeof this.state.hiddenSettings !== 'undefined' && this.state.hiddenSettings != null) {
            hiddenSettings = {
                "name": this.state.hiddenSettings.name,
                "uri": this.state.hiddenSettings.uri,
                "hash": this.state.hiddenSettings.hash.toString()
            }
        }
        let tokenMint = null
        if(typeof this.state.tokenMint !== 'undefined' && this.state.tokenMint != null) {
          tokenMint = this.state.tokenMint.toBase58()
        }
        let isPresale = null
        if(typeof this.state.isPresale !== 'undefined' && this.state.isPresale != null) {
            isPresale = this.state.isPresale
        }
        let data = null
        if(typeof this.data !== 'undefined' && this.data != null) {
          data = this.data?.serialize()
        }
        return {
            "id": this.id.toBase58(),
            "date": date?.toString(),
            "price": price,
            "treasury": this.state.treasury.toBase58(),
            "itemsAvailable": this.state.itemsAvailable,
            "itemsRedeemed": this.state.itemsRedeemed,
            "itemsRemaining": this.state.itemsRemaining,
            "isPresale": isPresale,
            "tokenMint": tokenMint,
            "gatekeeper": gatekeeper,
            "endSettings": endSettings,
            "whitelistMintSettings": whitelistMintSettings,
            "hiddenSettings": hiddenSettings,
            "data": data
        }
    }
}

export const fetchCandyMachineDataV2 = async (
  candyMachineId: string,
  connection: anchor.web3.Connection,
  minimal: boolean
): Promise<CandyMachineResultV2> => {
    const candyMachinePubkey = new anchor.web3.PublicKey(candyMachineId)
    const state = await getCandyMachineStateV2(
        new anchor.Wallet(new anchor.web3.Keypair()),
        candyMachinePubkey,
        connection
    );
    if(state == null) {
      return null
    }
    let data = undefined
    if(!minimal) {
        data = await getCandyMachineDataV2(candyMachinePubkey, connection);
    }
    return new CandyMachineResultV2(
        state.id,
        state.state,
        data,
    )
}

export class CandyMachineDataV2 {
    name: string;
    rawName: string;
    metaUrl: string;
    rawMetaUrl: string;
    imageUrl: string;

    constructor(
        name: string,
        rawName: string,
        metaUrl: string,
        rawMetaUrl: string,
        imageUrl: string
    ) {
        this.name = name
        this.rawName = rawName
        this.metaUrl = metaUrl
        this.rawMetaUrl = rawMetaUrl
        this.imageUrl = imageUrl
    }
    
    toString(): string {
        return `
        Collection name: ${this.name}
           Metadata URL: ${this.metaUrl}
              Image URL: ${this.imageUrl}
        `
    }

    serialize(): ExtraDataSerialize {
      return  {
        "collectionName": this.name,
        "metadataUrl": this.metaUrl,
        "imageUrl": this.imageUrl
      }
  }
}
const getCandyMachineDataV2 = async (
    candyMachineId: anchor.web3.PublicKey,
    connection: anchor.web3.Connection,
): Promise<CandyMachineDataV2> => {
    let name = ''
    let rawName = ''
    let metaUrl = ''
    let rawMetaUrl = ''
    let imageUrl = ''

    let idx = 2
    while(true) {
      if(idx === 10) {
        return null
      }
      const dataTx = await getTxAt(candyMachineId, connection, idx)
      if(dataTx == null) {
        return null
      } else {
        try {
          const base58Data = dataTx['transaction']['message']['instructions'][0]['data']
          // remove 20 first bytes to start at collection name
          const decodedData = decodeBase58Data(base58Data, 20)
          const nameUrlResult = extractNameUrlFromData(decodedData, 1)
        
          name = nameUrlResult[0]['name']
          rawName = nameUrlResult[0]['rawName']
          metaUrl = nameUrlResult[0]['url']
          rawMetaUrl = nameUrlResult[0]['rawUrl']
          imageUrl = ''
          try {
            const response = await fetch(metaUrl)
            if(response.status === 200) {
              const body = await response.json()
              imageUrl = body['image']
            }
          } catch(err) {
            console.log(err)
          }
          return new CandyMachineDataV2(
            name,
            rawName,
            metaUrl,
            rawMetaUrl,
            imageUrl
          )
        } catch(err) {
          idx++
        }
      }
    }
    

}


export async function fetchCandyMachinesV2(
  connection: anchor.web3.Connection,
): Promise<Array<string>> {
  const resultFile = './cm.json'
  const response = await fetch("https://ssc-dao.genesysgo.net/", 
      {
        method: 'post',
        body: JSON.stringify({
          "jsonrpc":"2.0", 
          "id":1, 
          "method":"getProgramAccounts", 
          "params": [CANDY_MACHINE_V2_PROGRAM.toBase58(), {"encoding": "base64"}],
        }),
        headers: { "Content-Type": "application/json" }
      })
  let stream = fs.createWriteStream(resultFile, {flags: 'w', encoding: 'utf-8'});
  try {
    for await (const chunk of response.body) {
      stream.write(chunk.toString(), (err) => {
        if(err) {
          console.log(err)
        }
      });
    }
  } catch (err) {
    console.error(err.stack);
  }
  console.log('File saved')
  const result = []
  const StreamObject = require('stream-json/streamers/StreamObject');
  await new Promise((resolve, reject) => {
    fs.createReadStream(resultFile).pipe(StreamObject.withParser())
    .on('data', (data) => {
      if(data["key"] === 'result') {
        data["value"].map((item) => {
          result.push(item["pubkey"])
        })
      }
    })
    .on('finish', resolve)
    .on('error', reject);
  })
  console.log('File read')
  return result
}