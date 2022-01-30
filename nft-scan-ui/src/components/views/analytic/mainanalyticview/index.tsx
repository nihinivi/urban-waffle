import { Text, VStack, Box, Flex, Link, Button, Image, IconButton, HStack, Wrap, WrapItem, Spacer } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { getMeCollectionHistory, getMeLastCollection, getMeLastLaunchpad, version } from "../../../../api/api";
import SectionHeader from "../../../sectionheader";
import useSound from 'use-sound';
import { Collection, Launchpad } from "../../../../models/collection";
import { getAppLogo, getMagicEdenLogo } from "../../../icon";
import { formatUTCTimestamp } from "../../../../utils/date";
import { round } from "../../../../utils/utils";
import { CONTENT_SECTION_HEADER_BORDER } from "../../../../themes/constants";
import { getAggregatedCollectionMetrics } from "../../../../api/magiceden";
import { STORAGE_COLLECTION_ALERT_KEY, STORAGE_LAUNCHPAD_ALERT_KEY } from "../../../../constants";

export default function MainAnalyticView () {
    const [magicEdenLastCollection, setMagicEdenLastCollection] = useState<Collection>()
    const [magicEdenCollectionAlert, setMagicEdenCollectionAlert] = useState<boolean>(false)
    const [magicEdenLastCollectionUrl, setMagicEdenLastCollectionUrl] = useState<String>('')
    const [magicEdenLastLaunchpad, setMagicEdenLastLaunchpad] = useState<Launchpad>()
    const [magicEdenLaunchpadAlert, setMagicEdenLaunchpadAlert] = useState<Boolean>(false)
    const [magicEdenLastLaunchpadUrl, setMagicEdenLastLaunchpadUrl] = useState<String>('')
    const [magicEdenCollectionHistory, setMagicEdenCollectionHistory] = useState<Array<any>>([])
    const [magicEdenCollectionPopular, setMagicEdenCollectionPopular] = useState<Array<any>>([])

    const [playActive] = useSound(
        'alert.wav',
        { volume: 0.75 }
    );

    const fetchMeCollectionMetrics = () => {
        getAggregatedCollectionMetrics().then((response) => {
            if(response.status == 200) {
                const meContent = response.content
                if(typeof meContent !== 'undefined') {
                    meContent.result.sort((a, b): number => {
                        return b.txVolume.value1d - a.txVolume.value1d
                    })
                    const resultPopular = meContent.result.slice(0, 10)
                    setMagicEdenCollectionPopular(resultPopular)
                    //console.log(resultPopular)
                    const resultHistory = new Array<any>()
                    getMeCollectionHistory().then((response) => {
                        if(response.status == 200) {
                            response.json().then((body) => {
                                for(let c of body['collections']) {
                                    let found = false
                                    for(let meC of meContent.result) {
                                        if(meC.symbol === c.symbol) {
                                            resultHistory.push(meC)
                                            found = true
                                        }
                                    }
                                    if(!found) {
                                        resultHistory.push(c)
                                    }
                                }
                                setMagicEdenCollectionHistory(resultHistory)
                                //console.log(resultHistory)
                            }).catch(() => {
            
                            })
                        } else {
            
                        }
                    }).catch((msg) => {
                        console.error(msg)
                    })
                }
            } else {

            }
        }).catch((msg) => {
            console.error(msg)
        })
    }

    const fetchMeLastCollection = (triggerAlert: boolean) => {
        getMeLastCollection().then((response) => {
            if(response.status == 200) {
                response.json().then((body) => {
                    const isCollectionDiff = magicEdenLastCollection?.symbol !== body.symbol
                    if(triggerAlert && magicEdenCollectionAlert && isCollectionDiff) {
                        //playActive()
                        showAlertNotification(Alert.COLLECTION, body.name, body.id)
                    }
                    setMagicEdenLastCollection(body)
                    setMagicEdenLastCollectionUrl('https://magiceden.io/marketplace/' + body.symbol)
                }).catch(() => {

                })
            }
        }).catch(() => {

        })
    }

    const fetchMeLastLaunchpad = (triggerAlert: boolean) => {
        getMeLastLaunchpad().then((response) => {
            if(response.status == 200) {
                response.json().then((body) => {
                    const isCollectionDiff = magicEdenLastLaunchpad?.symbol !== body.symbol
                    if(triggerAlert && isCollectionDiff && magicEdenLaunchpadAlert) {
                        //playActive()
                        showAlertNotification(Alert.LAUNCHPAD, body.name, body.id)
                    }
                    setMagicEdenLastLaunchpad(body)
                    setMagicEdenLastLaunchpadUrl('https://magiceden.io/launchpad')
                }).catch(() => {

                })
            }
        }).catch(() => {

        })
    }

    enum Alert {
        LAUNCHPAD,
        COLLECTION
    }

    const onAlertClick = (alert: Alert, value: boolean) => {
        const storageValue = value ? 'true' : 'false'
        if(alert === Alert.LAUNCHPAD) {
            setMagicEdenLaunchpadAlert(value)
            localStorage.setItem(STORAGE_LAUNCHPAD_ALERT_KEY, storageValue)
        } else if(alert === Alert.COLLECTION) {
            setMagicEdenCollectionAlert(value)
            localStorage.setItem(STORAGE_COLLECTION_ALERT_KEY, storageValue)
        }
        if(value) {
            if (Notification.permission !== 'granted') {
                Notification.requestPermission().then((permission) => {
                    if(Notification.permission === 'granted') {
                        const notification = new Notification('Notifications allowed', {
                            icon: 'logo.png'
                        })
                    }
                })
            }
        }
    }
    
    const showAlertNotification = (alert: Alert, name: string, id: number) => {
        if (Notification.permission === 'granted') {
            let titleValue = ''
            let nameValue = ''
            let idValue = 0
            if(alert === Alert.COLLECTION) {
                titleValue = 'COLLECTION'
                nameValue = name + `\n\n CLICK TO OPEN`
                idValue = id
            } else {
                titleValue = 'LAUNCHPAD'
                nameValue = name
            }
            
            const title = `NEW ${titleValue}`
            const body = `${nameValue}`
            const notification = new Notification(title, {
                body: body,
                icon: 'logo.png',
            })
            notification.onclick = () => {
                if(idValue > 0 && alert === Alert.COLLECTION) {
                    const url = `https://www.scalp-empire.com/#/collection/me?collectionId=${idValue}`
                    const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
                    if (newWindow) newWindow.opener = null
                }
            }
        }
    }

    const initStorage = () => {
        const collectionAlertStorage = localStorage.getItem(STORAGE_COLLECTION_ALERT_KEY)
        const collectionAlert = collectionAlertStorage === 'true' ? true : false
        if(!collectionAlert) {
            localStorage.setItem(STORAGE_COLLECTION_ALERT_KEY, 'false')
        }
        setMagicEdenCollectionAlert(collectionAlert)
        
        const launchpadAlertStorage = localStorage.getItem(STORAGE_LAUNCHPAD_ALERT_KEY)
        const launchpadAlert = launchpadAlertStorage === 'true' ? true : false
        if(!launchpadAlert) {
            localStorage.setItem(STORAGE_LAUNCHPAD_ALERT_KEY, 'false')
        }
        setMagicEdenLaunchpadAlert(launchpadAlert)
    }

    useEffect(() => {
        if (!('Notification' in window)) {
            console.log('This browser do not handle desktop notifications')
        }
        initStorage()
        fetchMeLastCollection(false)
        fetchMeLastLaunchpad(false)
        fetchMeCollectionMetrics()
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchMeLastCollection(true)
            fetchMeLastLaunchpad(true)
            fetchMeCollectionMetrics()
        }, 8 * 1000)
        return () => clearInterval(interval);
    }, [magicEdenLastCollection, magicEdenLastLaunchpad, magicEdenCollectionAlert, magicEdenLaunchpadAlert])

    let magicEdenLastCollectionDate = '-'
    if(typeof magicEdenLastCollection !== 'undefined') {
        magicEdenLastCollectionDate = formatUTCTimestamp(Date.parse(magicEdenLastCollection.createdAt))
    }

    let magicEdenLastLaunchpadDate = '-'
    if(typeof magicEdenLastLaunchpad !== 'undefined') {
        magicEdenLastLaunchpadDate = formatUTCTimestamp(Date.parse(magicEdenLastLaunchpad.launchDate))
    }

    return (
        <>
        <VStack spacing='24px' width='100%' pl={12} pr={12}>
            <SectionHeader title='MARKETPLACES' width='100%' align='center' fontSize="3xl"/>
            <Box width='100%'>
                <HStack w='100%'>
                    <SectionHeader title='MAGIC-EDEN' width="30%"  align='center' fontSize="2xl"/>
                    <Link href='#/collection/me/all' color='white' fontSize={16} isExternal>
                        SHOW ALL COLLECTIONS
                    </Link>
                </HStack>
                <Wrap w='100%' pt={6}>
                    <WrapItem w='49%' maxW='50%' 
                        borderRadius='md'
                        borderStyle={'solid'}
                        borderWidth='2px'
                        borderColor={CONTENT_SECTION_HEADER_BORDER}
                        boxShadow={'2xl'}>
                        <HStack w='100%' m={6}>
                            <Text w='30%' fontWeight={"bold"} fontSize={18}>Last launchpad:</Text>
                            <VStack w="50%">
                                <Text w='100%'>{magicEdenLastLaunchpad?.name}</Text>
                                <Text w='100%'>{magicEdenLastLaunchpadDate}</Text>
                            </VStack>
                            <VStack w="20%">
                                <Button w='60px' h='22px' variant='solid' colorScheme={magicEdenLaunchpadAlert ? 'green' : 'red'} onClick={() => {onAlertClick(Alert.LAUNCHPAD, !magicEdenLaunchpadAlert)}}>{magicEdenLaunchpadAlert ? 'ON' : 'OFF'}</Button>
                            </VStack>
                            <IconButton
                                    w='20%'
                                    as='a'
                                    _hover={{}}
                                    _focus={{}}
                                    variant='ghost'
                                    aria-label='Magic-Eden'
                                    target="_blank"
                                    href={magicEdenLastLaunchpadUrl?.toString()}
                                    icon={getMagicEdenLogo("48px")}/>
                        </HStack>
                    </WrapItem>
                    <Spacer/>
                    <WrapItem w='49%' maxW="50%"
                        borderRadius='md'
                        borderStyle={'solid'}
                        borderWidth='2px'
                        borderColor={CONTENT_SECTION_HEADER_BORDER}
                        boxShadow={'2xl'}>
                        <HStack w='100%' m={6}>
                            <Text w='30%'fontWeight={"bold"} fontSize={18}>Last collection:</Text>
                            <VStack w="50%">
                                <Link w='100%' color='white' href={'#/collection/me?collectionId=' + magicEdenLastCollection?.id} isExternal={true}>{magicEdenLastCollection?.name}</Link>
                                <Text w='100%'>{magicEdenLastCollectionDate}</Text>
                            </VStack>
                            <VStack w="20%">
                                <Button w='60px' h='22px' variant='solid' colorScheme={magicEdenCollectionAlert ? 'green' : 'red'} onClick={() => {onAlertClick(Alert.COLLECTION, !magicEdenCollectionAlert)}}>{magicEdenCollectionAlert ? 'ON' : 'OFF'}</Button>
                            </VStack>
                            <IconButton
                                w='20%'
                                as='a'
                                _hover={{}}
                                _focus={{}}
                                variant='ghost'
                                aria-label='Magic-Eden'
                                target="_blank"
                                href={magicEdenLastCollectionUrl?.toString()}
                                icon={getMagicEdenLogo("48px")}/>
                        </HStack>
                    </WrapItem>
                </Wrap>
                
                <Wrap w='100%' mt={6}>
                    <WrapItem w='49%' maxW="50%"
                        borderRadius='md'
                        borderStyle={'solid'}
                        borderWidth='2px'
                        borderColor={CONTENT_SECTION_HEADER_BORDER}
                        boxShadow={'2xl'}
                        p={2}>
                        <VStack h='100%' spacing='6px' w="100%">
                            <Text w='100%' fontWeight={"bold"}>POPULAR COLLECTIONS</Text>
                            <HStack h='100%' w="100%">
                                <Text w='30%' fontWeight={"bold"}>NAME</Text>
                                <Text w='20%' fontWeight={"bold"}>TIME</Text>
                                <Text w='25%' fontWeight={"bold"}>VOLUME 24hr</Text>
                                <Text w='15%' fontWeight={"bold"}>FLOOR PRICE</Text>
                                <Text w='5%' fontWeight={"bold"}></Text>
                                <Text w='5%' fontWeight={"bold"}></Text>
                            </HStack>
                            <VStack h='100%' w='100%'>
                                {magicEdenCollectionPopular?.map((collection, i) => {
                                    return (
                                        <HStack key={i} w="100%">
                                            <Flex w="30%">
                                                <Link color='white' href={'#/collection/me?collectionId=' + collection.id} isExternal={true}>{collection?.name}</Link>
                                            </Flex>
                                            <Flex w="20%" >
                                                <Text>{formatUTCTimestamp(Date.parse(collection.createdAt))}</Text>
                                            </Flex>
                                            <Flex w="25%" >
                                                <Text>{round(collection.txVolume.value1d)}</Text>
                                            </Flex>
                                            <Flex w="15%" >
                                                <Text>{round(collection.floorPrice.value1d)}</Text>
                                            </Flex>
                                            <Flex w="5%" >
                                                <IconButton
                                                    as='a'
                                                    _hover={{}}
                                                    _focus={{}}
                                                    variant='ghost'
                                                    aria-label='Magic-Eden'
                                                    target="_blank"
                                                    href={'https://magiceden.io/marketplace/' + collection.symbol}
                                                    icon={getMagicEdenLogo("32px")}/>
                                            </Flex>
                                            <Flex w="5%" >
                                                <IconButton
                                                    as='a'
                                                    _hover={{}}
                                                    _focus={{}}
                                                    _selection={{}}
                                                    variant='ghost'
                                                    aria-label='Trade'
                                                    target="_blank"
                                                    href={'#/collection/me?collectionId=' + collection.id}
                                                    icon={getAppLogo("26px")}/>
                                            </Flex>
                                        </HStack>
                                    )
                                })}
                            </VStack>
                        </VStack>
                    </WrapItem>
                    <Spacer/>
                    <WrapItem w='49%' maxW="50%"
                        borderRadius='md'
                        borderStyle={'solid'}
                        borderWidth='2px'
                        borderColor={CONTENT_SECTION_HEADER_BORDER}
                        boxShadow={'2xl'}
                        p={2}>
                        <VStack h='100%' spacing='6px' w="100%">
                            <Text w='100%' fontWeight={"bold"}>LAST 10 COLLECTIONS</Text>
                            <HStack h='100%' w="100%">
                                <Text w='30%' fontWeight={"bold"}>NAME</Text>
                                <Text w='20%' fontWeight={"bold"}>TIME</Text>
                                <Text w='25%' fontWeight={"bold"}>VOLUME 24hr</Text>
                                <Text w='15%' fontWeight={"bold"}>FLOOR PRICE</Text>
                                <Text w='5%' fontWeight={"bold"}></Text>
                                <Text w='5%' fontWeight={"bold"}></Text>
                            </HStack>
                            <VStack h='100%' w='100%'>
                                {magicEdenCollectionHistory?.map((collection, i) => {
                                    return (
                                        <HStack key={i} w="100%">
                                            <Flex w="30%">
                                                <Link color='white' href={'#/collection/me?collectionId=' + collection.id} isExternal={true}>{collection?.name}</Link>
                                            </Flex>
                                            <Flex w="20%" >
                                                <Text>{formatUTCTimestamp(Date.parse(collection.createdAt))}</Text>
                                            </Flex>
                                            <Flex w="25%" >
                                                <Text>{round(collection.txVolume?.value1d)}</Text>
                                            </Flex>
                                            <Flex w="15%" >
                                                <Text>{round(collection.floorPrice?.value1d)}</Text>
                                            </Flex>
                                            <Flex w="5%" >
                                                <IconButton
                                                    as='a'
                                                    _hover={{}}
                                                    _focus={{}}
                                                    variant='ghost'
                                                    aria-label='Magic-Eden'
                                                    target="_blank"
                                                    href={'https://magiceden.io/marketplace/' + collection.symbol}
                                                    icon={getMagicEdenLogo("32px")}/>
                                            </Flex>
                                            <Flex w="5%" >
                                                <IconButton
                                                    as='a'
                                                    _hover={{}}
                                                    _focus={{}}
                                                    _selection={{}}
                                                    variant='ghost'
                                                    aria-label='Trade'
                                                    target="_blank"
                                                    href={'#/collection/me?collectionId=' + collection.id}
                                                    icon={getAppLogo("26px")}/>
                                            </Flex>
                                        </HStack>
                                    )
                                })}
                            </VStack>
                        </VStack>
                    </WrapItem>
                </Wrap>
            </Box>
            
        </VStack>
        </>
    )
};

