import { PublicKey } from "@solana/web3.js";
import { apiUrl, apiSecret, backendUrl } from "../constants";

const requestHeaders = new Headers({
	"Content-Type": "application/json",
	"Connection": "keep-alive",
	"Accept": "*/*",
	"Accept-encoding": "gzip, deflate, br"})

if(typeof apiSecret !== "undefined") {
	requestHeaders.append('secret', apiSecret)
}

export async function version() : Promise<Response> {
	return fetch(`${apiUrl}/version`, { method: "GET", headers: requestHeaders})
}
export async function getMeLastCollection() : Promise<Response> {
	return fetch(`${apiUrl}/collection/me/last`, { method: "GET", headers: requestHeaders})
}
export async function getMeLastLaunchpad() : Promise<Response> {
	return fetch(`${apiUrl}/collection/me/launchpad/last`, { method: "GET", headers: requestHeaders})
}
export async function getMeCollectionHistory() : Promise<Response> {
	return fetch(`${apiUrl}/collection/me/history`, { method: "GET", headers: requestHeaders})
}
export async function getMeCollectionById(id: number) : Promise<Response> {
	return fetch(`${apiUrl}/collection/me?collectionId=${id}`, { method: "GET", headers: requestHeaders})
}
export async function getMeCollectionAll(search: string) : Promise<Response> {
	return fetch(`${apiUrl}/collection/me/all?s=${search}`, { method: "GET", headers: requestHeaders})
}
export async function getMeCollectionMintInfo(mint: string) : Promise<Response> {
	return fetch(`${apiUrl}/collection/me/mintInfo?mint=${mint}`, { method: "GET", headers: requestHeaders})
}
export async function getCandyMachinesV2ForRange(rangeStart: string, dateEnd: string) : Promise<Response> {
	return fetch(`${apiUrl}/bot/candymachine/v2/range?start=${rangeStart}&end=${dateEnd}`, { method: "GET", headers: requestHeaders})
}
export async function getCandyMachinesV2ById(id: string) : Promise<Response> {
	return fetch(`${apiUrl}/bot/candymachine/v2/id?i=${id}`, { method: "GET", headers: requestHeaders})
}
export async function refreshCandyMachinesV2(id: string) : Promise<Response> {
	return fetch(`${backendUrl}/bot/candymachine/v2/refresh?id=${id}`, { method: "GET", headers: requestHeaders})
}
export async function getCandyMachinesV2Verified() : Promise<Response> {
	return fetch(`${apiUrl}/bot/candymachine/v2/verified`, { method: "GET", headers: requestHeaders})
}
export async function getMeAllLaunchpads() : Promise<Response> {
	return fetch(`${apiUrl}/collection/me/launchpad/all`, { method: "GET", headers: requestHeaders})
}
export async function postExtractMintSite(url: string) : Promise<Response> {
	return fetch(`${apiUrl}/bot/candymachine/v2/extractor`, { 
		method: "POST",
		body: JSON.stringify({'url': url}),
		headers: requestHeaders})
}
