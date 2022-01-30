export type Collection = {
    id: number;
    symbol: string;
    name: string;
    createdAt: string;
};

export type CollectionData = {
    name: string;
    img: string;
    description: string;
    createdAt: string;
    website: string;
    twitter: string;
    discord: string;
    supply: number;
};

export type Launchpad = {
    id: number;
    symbol: string;
    name: string;
    createdAt: string;
    launchDate: string;
    candyMachineId: string;
    candyMachineConfig: string;
    candyMachineTreasury: string;
};

export type FloorPrice = {
    index: number,
    price: number
}

export type ListedCount = {
    index: number,
    count: number
}

export type Attribute = {
    trait_type: string,
    value: string
}

export type Activity = {
    txId: string,
    createdAt: string,
    mint: string,
    totalAmount: string,
    buyer: string,
    source: string,
    data?: ActivityData
}

export type ActivityData = {
    title: string,
    img: string,
    attributes: Array<Attribute>
}

export type ListedAttribute = {
    count: number,
    floor: number,
    attribute: Attribute
}

export type ListedNFT = {
    _id: string,
    id: string,
    img: string,
    title: string,
    mintAddress: string,
    createdAt: string,
    price: number,
    attributes: Array<Attribute>
}

export type CollectionHistoryData = {
    symbol: string;
    volume: number;
    floorPrice: number;
};

export type MintInfo = {
    price: number;
    date: number;
};

export type Creator = {
    address: string;
    verified: number;
    share: number;
};

export interface ExtraDataSerialize {
    collectionName: string,
    metadataUrl: string,
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

export interface MagicEdenCandyMachine {
    id: string;
    name: string;
    symbol: string;
    createdAt: string;
    launchDate: string;
    price: number;
    supply: number;
    image: string;
    candyMachineId: string;
    candyMachineConfig: string;
    candyMachineTreasury: string;
}