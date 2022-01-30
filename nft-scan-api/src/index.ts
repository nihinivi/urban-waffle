import exp from 'express';
const app = exp();
import fs from "fs"
import cors from "cors"
import dotenv from "dotenv"
dotenv.config()
import mysql from "mysql"
import * as anchor from '@project-serum/anchor';
import { AssetHold, getConnection, loadAssetsForWallet } from './utils/solana';
import { isRequestAuthorized } from './utils/request';
import { countResultItems, getCandyMachinesV2ById, getCandyMachinesV2ForRange, getCandyMachinesV2Verified, getMeAllLaunchpads, getMeCollectionById, getMeCollections, getMeLastCollection, getWhitelist } from './utils/db';
import { extract, ExtractResult } from './utils/extractor';
import { MODULE_ANALYTIC, MODULE_AUTO_BUY, MODULE_MINT_BOT } from './utils/constants';

const DEV = true

const version = '0.0.2'

let rawdata = fs.readFileSync('config.json');
let config = JSON.parse(rawdata.toString());
let dbConfig = {
    host     : process.env.MYSQL_URL,
    port     : process.env.MYSQL_PORT,
    user     : process.env.MYSQL_USER,
    password : process.env.MYSQL_PWD,
    database : process.env.MYSQL_DB
}


let dbConnection;
function connectDb() {
    dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect()                              
    dbConnection.on('error', function(err) {
      console.error('db error', err)
      if(err.code === 'PROTOCOL_CONNECTION_LOST') {
        connectDb()
      } else {
        throw err;
      }
    });
}
connectDb()
const solanaConnection = getConnection('genesysgo');

//let originCors = ['*']

    
app.use(exp.json());
/*const corsOptions = {
   origin:originCors, 
    optionSuccessStatus:200,
}*/
app.use(cors())
const RESPONSE_FATAL_ERROR = {
    message: "Fatal error"
}

app.get('/version', (req, res) => {
    try {
        if(isRequestAuthorized(req)) {
            res.status(200).json({
                "version": version
            })
        } else {
            res.status(401).json("Unauthorized")
            return
        }
        
    } catch(error) {
        console.error(error)
        res.status(500).json(RESPONSE_FATAL_ERROR)
    }
})

app.get('/isWhitelisted', (req, res)=>{
    try {
        if(isRequestAuthorized(req)) {
            const walletPubkey = req.query.wallet;
            if(typeof walletPubkey === 'undefined') {
                res.status(400).json('Missing wallet')
                return
            }
            getWhitelist(dbConnection, walletPubkey, (error, results, fields) => {
                if (error) {
                    res.status(500).json(RESPONSE_FATAL_ERROR)
                    return
                }
                if(countResultItems(results) === 1) {
                    res.status(200).json({
                        'status': 'OK',
                        'level': 'gold'
                    })
                    return
                } else {
                    let loadData = async () => {
                        let pubkey = new anchor.web3.PublicKey(walletPubkey)
                        const assetsOwned: AssetHold = await loadAssetsForWallet(solanaConnection, pubkey)
                        let level:string = 'none'
                        if(assetsOwned.assets.length === 0) {
                            res.status(200).json({
                                'status': 'NOK',
                                'level': level
                            })
                            return
                        } else {
                            if(assetsOwned.types.includes(MODULE_ANALYTIC)) {
                                level = 'gold'
                            } else if(assetsOwned.types.includes(MODULE_MINT_BOT)) {
                                level = 'silver'
                            } else if(assetsOwned.types.includes(MODULE_AUTO_BUY)) {
                                level = 'bronze'
                            }
                            res.status(200).json({
                                'status': 'OK',
                                'level': level
                            })
                            return
                        }
                    }
                    loadData().catch((err) => {
                        console.error(err)
                        res.status(500).json(RESPONSE_FATAL_ERROR)
                        return
                    })
                }
            })
        } else {
            res.status(401).json("Unauthorized")
            return
        }
    } catch(error) {
        console.error(error)
        res.status(500).json(RESPONSE_FATAL_ERROR)
        return
    }
})

app.get('/collection/me/launchpad/last', (req, res) => {
    try {
        if(isRequestAuthorized(req)) {
            getMeAllLaunchpads(dbConnection, (error, results, fields) => {
                if(error) {
                    console.log(error)
                }
                if(countResultItems(results) == 0) {
                    res.status(200).json({})
                    return
                } else {
                    res.status(200).json({
                        'id': results[0]['id'],
                        'name': results[0]['name'],
                        'symbol': results[0]['symbol'],
                        'createdAt': results[0]['createdAt'],
                        'launchDate': results[0]['launchDate'],
                        'candyMachineId': results[0]['candyMachineId'],
                        'candyMachineConfig': results[0]['candyMachineConfig'],
                        'candyMachineTreasury': results[0]['candyMachineTreasury']
                    })
                    return
                }
            })
        } else {
            res.status(401).json("Unauthorized")
            return
        }
    } catch(error) {
        console.error(error)
        res.status(500).json(RESPONSE_FATAL_ERROR)
    }
})

app.get('/collection/me/launchpad/all', (req, res) => {
    try {
        if(isRequestAuthorized(req)) {
            getMeAllLaunchpads(dbConnection, (error, results, fields) => {
                if(error) {
                    console.log(error)
                }
                const response = {
                    "results": []
                }
                if(countResultItems(results) == 0) {
                    res.status(200).json(response)
                } else {
                    for(let row of results) {
                        response['results'].push({
                            'id': row['id'],
                            'name': row['name'],
                            'symbol': row['symbol'],
                            'createdAt': row['createdAt'],
                            'launchDate': row['launchDate'],
                            'price': row['price'],
                            'supply': row['supply'],
                            'image': row['image'],
                            'candyMachineId': row['candyMachineId'],
                            'candyMachineConfig': row['candyMachineConfig'],
                            'candyMachineTreasury': row['candyMachineTreasury'],
                        })
                    }
                    res.status(200).json(response)
                }
            })
        } else {
            res.status(401).json("Unauthorized")
            return
        }
    } catch(error) {
        console.error(error)
        res.status(500).json(RESPONSE_FATAL_ERROR)
    }
})

app.get('/collection/me', (req, res)=>{
    try {
        if(isRequestAuthorized(req)) {
            const collectionId = req.query.collectionId;
            if(typeof collectionId === 'undefined') {
                res.status(400).json('Missing collectionId')
                return
            }
            getMeCollectionById(dbConnection, collectionId, (error, results, fields) => {
                if (error) {
                    res.status(500).json(RESPONSE_FATAL_ERROR)
                    return
                }
                if(countResultItems(results) == 1) {
                    res.status(200).json({
                        'id': results[0].id,
                        'name': results[0].name,
                        'symbol': results[0].symbol,
                        'createdAt': results[0].createdAt
                    })
                    return
                } else {
                    res.status(404).json('Collection not found')
                    return
                }
            })
        } else {
            res.status(401).json("Unauthorized")
            return
        }
    } catch(error) {
        console.error(error)
        res.status(500).json(RESPONSE_FATAL_ERROR)
    }
})

app.get('/collection/me/last', (req, res) => {
    try {
        if(isRequestAuthorized(req)) {
            getMeLastCollection(dbConnection, 1, (error, results, fields) => {
                if(error) {
                    console.log(error)
                }
                if(countResultItems(results) == 0) {
                    res.status(200).json({})
                } else {
                    res.status(200).json({
                        'id': results[0]['id'],
                        'name': results[0]['name'],
                        'symbol': results[0]['symbol'],
                        'createdAt': results[0]['createdAt']
                    })
                }
            })
        } else {
            res.status(401).json("Unauthorized")
            return
        }
    } catch(error) {
        console.error(error)
        res.status(500).json(RESPONSE_FATAL_ERROR)
    }
})

app.get('/collection/me/history', (req, res) => {
    try {
        if(isRequestAuthorized(req)) {
            getMeLastCollection(dbConnection, 10, (error, results, fields) => {
                if(error) {
                    console.log(error)
                }
                if(countResultItems(results) == 0) {
                    res.status(200).json({})
                } else {
                    const response = {
                        "collections": []
                    }
                    for(let row of results) {
                        response['collections'].push({
                            'id': row['id'],
                            'name': row['name'],
                            'symbol': row['symbol'],
                            'createdAt': row['createdAt']
                        })
                    }
                    res.status(200).json(response)
                }
            })
        } else {
            res.status(401).json("Unauthorized")
            return
        }
    } catch(error) {
        console.error(error)
        res.status(500).json(RESPONSE_FATAL_ERROR)
    }
})

app.get('/collection/me/all', (req, res) => {
    try {
        if(isRequestAuthorized(req)) {
            let search = req.query.s;
            if(typeof search === 'undefined') {
                search = ''
            }
            getMeCollections(dbConnection, search, (error, results, fields) => {
                if(error) {
                    console.log(error)
                }
                if(countResultItems(results) == 0) {
                    res.status(200).json({})
                } else {
                    const response = {
                        "collections": []
                    }
                    for(let row of results) {
                        response['collections'].push({
                            'id': row['id'],
                            'name': row['name'],
                            'symbol': row['symbol'],
                            'createdAt': row['createdAt']
                        })
                    }
                    res.status(200).json(response)
                    return
                }
            })
        } else {
            res.status(401).json("Unauthorized")
            return
        }
    } catch(error) {
        console.error(error)
        res.status(500).json(RESPONSE_FATAL_ERROR)
    }
})

app.get('/collection/me/mintInfo', (req, res)=>{
    try {
        if(isRequestAuthorized(req)) {
            const mint = req.query.mint;
            if(typeof mint === 'undefined') {
                res.status(400).json('Missing mint')
                return
            }
            let loadData = async () => {
                let pubkey = new anchor.web3.PublicKey(mint)
                let oldestTx = null
                let loop = true
                let tx = null
                while(loop) {
                    try {
                        const results = await solanaConnection.getConfirmedSignaturesForAddress2(pubkey, { before: oldestTx, limit: 1000 })
                        if(results.length > 0) {
                            oldestTx = results.at(-1)['signature']
                            if(results.length < 1000) {
                                try {
                                    tx = await solanaConnection.getParsedConfirmedTransaction(oldestTx)
                                    loop = false
                                    if(tx != null) {
                                        for(let instr of tx["meta"]['innerInstructions']) {
                                            if(instr['index'] == 4) {
                                                for(let subInstr of instr['instructions']) {
                                                    if("parsed" in subInstr && subInstr["parsed"]["type"] === 'transfer') {
                                                        res.status(200).json({
                                                            'price': subInstr["parsed"]["info"]["lamports"],
                                                            'date': tx['blockTime'] * 1000
                                                        })
                                                        return
                                                    }
                                                }
                                            }
                                        }
                                        res.status(500).json('getParsedConfirmedTransaction() error 2')
                                        return
                                    } else {
                                        res.status(500).json('getParsedConfirmedTransaction() returns no data')
                                        return
                                    }
                                } catch(err) {
                                    console.log(err)
                                    res.status(500).json('getParsedConfirmedTransaction() error')
                                    return
                                }
                            }
                        } else {
                            res.status(204).json('getConfirmedSignaturesForAddress2() returns no data')
                            return
                        }
                    } catch(err) {
                        res.status(500).json('getConfirmedSignaturesForAddress2() error')
                        return
                    }
                }
                res.status(404).json('tx not found')
                return
            }
            loadData()
        } else {
            res.status(401).json("Unauthorized")
            return
        }
    } catch(error) {
        console.error(error)
        res.status(500).json(RESPONSE_FATAL_ERROR)
    }
})

app.get('/bot/candymachine/v2/range', (req, res) => {
    try {
        if(isRequestAuthorized(req)) {
            let start = req.query.start;
            let end = req.query.end;
            if(typeof start === 'undefined') {
                res.status(400).json('Missing mint')
                return
            }
            if(typeof end === 'undefined') {
                res.status(400).json('Missing end')
                return
            }
            getCandyMachinesV2ForRange(dbConnection, start, end, (error, results, fields) => {
                if(error) {
                    console.log(error)
                }
                if(countResultItems(results) === 0) {
                    res.status(200).json({"results": []})
                    return
                } else {
                    const response = {"results": []}
                    for(let row of results) {
                        response['results'].push(row['data'])
                    }
                    res.status(200).json(response)
                    return
                }
            })
            
        } else {
            res.status(401).json("Unauthorized")
            return
        }
    } catch(error) {
        console.error(error)
        res.status(500).json(RESPONSE_FATAL_ERROR)
    }
})
app.get('/bot/candymachine/v2/id', (req, res) => {
    try {
        if(isRequestAuthorized(req)) {
            let id = req.query.i;
            if(typeof id === 'undefined') {
                res.status(400).json('Missing id')
                return
            }
            getCandyMachinesV2ById(dbConnection, id, (error, results, fields) => {
                if(error) {
                    console.log(error)
                }
                if(countResultItems(results) < 1) {
                    res.status(404).json("Candy-Machine not found")
                    return
                } else {
                    res.status(200).json(results[0]["data"])
                    return
                }
            })
            
        } else {
            res.status(401).json("Unauthorized")
            return
        }
    } catch(error) {
        console.error(error)
        res.status(500).json(RESPONSE_FATAL_ERROR)
    }
})
app.get('/bot/candymachine/v2/verified', (req, res) => {
    try {
        if(isRequestAuthorized(req)) {
            getCandyMachinesV2Verified(dbConnection, (error, results, fields) => {
                if(error) {
                    console.log(error)
                }
                const response = {"results": []}
                if(countResultItems(results) <= 0) {

console.log("No Result items");

                    res.status(200).json(response)
                    return
                } else {
                    for(let row of results) {
                        response['results'].push(row['candyMachineId'])
                    }
                    res.status(200).json(response)
                    return
                }
            })
        } else {
console.log("error");
            res.status(401).json("Unauthorized")
            return
        }
    } catch(error) {
        console.error(error)
        res.status(500).json(RESPONSE_FATAL_ERROR)
    }
})
app.post('/bot/candymachine/v2/extractor', (req, res) => {
    try {
        if(isRequestAuthorized(req)) {
            const url = req.body.url
            extract(url, dbConnection, (result: ExtractResult|null) => {
                res.status(200).json(result)
                return
            })
        } else {
            res.status(401).json("Unauthorized")
            return
        }
    } catch(error) {
        console.error(error)
        res.status(500).json(RESPONSE_FATAL_ERROR)
    }
})

process.on('exit', function () {
    dbConnection.end()
});
const port = 3000
app.listen(port, () => console.log(`Listening on port ${port}`));
