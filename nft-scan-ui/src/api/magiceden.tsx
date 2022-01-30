import { MEResponse } from "../models/api"
import { Activity, ActivityData, Attribute, Creator, ListedAttribute, ListedNFT } from "../models/collection"
import { getMeCollectionAll } from "./api"

const MAGICEDEN_API_URL = "https://api-mainnet.magiceden.io"


export type FloorContent = {
    price: number,
    count: number
}

export const getCollectionFloor = async (symbol: string, limit: number): Promise<MEResponse<FloorContent>> => {
	try {
        const url = `${MAGICEDEN_API_URL}/rpc/getListedNFTsByQuery?q={"$match":{"collectionSymbol":"${symbol}"},"$sort":{"takerAmount":1,"createdAt":-1},"$skip":0,"$limit":${limit}}`
        const response = await fetch(url, { method: "GET"})
        if(response.status === 200) {
            const body = await response.json()
            if(body["results"].length === 0) {
                return {
                    status: 404,
                    statusText: 'Collection not found or no item listed'
                }
            }
            let floorPrice = 999999999
            let i = 0
            for(let r of body["results"]) {
                if(i < 15) {
                    let price = r.price
                    if(price > 0 && price < floorPrice) {
                        floorPrice = price
                    }
                } else {
                    break
                }
            }
            if(floorPrice === 999999999) {
                return {
                    status: 500,
                    statusText: 'Invalid value'
                }
            } else {
                return {
                    status: 200,
                    statusText: 'OK',
                    content: {
                        price: floorPrice,
                        count: body["results"].length
                    }
                }
            }
        } else {
            return {
                status: response.status,
                statusText: 'Error fetching Magic-Eden'
            }
        }
    } catch (err) {
        return {
            status: 500,
            statusText: 'Error'
        }
    }
}

export type CollectionListedFloorItemContent = {
    mint: string
}

export const getCollectionListedFloorItem = async (symbol: string): Promise<MEResponse<CollectionListedFloorItemContent>> => {
	try {
        const url = `${MAGICEDEN_API_URL}/rpc/getListedNFTsByQuery?q={"$match":{"collectionSymbol":"${symbol}"},"$sort":{"takerAmount":1,"createdAt":-1},"$skip":0,"$limit":15}`
        const response = await fetch(url, { method: "GET"})
        if(response.status === 200) {
            const body = await response.json()
            if(body["results"].length === 0) {
                return {
                    status: 404,
                    statusText: 'Collection not found or no item found'
                }
            }
            console.log(body["results"])
            for(let r of body["results"]) {
                if(r.price > 0) {
                    return {
                        status: 200,
                        statusText: 'OK',
                        content: {
                            mint: r.mintAddress
                        }
                    }
                }
            }
            return {
                status: 404,
                statusText: 'No item found'
            }
        } else {
            return {
                status: response.status,
                statusText: 'Error fetching Magic-Eden'
            }
        }
    } catch (err) {
        return {
            status: 500,
            statusText: 'Error'
        }
    }
}

export type ActivityContent = {
    transactions: Array<Activity>
}

export const getCollectionActivity = async (symbol: string): Promise<MEResponse<ActivityContent>> => {
	try {
        const url = `${MAGICEDEN_API_URL}/rpc/getGlobalActivitiesByQuery?q={%22$match%22:{%22collection_symbol%22:%22${symbol}%22},%22$sort%22:{%22blockTime%22:-1},%22$skip%22:0,%22$limit%22:200}`
        const response = await fetch(url, { method: "GET"})
        if(response.status === 200) {
            const body = await response.json()
            if(body["results"].length === 0) {
                return {
                    status: 404,
                    statusText: 'Collection not found'
                }
            }
            const txs: ActivityContent = {
                "transactions": new Array<Activity>()
            }
            let result = new Array<Activity>()
            for(let tx of body['results']) {
                if(tx['txType'] === 'exchange') {
                    result.push({
                        'txId': tx['transaction_id'],
                        'createdAt': tx['createdAt'],
                        'mint': tx['mint'],
                        'totalAmount': tx['parsedTransaction']['total_amount'],
                        'buyer': tx['parsedTransaction']['buyer_address'],
                        'source': tx['source'],
                        'data': undefined
                    })
                }
            }
            txs['transactions'] = result
            return {
                status: 200,
                statusText: 'OK',
                content: txs
            }
        } else {
            return {
                status: response.status,
                statusText: 'Error fetching Magic-Eden'
            }
        }
    } catch (err) {
        return {
            status: 500,
            statusText: 'Error'
        }
    }
}

export type ListedAttributesContent = {
    floorPrice: number,
    listedCount: number,
    volume24hr: number,
    volumeAll: number,
    attributes: Array<ListedAttribute>,
}

export const getCollectionEscrowStats = async (symbol: string): Promise<MEResponse<ListedAttributesContent>> => {
	try {
        const url = `${MAGICEDEN_API_URL}/rpc/getCollectionEscrowStats/${symbol}`
        const response = await fetch(url, { method: "GET"})
        if(response.status === 200) {
            const body = await response.json()
            if(typeof body["results"] === 'undefined') {
                return {
                    status: 404,
                    statusText: 'Collection not found'
                }
            }
            return {
                status: 200,
                statusText: 'OK',
                content: {
                    floorPrice: body['results']['floorPrice'],
                    listedCount: body['results']['listedCount'],
                    volume24hr: body['results']['volume24hr'],
                    volumeAll: body['results']['volumeAll'],
                    attributes: body['results']['availableAttributes']
                }
            }
        } else {
            return {
                status: response.status,
                statusText: 'Error fetching Magic-Eden'
            }
        }
    } catch (err) {
        return {
            status: 500,
            statusText: 'Error'
        }
    }
}

export type AllCollectionsWithEscrowDataContent = {
    result: Array<any>
}

export const getAllCollectionsWithEscrowData = async (symbol: string|undefined): Promise<MEResponse<AllCollectionsWithEscrowDataContent>> => {
	try {
        const url = `${MAGICEDEN_API_URL}/all_collections_with_escrow_data`
        const response = await fetch(url, { method: "GET"})
        if(response.status === 200) {
            const body = await response.json()
            const res = {
                result: new Array<any>()
            }
            if(typeof symbol === 'undefined') {
                res.result.push(body['collections'])
            } else {
                let found = false
                for(let c of body['collections']) {
                    if(c.symbol === symbol) {
                        res.result.push({
                            'name': c.name,
                            'img': c.image,
                            'description': c.description,
                            'createAt': c.createAt,
                            'website': c.website,
                            'twitter': c.twitter,
                            'discord': c.discord,
                            'supply': c.totalItems
                        })
                        found = true
                        break
                    }
                }
                if(!found) {
                    return {
                        status: 404,
                        statusText: 'Collection not found'
                    }
                }
            }
            return {
                status: 200,
                statusText: 'OK',
                content: res
            }
        } else {
            return {
                status: response.status,
                statusText: 'Error fetching Magic-Eden'
            }
        }
    } catch (err) {
        return {
            status: 500,
            statusText: 'Error'
        }
    }
}

export type DataContent = {
    sellerFeeBasisPoints: number,
    creators: Array<Creator>
}

export const getCollectionData = async (symbol: string): Promise<MEResponse<DataContent>> => {
	try {
        const url = `${MAGICEDEN_API_URL}/rpc/getListedNFTsByQuery?q={"$match":{"collectionSymbol":"${symbol}"},"$sort":{"takerAmount":1,"createdAt":-1},"$skip":0,"$limit":1}`
        const response = await fetch(url, { method: "GET"})
        if(response.status === 200) {
            const body = await response.json()
            if(body["results"].length === 0) {
                return {
                    status: 404,
                    statusText: 'Collection not found or no item found'
                }
            }
            return {
                status: 200,
                statusText: 'OK',
                content: {
                    sellerFeeBasisPoints: body["results"][0].sellerFeeBasisPoints,
                    creators: body["results"][0].creators
                }
            }
        } else {
            return {
                status: response.status,
                statusText: 'Error fetching Magic-Eden'
            }
        }
    } catch (err) {
        return {
            status: 500,
            statusText: 'Error'
        }
    }
}

export type ListedNFTByAttributeContent = {
    items: Array<ListedNFT>
}

export const getCollectionListedNFTByAttribute = async (symbol: string, category: string, name: string, limit: number): Promise<MEResponse<ListedNFTByAttributeContent>> => {
	try {
        const url = `${MAGICEDEN_API_URL}/rpc/getListedNFTsByQuery?q={"$match":{"collectionSymbol":"${symbol}","$and":[{"$or":[{"attributes":{"$elemMatch":{"trait_type":"${category}","value":"${name}"}}}]}]},"$sort":{"takerAmount":1,"createdAt":-1},"$skip":0,"$limit":${limit}}`
        const response = await fetch(url, { method: "GET"})
        if(response.status === 200) {
            const body = await response.json()
            if(body["results"].length === 0) {
                return {
                    status: 404,
                    statusText: 'Collection not found or no item found'
                }
            }
            const content: ListedNFTByAttributeContent = {
                "items": new Array<ListedNFT>()
            }
            for(let i of body['results']) {
                content.items.push(i)
            }
            return {
                status: 200,
                statusText: 'OK',
                content: content
            }
        } else {
            return {
                status: response.status,
                statusText: 'Error fetching Magic-Eden'
            }
        }
    } catch (err) {
        return {
            status: 500,
            statusText: 'Error'
        }
    }
}

export type NFTByMintAddressContent = {
    result: ActivityData
}

export const getNFTByMintAddress = async (mint: string): Promise<MEResponse<NFTByMintAddressContent>> => {
	try {
        const url = `${MAGICEDEN_API_URL}/rpc/getNFTByMintAddress/${mint}`
        const response = await fetch(url, { method: "GET"})
        if(response.status === 200) {
            const body = await response.json()
            return {
                status: 200,
                statusText: 'OK',
                content: {
                    result: {
                        title: body['results']['title'],
                        img: body['results']['img'],
                        attributes: body['results']['attributes']
                    }
                }
            }
        } else {
            return {
                status: response.status,
                statusText: 'Error fetching Magic-Eden'
            }
        }
    } catch (err) {
        return {
            status: 500,
            statusText: 'Error'
        }
    }
}

export type AggregatedCollectionMetricsContent = {
    result: Array<any>
}

export const getAggregatedCollectionMetrics = async (): Promise<MEResponse<AggregatedCollectionMetricsContent>> => {
	try {
        const url = `${MAGICEDEN_API_URL}/rpc/getAggregatedCollectionMetrics`
        const meResponse = await fetch(url, { method: "GET"})
        if(meResponse.status === 200) {
            const meBody = await meResponse.json()
            const syncDataResponse = await getMeCollectionAll('')
            if(syncDataResponse.status === 200) {
                const res = {
                    result: new Array<any>()
                }
                const syncDataBody = await syncDataResponse.json()
                for(let sc of syncDataBody['collections']) {
                    for(let meC of meBody['results']) {
                        if(meC.symbol === sc.symbol) {
                            meC['createdAt'] = sc.createdAt
                            meC['id'] = sc.id
                            res.result.push(meC)
                        }
                    }
                }
                return {
                    status: 200,
                    statusText: 'OK',
                    content: res
                }
            } else {
                return {
                    status: syncDataResponse.status,
                    statusText: 'Error fetching API'
                }
            }
        } else {
            return {
                status: meResponse.status,
                statusText: 'Error fetching Magic-Eden'
            }
        }
    } catch (err) {
        return {
            status: 500,
            statusText: 'Error'
        }
    }
}