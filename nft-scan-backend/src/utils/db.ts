import { CandyMachineSerialized } from "../bot/mint/v2/candyMachineV2";

export function countResultItems(results) {
    if(results == null || typeof results === 'undefined') {
        return -1
    }
    let i = 0;
    for (let r of results) {
        i++;
    }

    return i;
}
export function addMeCollection(connection, name, symbol, createdAt, callback) {
    const query = `INSERT INTO nftscan.me_collections (name, symbol, createdAt) VALUES (?, ?, ?);`;
    connection.query(query, [name, symbol, createdAt], function (error, results, fields) {
        callback(error, results, fields);
    });
}
export function getMeCollectionBySymbol(connection, symbol, callback) {
    const query = `SELECT id, name, symbol, createdAt FROM nftscan.me_collections WHERE symbol=?;`;
    connection.query(query, [symbol], function (error, results, fields) {
        callback(error, results, fields);
    });
}
export function addMeLaunchpad(connection, name, symbol, createdAt, launchDate, cmId, cmConfig, cmTreasury, price, supply, image, callback) {
    const query = `INSERT INTO nftscan.me_launchpad (name, symbol, createdAt, launchDate, price, supply, image, candyMachineId, candyMachineConfig, candyMachineTreasury) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
    connection.query(query, [name, symbol, createdAt, launchDate, price, supply, image, cmId, cmConfig, cmTreasury], function (error, results, fields) {
        callback(error, results, fields);
    });
}
export function updateMeLaunchpad(connection, symbol, name, createdAt, launchDate, cmId, cmConfig, cmTreasury, price, supply, image, callback) {
    const query = `UPDATE nftscan.me_launchpad SET name=?, createdAt=?, launchDate=?, price=?, supply=?, image=?, candyMachineId=?, candyMachineConfig=?, candyMachineTreasury=? WHERE symbol = ?;`;
    connection.query(query, [name, createdAt, launchDate, price, supply, image, cmId, cmConfig, cmTreasury, symbol], function (error, results, fields) {
        callback(error, results, fields);
    });
}
export function getMeLaunchpad(connection, symbol, callback) {
    const query = `SELECT id, name, symbol, createdAt, launchDate FROM nftscan.me_launchpad WHERE symbol=?;`;
    connection.query(query, [symbol], function (error, results, fields) {
        callback(error, results, fields);
    });
}
export async function getCandyMachineFromCache(connection, cmId, callback) {
    const query = `SELECT id, candyMachineId FROM nftscan.candymachines_cache WHERE candymachineId=?;`;
    connection.query(query, [cmId], function (error, results, fields) {
        callback(error, results, fields);
    });
}
export async function addCandyMachineToCache(connection, cmId, callback) {
    const query = `INSERT INTO nftscan.candymachines_cache (candyMachineId) VALUES (?);`;
    connection.query(query, [cmId], function (error, results, fields) {
        callback(error, results, fields);
    });
}
export async function getCandyMachine(connection, cmId, callback) {
    const query = `SELECT id, candyMachineId, collectionName, date, data, version FROM nftscan.candymachines WHERE candymachineId=?;`;
    connection.query(query, [cmId], function (error, results, fields) {
        callback(error, results, fields);
    });
}
export async function addCandyMachine(connection, candyMachine: CandyMachineSerialized, callback) {
    const query = `INSERT INTO nftscan.candymachines (candyMachineId, collectionName, date, data, version) VALUES (?, ?, ?, ?, ?);`;
    connection.query(query, [candyMachine.id, candyMachine.data?.collectionName, candyMachine.date, JSON.stringify(candyMachine), 2], function (error, results, fields) {
        callback(error, results, fields);
    });
}
export async function updateCandyMachine(connection, id, candyMachine: CandyMachineSerialized, callback) {
    const query = `UPDATE nftscan.candymachines SET candyMachineId=?, collectionName=?, date=?, data=?, version=? WHERE id=?;`;
    connection.query(query, [candyMachine.id, candyMachine.data?.collectionName, candyMachine.date, JSON.stringify(candyMachine), 2, id], function (error, results, fields) {
        callback(error, results, fields);
    });
}