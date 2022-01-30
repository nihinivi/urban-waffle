import { Text, VStack, Box, Flex, HStack, Image, Link, Divider, IconButton, Button,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure,
    Wrap, WrapItem, CircularProgress, Center } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import SectionHeader from "../../../../sectionheader";
import {
    useLocation
  } from "react-router-dom";
import { Activity, ActivityData, Attribute, Collection, CollectionData, FloorPrice, ListedAttribute, ListedCount, ListedNFT, MintInfo } from "../../../../../models/collection";
import { getMeCollectionById, getMeCollectionMintInfo } from "../../../../../api/api";
import { XAxis, YAxis, Tooltip, AreaChart, Area, ResponsiveContainer } from 'recharts';
import { round, shortenAddress } from "../../../../../utils/utils";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { deltaMinutes, formatUTCTimestamp } from "../../../../../utils/date";
import { getMagicEdenLogo, getSearchIcon } from "../../../../icon";
import { CONTENT_SECTION_HEADER, CONTENT_SECTION_HEADER_BORDER, TIME_FORMAT } from "../../../../../themes/constants";
import CollectionHeader from "../../../../collectionheader";
import { getCollectionActivity, getCollectionFloor, getCollectionListedNFTByAttribute, getCollectionEscrowStats, getNFTByMintAddress, 
         getAllCollectionsWithEscrowData, getCollectionListedFloorItem, getCollectionData, DataContent } from "../../../../../api/magiceden";
import { MAGIC_EDEN_FEES, MAGIC_EDEN_REFRESH_RATE } from "../../../../../constants";

export default function MeCollectionMainView () {
    const collectionId = getCollectionId(useLocation())

    const [magicEdenCollection, setMagicEdenCollection] = useState<Collection>()
    const [floorPrices, setFloorPrices] = useState<Array<FloorPrice>>([])
    const [listedCount, setListedCount] = useState<Array<ListedCount>>([])
    const [activities, setActivities] = useState<Array<Activity>>([])
    const [bigActivities, setBigActivities] = useState<Array<Activity>>([])
    const [listedAttributesMap, setListedAttributesMap] = useState<Map<string, Map<string, ListedAttribute>>>()
    const [listedAttributesArray, setListedAttributesArray] = useState<Array<ListedAttribute>>(new Array<ListedAttribute>())
    const [bigActivitiesThreshold, setBigActivitiesThreshold] = useState<number>(0)
    const [collectionUrl, setCollectionUrl] = useState<String>('')
    const [volumeTotal, setVolumeTotal] = useState<number>(0)
    const [volume24hr, setVolume24hr] = useState<number>(0)
    const [salesMinute, setSalesMinute] = useState<number>(0)
    const [txData, setTxData] = useState<ActivityData>()
    const [bigTxData, setBigTxData] = useState<Activity>()
    const [collectionEscrowData, setCollectionEscrowData] = useState<CollectionData>()
    const [collectionData, setCollectionData] = useState<DataContent>()
    const [mintInfo, setMintInfo] = useState<MintInfo|null>(null)
    const [mintInfoTry, setMintInfoTry] = useState<number>(0)
    const [highlightedBuyers, setHighlightedBuyers] = useState<Array<string>>([])
    const [listedAttrData, setListedAttrData] = useState<Array<ListedNFT>>()
    const [listedAttrDataFilter, setListedAttrDataFilter] = useState<ListedAttribute>()
    const [listedAttrModalSize, setListedAttrModalSize] = useState<string>('md')

    const { isOpen: isTxOpen, onOpen: onTxOpen, onClose: onTxClose } = useDisclosure()
    const { isOpen: isListedAttrOpen, onOpen: onListedAttrOpen, onClose: onListedAttrClose } = useDisclosure()
    const { isOpen: isBigTxOpen, onOpen: onBigTxOpen, onClose: onBigTxClose } = useDisclosure()

    const GREEN_COLOR = '#70db70'

    const fetchMeCollectionById = (collectionId: number) => {
        getMeCollectionById(collectionId).then((response) => {
            if(response.status == 200) {
                response.json().then((body) => {
                    setMagicEdenCollection(body)
                    setCollectionUrl('https://magiceden.io/marketplace/' + body.symbol)
                    document.title = 'Scalp-Empire: ' + body.name
                }).catch(() => {

                })
            } else {

            }
        }).catch((msg) => {
            console.error(msg)
        })
    }

    const fetchMeCollectionMintInfo = (mint: string) => {
        getMeCollectionMintInfo(mint).then((response) => {
            if(response.status == 200) {
                response.json().then((body) => {
                    setMintInfo(body)
                }).catch(() => {
                    setMintInfoTry(1)
                })
            } else {
                setMintInfoTry(1)
            }
        }).catch((msg) => {
            setMintInfoTry(1)
        })
    }

    const fetchMeCollectionFloor = (symbol) => {
        getCollectionFloor(symbol, 15).then((response) => {
            if(response.status == 200 && typeof response.content !== 'undefined') {
                let newFloorPrice = floorPrices
                const size = newFloorPrice.length
                newFloorPrice.push({
                    index: -1,
                    price: response.content.price
                })
                if(size >= 300) {
                    newFloorPrice.shift()
                }
                let i = 0
                for(let f of newFloorPrice) {
                    f.index = i
                    i++
                }
                setFloorPrices([...newFloorPrice])
                setBigActivitiesThreshold(round(newFloorPrice[newFloorPrice.length-1].price * 1.30))
            } else {
                console.log(response)
            }
        })
    }

    const fetchMeCollectionEscrowData = (symbol) => {
        if(typeof symbol !== 'undefined') {
            getAllCollectionsWithEscrowData(symbol).then((response) => {
                if(response.status == 200 && typeof response.content !== 'undefined') {
                    setCollectionEscrowData(response.content.result[0])
                }
            })
        }
    }

    const fetchMeCollectionData = (symbol) => {
        if(typeof symbol !== 'undefined') {
            getCollectionData(symbol).then((response) => {
                if(response.status == 200 && typeof response.content !== 'undefined') {
                    setCollectionData(response.content)
                }
            })
        }
    }

    const activityDeltaMinutes = (arr: Array<Activity>): number => {
        if(arr.length == 0) {
            return 0
        }
        const lastTx = arr[0]
        const firstTx = arr.at(-1)
        if(typeof firstTx === 'undefined') {
            return 1
        }
        let delta = deltaMinutes(Date.parse(lastTx.createdAt), Date.parse(firstTx.createdAt))
        if(delta === 0) {
            delta = 1
        }
        return delta
    }

    const fetchMeCollectionActivity = (symbol) => {
        getCollectionActivity(symbol).then((response) => {
            if(response.status == 200 && typeof response.content !== 'undefined') {
                const size = 20
                let newActivities = response.content.transactions.slice(0, size)
                setActivities([...newActivities])
                let deltaMinutes: number = activityDeltaMinutes(newActivities)
                let totalActivities: number = newActivities.length
                if(deltaMinutes > 0) {
                    setSalesMinute(round((totalActivities / deltaMinutes)))
                }
                const buyerMap = new Map<string, number>()
                const highlightedBuyers = new Array<string>()
                for(let a of newActivities) {
                    const buyer = a.buyer
                    let count = buyerMap.get(buyer)
                    if(typeof count === 'undefined') {
                        buyerMap.set(buyer, 1)
                    } else {
                        const newCount = count + 1
                        buyerMap.set(buyer, newCount)
                        if(!highlightedBuyers.includes(buyer) && newCount > 2) {
                            highlightedBuyers.push(buyer)
                        }
                    }
                }
                setHighlightedBuyers(highlightedBuyers)
            } else {
                console.log(response)
            }
        })
    }

    const isActivityAlreadyIn = (txId: string, arr: Array<Activity>): boolean => {
        for(let a of arr) {
            if(a.txId === txId) {
                return true
            }
        }
        return false
    }
    
    const refreshBigActivities = () => {
        const size = 10
        let newBigActivities = bigActivities
        if(bigActivitiesThreshold > 0) {
            for(let a of activities) {
                const itemPrice = round(parseInt(a.totalAmount) / LAMPORTS_PER_SOL)
                if(itemPrice >= bigActivitiesThreshold && !isActivityAlreadyIn(a.txId, newBigActivities)) {
                    if(a.data == null) {
                        newBigActivities.push(a)
                        getNFTByMintAddress(a.mint).then((response) => {
                            if(response.status == 200 && typeof response.content !== 'undefined') {
                                a.data = response.content.result
                            }
                        })
                    } else {
                        newBigActivities.push(a)
                    }
                }
            }
            newBigActivities.sort((a: Activity, b: Activity): number => {
                if (a.createdAt > b.createdAt){
                    return -1;
                }
                if (a.createdAt < b.createdAt){
                    return 1;
                }
                return 0;
            })
            newBigActivities = newBigActivities.slice(0, size)
            setBigActivities(newBigActivities)
        }
    }

    const fetchMeCollectionLEscrowStats = (symbol) => {
        getCollectionEscrowStats(symbol).then((response) => {
            if(response.status == 200 && typeof response.content !== 'undefined') {
                setVolumeTotal(round(response.content.volumeAll / LAMPORTS_PER_SOL))
                setVolume24hr(round(response.content.volume24hr / LAMPORTS_PER_SOL))
                const newListedAttributesMap = new Map<string, Map<string, ListedAttribute>>()
                let filteredListedAttributesArray = new Array<ListedAttribute>()
                if(response.content.attributes != null) {
                    for(let item of response.content.attributes) {
                        const floor = round(item.floor / LAMPORTS_PER_SOL)
                        const count = item.count
                        const category = item.attribute.trait_type
                        const value = item.attribute.value
                        const newItem: ListedAttribute = {
                            count: count,
                            floor: floor,
                            attribute: item.attribute
                        }
                        if(!newListedAttributesMap.has(category)) {
                            newListedAttributesMap.set(category, new Map<string, ListedAttribute>())
                        }
                        if(!newListedAttributesMap.get(category)?.has(value)) {
                            newListedAttributesMap.get(category)?.set(value, newItem)
                        }
                        if(bigActivitiesThreshold > 0 && (floor >= bigActivitiesThreshold || count < 10)) {
                            filteredListedAttributesArray.push({
                                count: count,
                                floor: floor,
                                attribute: {
                                    trait_type: category,
                                    value: item.attribute.value
                                }
                            })
                        }
                    }
                    setListedAttributesMap(newListedAttributesMap)
                    filteredListedAttributesArray.sort((a: ListedAttribute, b: ListedAttribute): number => {
                        return a.count <= b.count ? -1 : 1 || (b.floor - a.floor)
                    })
                    filteredListedAttributesArray = filteredListedAttributesArray.slice(0, 100)
                    setListedAttributesArray(filteredListedAttributesArray)
                }
                let newlistedCount = listedCount
                const size = newlistedCount.length
                newlistedCount.push({
                    index: -1,
                    count: response.content.listedCount
                })
                if(size >= 300) {
                    newlistedCount.shift()
                }
                let i = 0
                for(let f of newlistedCount) {
                    f.index = i
                    i++
                }
                console.log(newlistedCount)
                setListedCount([...newlistedCount])
            }
        }).catch((msg) => {
            console.error(msg)
        })
    }

    useEffect(() => {
        fetchMeCollectionById(collectionId)
    }, [collectionId]);

    useEffect(() => {
        fetchMeCollectionData(magicEdenCollection?.symbol)
        fetchMeCollectionEscrowData(magicEdenCollection?.symbol)
        const intervalFloor = setInterval(() => {
            //console.log('INTERVAL FLOOR:' + magicEdenCollection?.name)
            fetchMeCollectionFloor(magicEdenCollection?.symbol)
        }, MAGIC_EDEN_REFRESH_RATE * 1000)
        return () => {
            clearInterval(intervalFloor)
        };
    }, [magicEdenCollection]);

    useEffect(() => {
        const intervalActivity = setInterval(() => {
            //console.log('INTERVAL ACTIVITY:' + magicEdenCollection?.name)
            fetchMeCollectionActivity(magicEdenCollection?.symbol)
        }, MAGIC_EDEN_REFRESH_RATE * 1000)
        return () => {
            clearInterval(intervalActivity)
        };
    }, [magicEdenCollection, bigActivitiesThreshold, floorPrices]);

    useEffect(() => {
        const intervalListedAttributes = setInterval(() => {
            //console.log('INTERVAL LISTED ATTRIBUTES:' + magicEdenCollection?.name)
            fetchMeCollectionLEscrowStats(magicEdenCollection?.symbol)
        }, MAGIC_EDEN_REFRESH_RATE * 1000)
        return () => {
            clearInterval(intervalListedAttributes)
        };
    }, [magicEdenCollection, bigActivitiesThreshold]);

    useEffect(() => {
        if(mintInfo == null && mintInfoTry === 0) {
            if(activities.length > 0 && typeof activities[0].mint !== 'undefined') {
                fetchMeCollectionMintInfo(activities[0].mint)
            }
        }
        refreshBigActivities()
    }, [activities, mintInfo, mintInfoTry]);

    let liveFloorChartPrice = '-'
    if(floorPrices.length > 0) {
        const last = floorPrices[floorPrices.length-1]
        liveFloorChartPrice = round(last.price)?.toString()
    }
    let liveFloorChartTitle = `LIVE FLOOR CHART: ${liveFloorChartPrice} SOL`

    let liveCount = '-'
    if(listedCount.length > 0) {
        const last = listedCount[listedCount.length-1]
        liveCount = last?.count?.toString()
        if(typeof liveCount === 'undefined') {
            liveCount = '-'
        }
    }
    let liveListedChartTitle = `LIVE LISTED COUNT CHART: ${liveCount}`

    let bigActivitiesTitlePrice = '-'
    if(bigActivitiesThreshold > 0) {
        bigActivitiesTitlePrice = bigActivitiesThreshold?.toString()
    }
    let bigActivitiesTitle = `LAST SALES >= ${bigActivitiesTitlePrice} SOL`
    let attributesTitle = `ATTRIBUTES WITH FLOOR >= ${bigActivitiesTitlePrice} SOL OR LISTED < 10`
    let slaesMinuteString = salesMinute < 20 ? salesMinute?.toString() : salesMinute + '+'
    let liveActivityFeedSubTitle = `avg sales/min: ${slaesMinuteString}`

    
    let mintPrice: string
    let mintDate: string
    if(typeof mintInfo === 'undefined' || mintInfo == null) {
        mintPrice = '-'
        mintDate = '-'
    } else {
        mintPrice = round(mintInfo.price / LAMPORTS_PER_SOL)?.toString()
        mintDate = '~' + formatUTCTimestamp(mintInfo.date, true)
    }

    let feesTitle = '-'
    let verifiedCreator = '-'
    if(typeof collectionData !== 'undefined') {
        const totalFees = ((collectionData.sellerFeeBasisPoints + MAGIC_EDEN_FEES) / 10000) * 100
        feesTitle = round(totalFees)?.toString() + '%'
        if(typeof collectionData.creators !== 'undefined') {
            for(let c of collectionData.creators) {
                if(c.share === 0 && c.verified === 1) {
                    verifiedCreator = c.address
                    break
                }
            }
        }
    }
    
    const onBigTxDetailClose = () => {
        setBigTxData(undefined)
        onBigTxClose()
    }

    const onTxDetailClose = () => {
        setTxData(undefined)
        onTxClose()
    }

    const onTxDetailClick = (mint: string) => {
        onTxOpen()
        getNFTByMintAddress(mint).then((response) => {
            if(response.status == 200 && typeof response.content !== 'undefined') {
                setTxData(response.content.result)
            }
        })
    }

    const onBigActivityDetailClick = (activity: Activity) => {
        setBigTxData(activity)
        onBigTxOpen()
    }

    const onListedAttrModalClose = () => {
        setListedAttrData(undefined)
        setListedAttrDataFilter(undefined)
        setListedAttrModalSize('md')
        onListedAttrClose()
    }

    const onListedAttributeClick = (attribute: ListedAttribute) => {
        if(typeof magicEdenCollection !== 'undefined') {
            const symbol = magicEdenCollection.symbol
            onListedAttrOpen()
            getCollectionListedNFTByAttribute(symbol, attribute.attribute.trait_type, attribute.attribute.value, attribute.count).then((response) => {
                if(response.status == 200 && typeof response.content !== 'undefined') {
                    if(attribute.count == 1) {
                        setListedAttrModalSize('md')
                    } else if(attribute.count == 2) {
                        setListedAttrModalSize('2xl')
                    } else {
                        setListedAttrModalSize('6xl')
                    }
                    setListedAttrDataFilter(attribute)
                    setListedAttrData(response.content.items)
                }
            })
        }
    }

    const onListedAttributeItemClick = (mint: string) => {
        const url = `https://magiceden.io/item-details/${mint}`
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
        if (newWindow) newWindow.opener = null
    }

    const onSnipeFloorClick = () => {
        if(typeof magicEdenCollection !== 'undefined') {
            const symbol = magicEdenCollection.symbol
            getCollectionListedFloorItem(symbol).then((response) => {
                if(response.status == 200 && typeof response.content !== 'undefined') {
                    const mint = response.content.mint
                    const url = `https://magiceden.io/item-details/${mint}`
                    const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
                    if (newWindow) newWindow.opener = null
                }
            })
        }
    }

    const renderListedAttributes = () => {
        let res: Array<any> = []
        if(listedAttributesArray.length === 0) {
            return (
                <WrapItem w='100%'>
                    <Text mt={6} w='100%' align={'center'}>Unable to retrieve attribute data from Magic-Eden (attribute filter must be disabled)</Text>
                </WrapItem>
            )
        } else {
            listedAttributesArray.map((item, i) => {
                let textColor = 'white'
                if(item.count === 1) {
                    if(floorPrices.length > 0) {
                        const floorPrice = floorPrices[floorPrices.length-1].price
                        if(item.floor <= floorPrice * 3) {
                            textColor = 'orange'
                        }
                    }
                } else if(item.count <= 5) {
                    if(floorPrices.length > 0) {
                        const floorPrice = floorPrices[floorPrices.length-1].price
                        if(item.floor <= floorPrice * 2) {
                            textColor = GREEN_COLOR
                        }
                    }
                }
                
                let newRow = (
                    <WrapItem key={i} w='32%' onClick={(e) => {onListedAttributeClick(item)}}>
                        <VStack 
                            w='100%'
                            m={1}
                            p={1}
                            spacing={0}
                            borderRadius='md'
                            borderStyle={'solid'}
                            borderWidth='1px'
                            borderColor={CONTENT_SECTION_HEADER_BORDER}>
                                <HStack w='100%'>
                                    <Text w='50%' as='b' fontSize={'14px'} color={textColor}>{item.attribute.trait_type}</Text>
                                    <Text align='right' w='25%' as='b' fontSize={'14px'} color={textColor}>({item.count})</Text>
                                    <Text align='right' w='25%' as='b' fontSize={'14px'} color={textColor}>{item.floor}</Text>
                                </HStack>
                                <HStack w='100%'>
                                    <Text w='90%' fontSize={'14px'}>{item.attribute.value}</Text>
                                    {getSearchIcon()}
                                </HStack>
                        </VStack>
                    </WrapItem> 
                )
                res.push(newRow)
            })
            return res
        }
    }

    const renderTxModal = () => {
        return (
            <Modal size={'2xl'} isOpen={isTxOpen} onClose={() => {onTxDetailClose()}} isCentered>
            <ModalOverlay />
            <ModalContent bg={CONTENT_SECTION_HEADER}>
                <ModalHeader textColor={'white'}>{txData?.title}</ModalHeader>
                <ModalCloseButton color={'white'}/>
                <ModalBody>
                {typeof txData === 'undefined' ? 
                <VStack w='100%' h='100%'>
                    <CircularProgress isIndeterminate/>
                </VStack>
                :
                <VStack>
                    <Image w='100%' justify='center' boxSize='250px' alt='' src={txData?.img}/>
                    <Box w='100%'>
                        {renderAttributes(txData?.attributes)}
                    </Box>
                </VStack>}
                </ModalBody>
            </ModalContent>
            </Modal>
        )
    }

    const renderBigTxModalContent = (bigTxData: Activity|undefined): object => {
        if (typeof bigTxData === 'undefined') {
            return (
                <VStack w='100%' h='100%'>
                    <CircularProgress isIndeterminate/>
                </VStack>)
        } else {
            return (
                <>
                <HStack spacing='12px' width='100%'>
                    <Image ml={2} w='35%' justify='left' boxSize='200px' alt='' src={bigTxData?.data?.img}/>
                    <VStack width='65%' h='100%' spacing={0}>
                        <HStack w='100%'>
                            <Text align='right' w='17%' as='b' fontSize="15px">PRICE: </Text>
                            <Text w='83%'>{round(parseInt(bigTxData?.totalAmount) / LAMPORTS_PER_SOL)}</Text>
                        </HStack>
                        <HStack w='100%'>
                            <Text align='right' w='17%' as='b' fontSize="15px">BUYER: </Text>
                            <Link color='white' isExternal href={`https://explorer.solana.com/address/${bigTxData?.buyer}`} w='85%'>{shortenAddress(bigTxData?.buyer, 4)}</Link>
                            
                        </HStack>
                        <HStack w='100%'>
                            <Text align='right' w='17%' as='b' fontSize="15px">MINT: </Text>
                            <Link w='83%' color='white' href={`https://magiceden.io/item-details/${bigTxData?.mint}`} isExternal={true}>{shortenAddress(bigTxData?.mint, 4)}</Link>
                        </HStack>
                        <HStack w='100%'>
                            <Text align='right' w='17%' as='b' fontSize="15px">TIME: </Text>
                            <Text w='83%'>{formatUTCTimestamp(Date.parse(bigTxData?.createdAt), true)}</Text>
                        </HStack>
                    </VStack>
                </HStack>
                {renderAttributes(bigTxData?.data?.attributes)}
                </>
            )
        }
    }

    const renderBigTxModal = () => {
        return (
            <Modal size={'2xl'} isOpen={isBigTxOpen} onClose={() => {onBigTxDetailClose()}} isCentered>
            <ModalOverlay />
            <ModalContent bg={CONTENT_SECTION_HEADER}>
                <ModalHeader textColor={'white'}>{bigTxData?.data?.title}</ModalHeader>
                <ModalCloseButton color={'white'}/>
                <ModalBody>
                {renderBigTxModalContent(bigTxData)}
                </ModalBody>
            </ModalContent>
            </Modal>
        )
    }

    const getListedAttrItemWidth = (): string => {
        if(listedAttrModalSize == 'md') {
            return '100%'
        } else if(listedAttrModalSize == '2xl') {
            return '48%'
        } else {
            return '30%'
        }
    }

    const renderListedAttributeModal = () => {
        return (
            <Modal size={listedAttrModalSize} isOpen={isListedAttrOpen} onClose={() => {onListedAttrModalClose()}} isCentered scrollBehavior={'inside'}>
            <ModalOverlay />
            <ModalContent bg={CONTENT_SECTION_HEADER} >
                <ModalHeader textColor={'white'}>Magic-Eden listing</ModalHeader>
                <ModalCloseButton color={'white'}/>
                <ModalBody>
                    {typeof listedAttrData === 'undefined' || typeof listedAttrDataFilter === 'undefined' ? 
                    <VStack w='100%'>
                        <CircularProgress isIndeterminate/>
                    </VStack>
                    :
                    <VStack w='100%'>
                        <HStack w='100%'>
                            <Text as='b'>Category: </Text>
                            <Text>{listedAttrDataFilter.attribute.trait_type}</Text>
                            <Text as='b'>Name: </Text>
                            <Text>{listedAttrDataFilter.attribute.value}</Text>
                        </HStack>
                        <Wrap>
                            {listedAttrData.map((item, i) => {
                                return (
                                    <WrapItem key={i} w={getListedAttrItemWidth()} onClick={(e) => onListedAttributeItemClick(item.mintAddress)}>
                                        <VStack p='4px' borderRadius='md' borderStyle={'solid'} borderWidth='1px' borderColor={CONTENT_SECTION_HEADER_BORDER} boxShadow={'3px'}>
                                            <HStack w='100%'>
                                                <Text as='b' w='70%'>{item.title}</Text>
                                                <Box w='15%'>{getMagicEdenLogo("48px")}</Box>
                                                <Text as='b' w='15%' align={'right'}>{item.price} SOL</Text>
                                                
                                            </HStack>
                                            <Image boxSize='200px' alt='' src={item.img}/>
                                            {renderAttributes(item.attributes, '150px')}
                                        </VStack>
                                    </WrapItem>
                                )
                            })}
                        </Wrap>
                    </VStack>}
                </ModalBody>
            </ModalContent>
            </Modal>
        )
    }

    const renderAttributes = (attr: Array<Attribute>|undefined, boxWidth: string|undefined='200px') => {
        if(typeof attr === 'undefined') {
            return (<></>)
        }
        
        return (
            <Wrap pt={2} pl={2} w='100%'>
                {attr.map((item, i) => {
                let textColor = 'white'
                const count = listedAttributesMap?.get(item.trait_type)?.get(item.value)?.count
                let countValue = ''
                if(typeof count !== 'undefined') {
                    if(count === 1) {
                        textColor = 'orange'
                    }
                    else if(count <= 5) {
                        textColor = GREEN_COLOR
                    }
                    countValue = '(' + count + ')'
                }
                const floor = listedAttributesMap?.get(item.trait_type)?.get(item.value)?.floor
                let floorValue = ''
                if(typeof floor !== 'undefined') {
                    floorValue = floor?.toString()
                }
                
                return (
                    <WrapItem key={i} w={boxWidth}>
                        <VStack 
                            w='100%'
                            pl={1}
                            pr={1}
                            spacing={0}
                            borderRadius='md'
                            borderStyle={'solid'}
                            borderWidth='1px'
                            borderColor={CONTENT_SECTION_HEADER_BORDER}>
                                <HStack w='100%'> 
                                    <Text w='80%' as='b' fontSize={'14px'} color={textColor}>{item.trait_type}:</Text>
                                    <Text w='20%' align='right' fontSize={'12px'} color={textColor}>{countValue}</Text>
                                </HStack>
                                <HStack w='100%'> 
                                    <Text w='80%' fontSize={'14px'}>{item.value}</Text>
                                    <Text w='20%' align='right' fontSize={'12px'}>{floorValue}</Text>
                                </HStack>
                                
                        </VStack>
                    </WrapItem>
                )
                })}
            </Wrap>
        )
    }

    return (
        <>
        {renderTxModal()}
        {renderListedAttributeModal()}
        {renderBigTxModal()}
        <Box w='100%' ml={6} pr={6}>
            <CollectionHeader width='100%' name={magicEdenCollection?.name} mintPrice={mintPrice} mintDate={mintDate}
                listed={liveCount} volume={volumeTotal} volume24hr={volume24hr} meUrl={collectionUrl?.toString()} 
                websiteUrl={collectionEscrowData?.website?.toString()} twitterUrl={collectionEscrowData?.twitter?.toString()} 
                discordUrl={collectionEscrowData?.discord?.toString()} fees={feesTitle} creator={verifiedCreator}/>
        </Box>
        <HStack pt={4} spacing='0px' width='100%'>
            <VStack spacing='0px' width='25%' h='100%' pl={6}>
                <Box width='100%' h='170px' pb={3}>
                    <Text as='b' w='100%'>{liveFloorChartTitle}</Text>
                    <ResponsiveContainer width={"100%"} height={"100%"}>
                        <AreaChart
                            data={floorPrices}
                            margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                            <XAxis stroke="white" domain={['auto', 'auto']} dataKey="index"/>
                            <YAxis stroke="white" domain={[0, 'auto']}/>
                            <Tooltip
                                wrapperStyle={{
                                    borderColor: 'white',
                                    boxShadow: '2px 2px 3px 0px rgb(0, 0, 0)',
                                }}
                                contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                                labelStyle={{ fontWeight: 'bold', color: '#ffffff' }}/>
                            <Area type="monotone" dataKey="price" stroke="rgba(112, 219, 112, 1)" fill="rgba(112, 219, 112, 0.3)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>
                <Box width='100%' h='170px'>
                    <Text as='b' w='100%'>{liveListedChartTitle}</Text>
                    <ResponsiveContainer width={"100%"} height={"100%"}>
                        <AreaChart
                            data={listedCount}
                            margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                            <XAxis stroke="white" domain={['auto', 'auto']} dataKey="index"/>
                            <YAxis stroke="white" domain={[0, 'auto']}/>
                            <Tooltip
                                wrapperStyle={{
                                    borderColor: 'white',
                                    boxShadow: '2px 2px 3px 0px rgb(0, 0, 0)',
                                }}
                                contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                                labelStyle={{ fontWeight: 'bold', color: '#ffffff' }}/>
                            <Area type="monotone" dataKey="count" stroke="rgba(112, 219, 112, 1)" fill="rgba(112, 219, 112, 0.3)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>
                <Flex width='100%' justify={'center'}>
                    <Button mt={4} bg={CONTENT_SECTION_HEADER} textColor={'white'} onClick={() => {onSnipeFloorClick()}}>SNIPE THE FLOOR</Button>
                </Flex>
                <Box width='100%'>
                    <SectionHeader title='LIVE ACTIVITY FEED' width='100%' align='center' fontSize="2xl" subTitle={liveActivityFeedSubTitle} subTitleFontSize="l"/>
                    <VStack spacing='0px' h='100%' width='100%'>
                        <Flex width='100%' mb={2}>
                            <Flex width='15%'>
                                <Text as='b' w='100%'>PRICE</Text>
                            </Flex>
                            <Flex width='24%'>
                                <Text as='b' w='100%'>MARKET</Text>
                            </Flex>
                            <Flex width='14%'>
                                <Text as='b' w='100%'>TIME</Text>
                            </Flex>
                            <Flex width='27%'>
                                <Text as='b' w='100%'>BUYER</Text>
                            </Flex>
                            <Flex width='25%'>
                                <Text as='b' w='100%'>MINT</Text>
                            </Flex>
                            <Flex width='10%'>
                                <Text as='b' w='100%'></Text>
                            </Flex>
                        </Flex>
                        {activities.map((item, i) => {
                            return (
                                <Flex key={i} width='100%'>
                                    <Flex width='15%'>
                                        <Text as='b' w='100%'>{round(parseInt(item.totalAmount) / LAMPORTS_PER_SOL)}</Text>
                                    </Flex>
                                    <Flex width='24%'>
                                        <Text w='100%'>{item.source}</Text>
                                    </Flex>
                                    <Flex width='14%'>
                                        <Text w='100%'>{formatUTCTimestamp(Date.parse(item.createdAt), true, TIME_FORMAT)}</Text>
                                    </Flex>
                                    <Flex width='27%'>
                                        <Link isExternal href={`https://explorer.solana.com/address/${item.buyer}`} textColor={highlightedBuyers.includes(item.buyer) ? GREEN_COLOR : 'white'} w='100%'>{shortenAddress(item.buyer, 4)}</Link>
                                    </Flex>
                                    <Flex width='25%'>
                                        <Link color='white' w='100%' href={`https://magiceden.io/item-details/${item.mint}`} isExternal>{shortenAddress(item.mint, 4)}</Link>
                                    </Flex>
                                    <Flex width='10%'>
                                        <IconButton
                                            boxSize={'26px'}
                                            variant='ghost'
                                            aria-label='detail'
                                            onClick={(e) => {onTxDetailClick(item.mint)}}
                                            icon={getSearchIcon()}
                                            _hover={{}}
                                            _focus={{}}/>
                                    </Flex>
                                </Flex>
                            )
                        })}
                    </VStack>
                </Box>
            </VStack>
            <VStack width='45%' h='100%' pl={6} pr={6}>
                <SectionHeader title='LISTED ATTRIBUTES' width='100%' align='center' fontSize="2xl" icon={true} tooltip={attributesTitle}/>
                <Wrap pl={1} w='100%'>
                    {renderListedAttributes()}
                </Wrap>
            </VStack>
            <VStack width='30%' h='100%' pr={6}>
                <SectionHeader title='LIVE BIG ACTIVITY' width='100%' align='center' fontSize="2xl" icon={true} tooltip={bigActivitiesTitle}/>
                <VStack spacing='12px' width='100%' h='100%'>
                    <Wrap>
                    {bigActivities.map((item, i) => {
                        return (
                            <WrapItem key={i} onClick={(e) => {onBigActivityDetailClick(item)}}>
                                <VStack ml={2}>
                                    <Image justify='left' boxSize='160px' alt='' src={item.data?.img}/>
                                    <HStack w='100%'>
                                        <Text align='right' w='40%' as='b'>PRICE: </Text>
                                        <Text w='45%'>{round(parseInt(item.totalAmount) / LAMPORTS_PER_SOL)}</Text>
                                        <Box w='15%'>{getSearchIcon()}</Box>
                                    </HStack>
                                    <Divider/>
                                </VStack>
                            </WrapItem>
                        )
                    })}
                    </Wrap>
                </VStack>
            </VStack>
        </HStack>
        </>
    )
};

function getCollectionId(location): number {
    const query = new URLSearchParams(location.search);
    const collectionId = query.get('collectionId')
    if(collectionId != null) {
        return parseInt(collectionId, 10);
    }
    return -1
}