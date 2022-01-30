import fetch from 'node-fetch'
var cheerio = require('cheerio');
import * as anchor from '@project-serum/anchor'
import { getCandyMachinesV2ById } from './db';
var beautify = require('js-beautify').js
var async = require("async");

export interface ExtractResult {
    matchPks: Array<string>,
    noMatchPks: Array<string>
}

function checkExcludedPk(line: string): boolean {
    const EXCLUDED_PK = [
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
        'So11111111111111111111111111111111111111112',
        'gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs',
        'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ',
        'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
        'typeof',
    ]

    for(let pk of EXCLUDED_PK) {
        if(line.includes(pk)) {
            return false
        }
    }
    return true
}

export async function extract(url: string, dbConnection, callback) {
    try {
        const response = await fetch(url, { method: "GET"})
        const $ = cheerio.load(await response.text())
        const scripts = $('script')
        let sep = ''
        if(url.at(-1) !== '/') {
            sep = '/'
        } 
        const allPks: Array<string> = []
        for(let s of scripts) {
            const src = s.attribs['src']
            const jsResponse = await fetch(url + sep + src, { method: "GET"})
            const jsContent = await jsResponse.text()
            const jsContentBeautify = beautify(jsContent)
            const lines = jsContentBeautify.split('\n')
            lines.forEach((l: string) => {
                if(l.includes('PublicKey("') && checkExcludedPk(l)) {
                    const pkTokens = l.split('"')
                    for(let token of pkTokens) {
                        try {
                            new anchor.web3.PublicKey(token)
                            allPks.push(token)
                        } catch(err) {

                        }
                    }
                }
            });
        }
        const matchPks = []
        const noMatchPks = []
        async.forEachOf(allPks, function (pk, i, innerCallback) {
            getCandyMachinesV2ById(dbConnection, pk, (err, rows, fields) => {
                if(!err) {
                    if(rows.length === 1) {
                        matchPks.push(pk)
                        innerCallback(null);
                    } else {
                        noMatchPks.push(pk)
                        innerCallback(null);
                    }
                } else {
                    innerCallback(err);
                };
            })
        }, function(err) {
            if(err) {
                console.log(err)
                callback(null)
            } else {
                const result: ExtractResult = {
                    matchPks: matchPks,
                    noMatchPks: noMatchPks,
                }
                callback(result)
            }
        });
    } catch(err) {
        console.log(err)
        callback(null)
    }
}