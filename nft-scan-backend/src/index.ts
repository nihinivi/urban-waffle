import exp from 'express';
const app = exp();
import fs from "fs"
import cors from "cors"
import dotenv from "dotenv"
dotenv.config()
import mysql from "mysql"
import fetch from 'node-fetch'
import cron from 'node-cron'
import { addCandyMachine, updateCandyMachine, addCandyMachineToCache, addMeCollection, 
    addMeLaunchpad, countResultItems, getCandyMachine, getCandyMachineFromCache, 
    getMeCollectionBySymbol, getMeLaunchpad, updateMeLaunchpad } from './utils/db';
import { getConnection } from './utils/solana';
import { fetchCandyMachineDataV2, fetchCandyMachinesV2 } from './bot/mint/v2/candyMachineV2';
import moment from 'moment';

const DEV = true

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

let keepAliveUrl = 'https://localhost:3000/keepAlive'
let originCors = '*'
if(!DEV) {
    refreshMeDatabase()
} else {
    keepAliveUrl = 'http://localhost:3003/keepAlive'
}
//getMeNewLaunchpad()
//cron.schedule('*/59 * * * * *', function() {
    //console.log('Fetching Magic-Eden new launchpad')
    getMeNewLaunchpad()
    //console.log('Fetching Magic-Eden new listing')
    getMeRecentlyListed()
//});

refreshCandyMachinesV2()
cron.schedule('*/15 * * * *', function() {
    refreshCandyMachinesV2()
});

cron.schedule('*/59 * * * * *', function() {
    fetch(keepAliveUrl).then((response) => {
        //console.log('alive ! ' + response.status)
    }).catch((err) => {
        console.log(err)
    })
});

app.use(exp.json());
const corsOptions = {
   origin:originCors, 
   credentials:true,
   optionSuccessStatus:200,
}
app.use(cors(corsOptions))



async function refreshCandyMachinesV2() {
    try {
        console.log('Fetching Candy-Machines...')
        const candyMachineIds = await fetchCandyMachinesV2(solanaConnection)
        console.log(candyMachineIds.length + ' Candy-Machines found.')
        for (let i = 0; i < candyMachineIds.length; ++i) {
            const candyMachineId = candyMachineIds[i]
            getCandyMachineFromCache(dbConnection, candyMachineId, (error, results, fields) => {
                if(error) {
console.log("err1");
                    console.error(error.toString())
                } else {
                    if(countResultItems(results) == 0) {
                        (async () => {
                            const candyMachineMinimalData = await fetchCandyMachineDataV2(candyMachineId, solanaConnection, true)
                            if(candyMachineMinimalData == null) {
                                console.log('Cannot retrieve data for ' + candyMachineId)
                            } else {
                                if(candyMachineMinimalData.state.itemsAvailable <= 300) {
                                    addCandyMachineToCache(dbConnection, candyMachineId, (error, results, fields) => {
                                        if(error) {
                                            console.log('Error adding ' + candyMachineId + ' to cache')
                                            console.log(error)
                                        }
                                    })
                                } else {
                                    const candyMachineFullData = await fetchCandyMachineDataV2(candyMachineId, solanaConnection, false)
                                    if(candyMachineFullData != null) {
                                        const serializedData = candyMachineFullData.serialize()
                                        getCandyMachine(dbConnection, candyMachineId, (error, results, fields) => {
                                            if(error) {
                                                console.log('Error getCandyMachine ' + candyMachineId)
                                                console.log(error)
                                            } else {
                                                if(countResultItems(results) == 0) {
                                                    addCandyMachine(dbConnection, serializedData, (error, results, fields) => {
                                                        if(error) {
                                                            console.log('Error addCandyMachine ' + candyMachineId)
                                                            console.log(error)
                                                        }
                                                    })
                                                } else {
                                                    updateCandyMachine(dbConnection, results[0]["id"], serializedData, (error, results, fields) => {
                                                        if(error) {
                                                            console.log('Error updateCandyMachine ' + candyMachineId)
                                                            console.log(error)
                                                        }
                                                    })
                                                }
                                            }
                                        })
                                    }
                                }
                            }
                        })()
                    }
                }
            })
        }
    } catch (err) {
        console.log(err)
        console.log('Error fetching candy-machines')
    }
}

function refreshMeDatabase() {
    /*
    Run when API start, add missing collections to the database
    */
    console.log('Refreshing Magic-Eden collection')
    fetch(`${config.MAGICEDEN_API_URL}/all_collections`, { method: "GET"}).then((response) => {
        if(response.status === 200) {
            response.json().then((body) => {
                body["collections"].forEach((item) => {
                    getMeCollectionBySymbol(dbConnection, item['symbol'], (error, results, fields) => {
                        if(error) {
                            console.error(error.toString())
                        }
                        if(countResultItems(results) == 0) {
                            if(typeof item['symbol'] !== 'undefined' && item['symbol'] != null && item['symbol'].length > 0 && typeof item['name'] !== 'undefined' && item['name'] != null && item['name'].length > 0) {
                                addMeCollection(dbConnection, item['name'], item['symbol'], item['createdAt'], (error, results, fields) => {
                                    if(error) {
                                        console.error(error.toString())
                                    } else {
                                        console.log('New collection: ' + item['name'])
                                    }
                                })
                            }
                        }
                    })
                })
            }).catch(() => {
                console.error('Fetch body error 1')
            })
        }
    }).catch(() => {
        console.error('Fetch error')
    })
}

function getMeNewLaunchpad() {
    try {
        const headers = {
            "Cache-Control": "no-cache",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept": "*/*",
            "Connection": "keep-alive",
            'User-Agent': 'request'
        }
        fetch(`${config.MAGICEDEN_API_URL}/launchpad_collections`, { method: "GET", headers: headers }).then((response) => {
            if(response.status === 200) {
                response.json().then((body) => {
                    const newItems = []
                    body.forEach((item) => {
                        getMeLaunchpad(dbConnection, item['symbol'], (error, results, fields) => {
                            if(error) {
                                console.error(error.toString())
                            }
                            const symbol = item['symbol']
                            const name = item['name']
                            const createdAt = item['createdAt']
                            const launchDate = item['launchDate']
                            const price = item['price']
                            const supply = item['size']
                            const image = item['image']
                            let cmId = 'undefined'
                            let cmConfig = 'undefined'
                            let cmTreasury = 'undefined'
                            if('mint' in item && typeof item['mint'] !== 'undefined') {
                                cmId = item['mint']['candyMachineId']
                                cmConfig = item['mint']['config']
                                cmTreasury = item['mint']['treasury']
                            }
                            if(countResultItems(results) == 0) {
                                if(!newItems.includes(symbol)) {
                                    newItems.push(symbol)
                                    addMeLaunchpad(dbConnection, name, symbol, createdAt, launchDate, cmId, cmConfig, cmTreasury, price, supply, image, (error, results, fields) => {
                                        if(error) {
                                            console.error(error.toString())
                                        } else {
                                            console.log('New launchpad ' + symbol)
                                        }
                                    })
                                }
                            } else {
                                updateMeLaunchpad(dbConnection, symbol, name, createdAt, launchDate, cmId, cmConfig, cmTreasury, price, supply, image, (error, results, fields) => {
                                    if(error) {
                                        console.error(error.toString())
                                    }
                                })
                            }
                        })
                    })
                }).catch((err) => {
                    console.log(err)
                    console.error('Fetch body error 3')
                })
            } else {
                console.log(response.status)
            }
        }).catch(() => {
            console.error('Fetch error')
        })
    } catch(error) {
        console.error(error)
    }
}

function getMeRecentlyListed() {
    try {
        fetch(`${config.MAGICEDEN_API_URL}/rpc/getListedNFTsByQuery?q={%22$match%22:{%22collectionSymbol%22:{%22$ne%22:null}},%22$sort%22:{%22createdAt%22:-1},%22$skip%22:0,%22$limit%22:200}`, { method: "GET"}).then((response) => {
            response.json().then((body) => {
                const newItems = []
                body["results"].forEach((item) => {
                    getMeCollectionBySymbol(dbConnection, item['collectionName'], (error, results, fields) => {
                        if(error) {
                            console.error(error.toString())
                        }
                        if(countResultItems(results) == 0) {
                            const symbol = item['collectionName']
                            const name = item['collectionTitle']
                            let createdAt = item['createdAt']
                            if(typeof createdAt === 'undefined' || createdAt == null || createdAt.length === 0) {
                                createdAt = moment().utc(false).format()
                            }
                            if(!newItems.includes(symbol)) {
                                newItems.push(symbol)
                                addMeCollection(dbConnection, name, symbol, createdAt, (error, results, fields) => {
                                    if(error) {
                                        console.error(error.toString())
                                    } else {
                                        console.log('New listing ' + symbol)
                                    }
                                })     
                            }
                        }
                    })
                })
            }).catch(() => {
                console.error('Fetch body error 4')
            })
        }).catch(() => {
            console.error('Fetch error')
        })
    } catch(error) {
        console.error(error.toString())
    }
}

app.get('/keepAlive', (req, res) => {
    res.status(200).json({})
    return res
})

app.get('/bot/candymachine/v2/refresh', (req, res) => {
    try {
        const candyMachineId = req.query.id;
        if(typeof candyMachineId === 'undefined') {
            res.status(400).json('Missing id')
            return
        }
        fetchCandyMachineDataV2(candyMachineId, solanaConnection, false).then((candyMachineFullData) => {
            const serializedData = candyMachineFullData.serialize()
            getCandyMachine(dbConnection, candyMachineId, (error, results, fields) => {
                if(error) {
                    console.log('Error getCandyMachine ' + candyMachineId)
                    console.log(error)
                    res.status(500).json('Error getCandyMachine ' + candyMachineId)
                    return
                } else {
                    if(countResultItems(results) == 0) {
                        res.status(404).json('Candy-Machine not found: ' + candyMachineId)
                        return
                    } else {
                        updateCandyMachine(dbConnection, results[0]["id"], serializedData, (error, results, fields) => {
                            if(error) {
                                console.log('Error updateCandyMachine ' + candyMachineId)
                                console.log(error)
                                res.status(500).json('Error updateCandyMachine ' + candyMachineId)
                                return
                            } else {
                                res.status(200).json(serializedData)
                                return
                            }
                        })
                    }
                }
            })
        }).catch((err) => {
            console.log(err)
        })
    } catch(error) {
        console.error(error)
        res.status(500).json('Error updating Candy-Machine')
    }
})

process.on('exit', function () {
    dbConnection.end()
});
const port = 3003
app.listen(port, () => console.log(`Listening on port ${port}`));
