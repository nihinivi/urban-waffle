import moment from "moment";

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
export function getWhitelist(connection, wallet, callback) {
    const query = `SELECT wallet FROM nftscan.whitelist WHERE wallet=?;`;
    connection.query(query, [wallet], function (error, results, fields) {
        callback(error, results, fields);
    });
}
export function getMeCollectionById(connection, id, callback) {
    const query = `SELECT id, name, symbol, createdAt FROM nftscan.me_collections WHERE id=?;`;
    connection.query(query, [id], function (error, results, fields) {
        callback(error, results, fields);
    });
}
export function getMeLastCollection(connection, limit, callback) {
    const query = `SELECT id, symbol, name, createdAt FROM nftscan.me_collections ORDER BY createdAt DESC LIMIT ?;`;
    connection.query(query, [limit], function (error, results, fields) {
        callback(error, results, fields);
    });
}
export function getMeCollections(connection, search, callback) {
    const query = `SELECT id, symbol, name, createdAt FROM nftscan.me_collections WHERE name LIKE ? ORDER BY createdAt DESC;`;
    connection.query(query, ['%' + search + '%'], function (error, results, fields) {
        callback(error, results, fields);
    });
}
export function getMeLastLaunchpad(connection, callback) {
    const query = `SELECT id, symbol, name, createdAt, launchDate, candyMachineId, candyMachineConfig, candyMachineTreasury FROM nftscan.me_launchpad WHERE launchDate != 'undefined' ORDER BY launchdate DESC LIMIT 1;`;
    connection.query(query, function (error, results, fields) {
        callback(error, results, fields);
    });
}
export function getMeAllLaunchpads(connection, callback) {
    const thresholdDate = moment().utc(false).subtract(4, 'days').toISOString()
    const query = `SELECT id, symbol, name, createdAt, launchDate, price, supply, image, candyMachineId, candyMachineConfig, candyMachineTreasury FROM nftscan.me_launchpad 
    WHERE launchDate != 'undefined' AND launchDate >= ?
    ORDER BY launchdate DESC;`;
    connection.query(query, [thresholdDate], function (error, results, fields) {
        callback(error, results, fields);
    });
}
export function getCandyMachinesV2ForRange(connection, start, end, callback) {
    const query = `SELECT id, candyMachineId, collectionName, date, data, version FROM nftscan.candymachines WHERE date >= ? AND date <= ? ORDER BY date ASC;`;
    connection.query(query, [start, end], function (error, results, fields) {
        callback(error, results, fields);
    });
}
export function getCandyMachinesV2ById(connection, id, callback) {
    const query = `SELECT id, candyMachineId, collectionName, date, data, version FROM nftscan.candymachines WHERE candyMachineId = ?;`;
    connection.query(query, [id], function (error, results, fields) {
        callback(error, results, fields);
    });
}
export function getCandyMachinesV2Verified(connection, callback) {
    const query = `SELECT candyMachineId FROM nftscan.candymachines_verified WHERE active = 1;`;
    connection.query(query, function (error, results, fields) {
        callback(error, results, fields);
    });
}
export function searchCandyMachinesV2(connection, search, callback) {
    const searchClause =  '%' + search + '%'
    const dateClause =  search + '%'
    const query = `SELECT id, candyMachineId, collectionName, date, data, version FROM nftscan.candymachines WHERE candyMachineId LIKE ? OR collectionName LIKE ? OR date LIKE ? ORDER BY date DESC;`;
    connection.query(query, [searchClause, searchClause, dateClause], function (error, results, fields) {
        callback(error, results, fields);
    });
}