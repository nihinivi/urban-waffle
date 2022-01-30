import { Text, VStack, Box, Flex, Button, Image, Wrap, WrapItem, Tooltip, Modal, ModalOverlay, ModalContent, ModalCloseButton, ModalBody, useDisclosure, HStack, useToast, Switch, Checkbox, Select, Link } from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import SectionHeader from "../../sectionheader";
import { isValidHttpUrl, round, shortenAddress } from "../../../utils/utils";
import { CONTENT_SECTION_HEADER, CONTENT_SECTION_HEADER_BORDER, DATETIME_SQL_FORMAT, DATETIME_WITH_SECONDS_FORMAT } from "../../../themes/constants";
import { CandyMachineSerialized } from "../../../models/collection";
import { getCandyMachinesV2ById, getCandyMachinesV2ForRange, getCandyMachinesV2Verified, postExtractMintSite, refreshCandyMachinesV2 } from "../../../api/api";
import moment from "moment";
import { mint } from "../../../utils/candymachine/v2/mint";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as anchor from '@project-serum/anchor';
import { CandyMachineAccount, CANDY_MACHINE_PROGRAM, getCandyMachineState } from "../../../utils/candymachine/v2/candy-machine";
import { GatewayProvider } from "@civic/solana-gateway-react";
import { RPC, STORAGE_BOT_CUSTOM_RPC, STORAGE_BOT_ONLY_VERIFIED, STORAGE_LEVEL } from "../../../constants";
import { CaptchaMintButton } from "../../mintbutton/CaptchaMintButton";
import Countdown from "react-countdown";
import { formatCountdown } from "../../../utils/date";
import SearchInput from "../../search";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import TextInput from "../../textinput";

export default function MainMintBotView () {
    const [data, setData] = useState<Array<CandyMachineSerialized>>([])
    const [verifiedData, setVerifiedData] = useState<Array<string>>([])
    const [onlyVerified, setOnlyVerified] = useState<boolean>(false)
    const [mintData, setMintData] = useState<CandyMachineSerialized|undefined>(undefined)
    const [candyMachine, setCandyMachine] = useState<CandyMachineAccount|undefined>(undefined)
    const [level, setLevel] = useState<string|null>(null)
    const [isOnCooldown, setIsOnCooldown] = useState<boolean>(false)
    const [balance, setBalance] = useState<number>(0)
    const [numberOfTxs, setNumberOfTxs] = useState<number>(1)
    const [customRpc, setCustomRpc] = useState<string|null>(null)
    const [extractorData, setExtractorData] = useState<ExtractResult|undefined>(undefined)

    const { isOpen: isMintOpen, onOpen: onMintOpen, onClose: onMintClose } = useDisclosure()
    const { isOpen: isExtractorOpen, onOpen: onExtractorOpen, onClose: onExtractorClose } = useDisclosure()

    interface ExtractResult {
        matchPks: Array<string>,
        noMatchPks: Array<string>
    }

    const connection = useConnection().connection
    const wallet = useWallet();
    const toast = useToast()

    const anchorWallet = useMemo(() => {
        if (
          !wallet ||
          !wallet.publicKey ||
          !wallet.signAllTransactions ||
          !wallet.signTransaction
        ) {
          return;
        }
    
        return {
          publicKey: wallet.publicKey,
          signAllTransactions: wallet.signAllTransactions,
          signTransaction: wallet.signTransaction,
        } as anchor.Wallet;
      }, [wallet]);
    
    const setNewCustomRPC = (rpc: string) => {
        rpc = rpc.trim()
        if(rpc.length === 0) {
            localStorage.setItem(STORAGE_BOT_CUSTOM_RPC, rpc)
            setCustomRpc(rpc)
            showToast('Custom RPC set to default', 'green.500')
        } else {
            if(isValidHttpUrl(rpc)) {
                localStorage.setItem(STORAGE_BOT_CUSTOM_RPC, rpc)
                setCustomRpc(rpc)
                showToast('Custom RPC set', 'green.500')
            } else {
                showToast('Invalid RPC URL', 'red.500')
            }
        }
    }

    const getDateStart = (): moment.Moment => {
        return moment.utc().subtract(1, 'h')
    }

    const getDateEnd = (dateStart: moment.Moment): moment.Moment => {
        return dateStart.add(1 + 24, 'h')
    }

    const fetchVerifiedData = () => {
        getCandyMachinesV2Verified().then((response) => {
            if(response.status == 200) {
                response.json().then((body) => {
                    setVerifiedData(body['results'])
                }).catch(() => {
  
                })
            }
        }).catch(() => {
  
        })
    }

    const fetchData = () => {
        const momentStart: moment.Moment = getDateStart()
        const dateStart = momentStart.utc(false).format(DATETIME_SQL_FORMAT) + 'Z'
        const dateEnd = getDateEnd(momentStart).utc(false).format(DATETIME_SQL_FORMAT) + 'Z'

        getCandyMachinesV2ForRange(dateStart, dateEnd).then((response) => {
            if(response.status == 200) {
                response.json().then((body) => {
                    const result: Array<CandyMachineSerialized> = []
                    body['results'].map((item) => {
                        result.push(JSON.parse(item))
                    })
                    setData(result)
                }).catch(() => {
  
                })
            }
        }).catch(() => {
  
        })
    }

    const fetchBalance = () => {
        if(typeof anchorWallet !== 'undefined' && anchorWallet != null && anchorWallet.publicKey != null) {
            connection.getBalance(anchorWallet.publicKey).then((response) => {
                setBalance(round(response / LAMPORTS_PER_SOL))
            }).catch((err) => {
                console.log(err)
            })
        }
    }

    const fetchSpecificCandyMachineV2 = (cmId: string) => {
        try {
            new anchor.web3.PublicKey(cmId.trim())
            showToast('Searching Candy-Machine... Please wait', 'blue.500')
            getCandyMachinesV2ById(cmId.trim()).then((response) => {
                if(response.status == 200) {
                    response.json().then((body) => {
                        const cmData: CandyMachineSerialized = JSON.parse(body)
                        onMintClick(cmData, true)
                    }).catch(() => {
                        
                    })
                } else {
                    showToast('Candy-Machine ID not found', 'orange.500')
                }
            }).catch(() => {
                showToast('Candy-Machine ID not found', 'orange.500')
            }).finally(() => {
    
            })
        } catch(err) {
            console.log('Invalid pubkey')
            showToast('Invalid Candy-Machine ID', 'red.500')
        }
    }

    useEffect(() => {
        setLevel(localStorage.getItem(STORAGE_LEVEL))
        setCustomRpc(localStorage.getItem(STORAGE_BOT_CUSTOM_RPC))
        let onlyVerifiedSetting = localStorage.getItem(STORAGE_BOT_ONLY_VERIFIED)
        if(onlyVerifiedSetting == null) {
            setOnlyVerified(false)
            localStorage.setItem(STORAGE_BOT_ONLY_VERIFIED, 'false')
        } else {
            setOnlyVerified(onlyVerifiedSetting === 'true' ? true : false)
        }
        fetchVerifiedData()
        fetchData()
        const intervalData = setInterval(() => {
            fetchVerifiedData()
            fetchData()
        }, 60 * 1000)
        return () => {
            clearInterval(intervalData)
        };
    }, [])

    useEffect(() => {
        fetchBalance()
        const interval = setInterval(() => {
            fetchBalance()
        }, 60 * 1000)
        return () => {
            clearInterval(interval)
        };
    }, [anchorWallet])

    useEffect(() => {
        if(isOnCooldown) {
            const timeoutCooldown = setTimeout(() => {
                setIsOnCooldown(false)
            }, 3 * 1000)
            return () => {
                clearTimeout(timeoutCooldown)
            };
        }
    }, [isOnCooldown])

    const onExtractorModalClose = () => {
        setExtractorData(undefined)
        onExtractorClose()
    }

    const onMintModalClose = () => {
        setMintData(undefined)
        setCandyMachine(undefined)
        onMintClose()
    }

    const showToast = (text: string, bg: string) => {
        toast({
            position: 'bottom-left',
            render: () => (
              <Box color='white' p={3} bg={bg}>
                {text}
              </Box>
            ),
        })
    }

    const onMintClick = (cmData: CandyMachineSerialized, openModal: boolean) => {
        const loadCmState  = async (cmData: CandyMachineSerialized) => {
            if (!wallet || typeof anchorWallet === 'undefined') {
                return;
            }
            if (cmData.id) {
                try {
                    showToast('Loading Candy-Machine... Please wait', 'blue.500')
                    const connectionObject = getConnectionObject()
                    const candyMachine = await getCandyMachineState(anchorWallet, new anchor.web3.PublicKey(cmData.id), connectionObject);
                    setCandyMachine(candyMachine)
                    refreshCandyMachinesV2(candyMachine.id.toBase58()).then((response) => {
                        if(openModal) {
                            setMintData(cmData)
                            onMintOpen()
                            showToast('Candy-Machine loaded.', 'green.500')
                        }
                    }).catch((err) => {
                        console.log(err)
                    })
                } catch (e) {
                    console.log('There was a problem fetching Candy Machine state')
                    console.log(e)
                    showToast('Candy-Machine load failed.', 'red.500')
                }
            }
        }
        loadCmState(cmData)
    }

    const onRefreshClick = async (cmData: CandyMachineSerialized): Promise<void> => {
        if (!wallet || typeof anchorWallet === 'undefined') {
            return;
        }
        if (cmData.id) {
            try {
                showToast('Refreshing Candy-Machine... Please wait', 'blue.500')
                const connectionObject = getConnectionObject()
                const candyMachine = await getCandyMachineState(anchorWallet, new anchor.web3.PublicKey(cmData.id), connectionObject);
                setCandyMachine(candyMachine)
                refreshCandyMachinesV2(candyMachine.id.toBase58()).then((response) => {
                    if(response.status === 200) {
                        response.json().then((body) => {
                            setMintData(body)
                            const newData = [...data]
                            let i = 0
                            for(let d of newData) {
                                if(d.id === body.id) {
                                     newData[i] = body
                                    break
                                }
                                ++i
                            }
                            setData(newData)
                            showToast('Candy-Machine refreshed.', 'green.500')
                        }).catch((err) => {
                            showToast('Candy-Machine refresh failed.', 'red.500')
                        })
                    } else {
                        showToast('Candy-Machine refresh failed.', 'red.500')
                    }
                }).catch((err) => {
                    console.log(err)
                    showToast('Candy-Machine refresh failed.', 'red.500')
                })
            } catch (e) {
                console.log('There was a problem fetching Candy Machine state')
                console.log(e)
                showToast('Candy-Machine refresh failed.', 'red.500')
            }
        }
    }

    const getConnectionObject = (): anchor.web3.Connection => {
        let connectionObject: anchor.web3.Connection = connection
        let customStorageRpc = localStorage.getItem(STORAGE_BOT_CUSTOM_RPC)
        if(customStorageRpc != null && customStorageRpc.length > 0) {
            connectionObject = new anchor.web3.Connection(customStorageRpc)
        }
        return connectionObject
    }

    const onMintNClick = async (n: number): Promise<void> => {
        if(anchorWallet != null) {
            if(typeof candyMachine !== 'undefined') {
                const nowTs: number = moment.utc().valueOf()
                const goLiveDateTs: number = candyMachine.state.goLiveDate.toNumber() * 1000
                let deltaSecond: number = goLiveDateTs - nowTs
                const connectionObject = getConnectionObject()
                if(localStorage.getItem(STORAGE_LEVEL) === 'gold') {
                    if((deltaSecond - 1000) > 0) {
                        showToast(`Minting hasn't start yet: wait ${(deltaSecond - 1000) / 1000} seconds`, 'orange.500')
                    } else {
                        showToast(`Sending ${n} transactions`, 'blue.500')
                        for (let i = 0; i < n; ++i) {
                            mint(connectionObject, anchorWallet, candyMachine)
                        }
                    }
                } else if (localStorage.getItem(STORAGE_LEVEL) ==='silver') {
                    if(!isOnCooldown) {
                        if(deltaSecond > 0) {
                            showToast(`Minting hasn't start yet: wait ${deltaSecond / 1000} seconds`, 'orange.500')
                        } else {
                            showToast(`Sending ${n} transactions`, 'blue.500')
                            for (let i = 0; i < n; ++i) {
                                mint(connectionObject, anchorWallet, candyMachine)
                            }
                            setIsOnCooldown(true)
                        }
                    } else {
                        showToast(`Spam limit: wait 3 seconds`, 'orange.500')
                    }
                }
            }
        }
    }

    const onMintCaptchaClick = async (): Promise<void> => {
        onMintNClick(1)
    }

    interface CmDisplayData {
        date: string,
        localDateObject: Date|null,
        localDate: string,
        name: string,
        metadataUrl: string,
        imageUrl: string,
        unit: string,
        tokenMint: string,
        supply: string,
        wl: string,
        captcha: string,
    }

    const getCmDisplayData = (item:CandyMachineSerialized): CmDisplayData => {
        let date = '<Unknown>'
        let localDateObject: Date|null = null
        let localDate = '<Unknown>'
        let name = '<Unknown>'
        let metadataUrl = ''
        let imageUrl = ''
        let unit = 'SOL'
        let tokenMint = 'SOL'
        let supply = item.itemsRedeemed + '/' + item.itemsAvailable + ' (Left: ' + item.itemsRemaining + ')'
        let wl = 'No'
        let captcha = 'No'
        if(typeof item.data !== 'undefined' && item.data != null) {
            if(typeof item.data.collectionName !== 'undefined' && item.data.collectionName != null && item.data.collectionName.length > 0) {
                name = item.data.collectionName
            }
            if(typeof item.data.metadataUrl !== 'undefined' && item.data.metadataUrl != null && item.data.metadataUrl.length > 0) {
                metadataUrl = item.data.metadataUrl
            }
            if(typeof item.data.imageUrl !== 'undefined' && item.data.imageUrl != null && item.data.imageUrl.length > 0) {
                imageUrl = item.data.imageUrl
            }
        }
        if(typeof item.date !== 'undefined' && item.date != null && item.date !== 'Invalid date') {
            date = moment(item.date).utc(false).format(DATETIME_WITH_SECONDS_FORMAT) + ' UTC'
            localDate = moment(item.date).format()
            localDateObject = new Date(localDate)
        }
        if(typeof item.tokenMint !== 'undefined' && item.tokenMint != null && item.tokenMint.length > 0) {
            unit = 'Custom token'
            tokenMint = item.tokenMint
        }
        if(typeof item.whitelistMintSettings !== 'undefined' && item.whitelistMintSettings != null) {
            wl = 'Yes'
        }
        if(typeof item.gatekeeper !== 'undefined' && item.gatekeeper != null) {
            captcha = 'Yes'
        }
        return {
            date,
            localDateObject,
            localDate,
            name,
            metadataUrl,
            imageUrl,
            unit,
            tokenMint,
            supply,
            wl,
            captcha
        }
    }

    const onOnlyVerifiedClick = (value: boolean) => {
        setOnlyVerified(value)
        localStorage.setItem(STORAGE_BOT_ONLY_VERIFIED, value === true ? 'true' : 'false')
    }

    const extractMintAddress = (url: string) => {
        if(isValidHttpUrl(url)) {
            showToast('Parsing website...', 'blue.500')
            postExtractMintSite(url).then((response) => {
                if(response.status === 200) {
                    response.json().then((body) => {
                        const matchPks = body['matchPks']
                        const noMatchPks = body['noMatchPks']
                        setExtractorData({
                            matchPks,
                            noMatchPks
                        })
                        showToast('Done', 'green.500')
                        onExtractorOpen()
                    }).catch((err) => {
 
			console.log("hehrhrh");
                       console.log(err)
                        showToast('Error parsing website', 'red.500')
                    })
                }
            }).catch((err) => {
                console.log(err)
                showToast('Error parsing website', 'red.500')
            })
        } else {
            showToast('Invalid URL', 'red.500')
        }
    }

    const optionStyle = {
        'background': '#131a35',
        'color': 'white'
    }

    const renderExtractorModal = () => {
        if(typeof extractorData !== 'undefined') {
            return (
                <Modal closeOnOverlayClick={false} size={'4xl'} isOpen={isExtractorOpen} onClose={() => {onExtractorModalClose()}} isCentered>
                <ModalOverlay />
                <ModalContent bg={CONTENT_SECTION_HEADER}>
                    <ModalCloseButton color={'white'}/>
                    <ModalBody>
                    {typeof extractorData !== 'undefined' ? 
                    <VStack>
                        <Text as='b' visibility={extractorData.matchPks.length === 0 ? "hidden": "visible"}>ID MATCH:</Text>
                        {extractorData.matchPks.map((pk, i) => {
                            return <Text key={i}>{pk}</Text>
                        })}
                        <Text as='b' visibility={extractorData.noMatchPks.length === 0 ? "hidden": "visible"}>ID WITHOUT MATCH:</Text>
                        {extractorData.noMatchPks.map((pk, i) => {
                            return <Text key={extractorData.matchPks.length + i}>{pk}</Text>
                        })}
                    </VStack>
                    :<></>}
                    </ModalBody>
                </ModalContent>
                </Modal>
            )
        }
    }

    const renderMintModal = () => {
        if(typeof mintData !== 'undefined') {
            const { imageUrl, localDateObject, localDate, date, name, tokenMint, unit, supply, captcha, wl } = getCmDisplayData(mintData)
            return (
                <Modal closeOnOverlayClick={false} size={'4xl'} isOpen={isMintOpen} onClose={() => {onMintModalClose()}} isCentered>
                <ModalOverlay />
                <ModalContent bg={verifiedData.includes(mintData.id) ? 'green.500' : CONTENT_SECTION_HEADER}>
                    <ModalCloseButton color={'white'}/>
                    <ModalBody>
                    {typeof mintData !== 'undefined' ? 
                    <HStack>
                        {mintData?.data?.imageUrl?.length === 0 ?
                            <Image alt='' boxSize='300px' src='https://via.placeholder.com/300'/>
                        :
                            <Image fit='contain' alt='' boxSize='300px' src={imageUrl} fallbackSrc={'https://via.placeholder.com/300'}/>
                        }
                        <VStack w='60%' p={1}>
                            <Flex w='100%'>
                                <Text w='27%' align='right' as='b' mr={3}>ID:</Text>
                                <Tooltip hasArrow label={mintData.id} bg='gray.300' color='black'>
                                    <Text>{mintData.id}</Text>
                                </Tooltip>
                            </Flex>
                            <Flex w='100%'>
                                <Text w='27%' align='right' as='b' mr={3}>DATE:</Text>
                                <Tooltip hasArrow label={localDate} bg='gray.300' color='black'>
                                    <Text>{date}</Text>
                                </Tooltip>
                            </Flex>
                            <Flex w='100%'>
                                <Text w='27%' align='right' as='b' mr={3}>NAME:</Text>
                                <Text>{name}</Text>
                            </Flex>
                            <Flex w='100%'>
                                <Text w='27%' align='right' as='b' mr={3}>PRICE:</Text>
                                <Text mr={1}>{mintData.price}</Text>
                                <Tooltip hasArrow label={tokenMint} bg='gray.300' color='black'>
                                    <Text>{unit}</Text>
                                </Tooltip>
                            </Flex>
                            <Flex w='100%'>
                                <Text w='27%' align='right' as='b' mr={3}>SUPPLY:</Text>
                                <Text mr={1}>{supply}</Text>
                            </Flex>
                            <Flex w='100%'>
                                <Text w='27%' align='right' as='b' mr={3}>CAPTCHA:</Text>
                                <Text mr={1}>{captcha}</Text>
                            </Flex>
                            <Flex w='100%'>
                                <Text w='27%' align='right' as='b' mr={3}>WL:</Text>
                                <Text mr={1}>{wl}</Text>
                            </Flex>
                            {localDateObject ? 
                                <Flex w='100%'>
                                    <Flex w='50%'>
                                        <Countdown
                                            date={localDateObject}
                                            renderer={renderCounter}/>
                                    </Flex>
                                    <Flex w='50%'>
                                        <Text>SOL balance: {balance} SOL</Text>
                                    </Flex>
                                </Flex>
                            :<></>}
                            <HStack w='100%'>
                                <Flex w='100%'>
                                    {candyMachine?.state.gatekeeper &&
                                    wallet.publicKey &&
                                    wallet.signTransaction ? (
                                        <GatewayProvider
                                            wallet={{
                                            publicKey: wallet.publicKey || new anchor.web3.PublicKey(CANDY_MACHINE_PROGRAM),
                                            signTransaction: wallet.signTransaction,
                                            }}
                                            gatekeeperNetwork={candyMachine?.state?.gatekeeper?.gatekeeperNetwork}
                                            clusterUrl={RPC}
                                            options={{ autoShowModal: false }}>
                                            <CaptchaMintButton candyMachine={candyMachine} isMinting={false} onMint={onMintCaptchaClick}/>
                                            <Button onClick={() => { onRefreshClick(mintData) }}>REFRESH</Button>
                                        </GatewayProvider>
                                    ) : (
                                        localStorage.getItem(STORAGE_LEVEL) === 'gold' ?
                                        <>
                                        <Text mr={2} m={2} pt={2}>TXs:</Text>
                                        <Select w='25%' m={2} bg={CONTENT_SECTION_HEADER} borderColor={'white'} color='white' value={numberOfTxs} onChange={(e) => {setNumberOfTxs(parseInt(e.currentTarget.value))}}>
                                            <option style={optionStyle} value='1'>1</option>
                                            <option style={optionStyle} value='2'>2</option>
                                            <option style={optionStyle} value='5'>5</option>
                                            <option style={optionStyle} value='20'>20</option>
                                            <option style={optionStyle} value='50'>50</option>
                                            <option style={optionStyle} value='100'>100</option>
                                        </Select>
                                        <Button onClick={() => { onMintNClick(numberOfTxs) }} m={2}>MINT</Button>
                                        <Button onClick={() => { onRefreshClick(mintData) }} m={2}>REFRESH</Button>
                                        </>
                                        : localStorage.getItem(STORAGE_LEVEL) === 'silver' ?
                                            <>
                                            <Text mr={2} m={2} pt={2}>TXs:</Text>
                                            <Select w='25%' m={2} bg={CONTENT_SECTION_HEADER} borderColor={'white'} color='white' value={numberOfTxs} onChange={(e) => {setNumberOfTxs(parseInt(e.currentTarget.value))}}>
                                                <option style={optionStyle} value='1'>1</option>
                                                <option style={optionStyle} value='2'>2</option>
                                                <option style={optionStyle} value='5'>5</option>
                                            </Select>
                                            <Button onClick={() => { onMintNClick(numberOfTxs) }} m={2}>MINT</Button>
                                            <Button onClick={() => { onRefreshClick(mintData) }} m={2}>REFRESH</Button>
                                            </>
                                        :
                                            <></>
                                    )}
                                </Flex>
                            </HStack>
                        </VStack>
                    </HStack>
                    :<></>}
                    </ModalBody>
                </ModalContent>
                </Modal>
            )
        }
    }

    const renderCounter = ({ days, hours, minutes, seconds, completed }: any) => {
        return (<Text as='b' w='100%' align='center' fontSize={18}>{formatCountdown(days, hours, minutes, seconds)}</Text>);
    };

    const getCmCard = (item: CandyMachineSerialized, key: number): JSX.Element => {
        const { imageUrl, localDate, date, name, tokenMint, unit, supply, captcha, wl } = getCmDisplayData(item)
        return (
            <>
            <WrapItem key={key} w='300px' minW='300px'
                borderRadius='md'
                borderStyle={'solid'}
                borderWidth='2px'
                borderColor={CONTENT_SECTION_HEADER_BORDER}
                boxShadow={'2xl'}
                bg={verifiedData.includes(item.id) ? 'green.500' : ''}>
                <VStack w='100%'>
                    {imageUrl.length === 0 ?
                        <Image alt='' boxSize='300px' src='https://via.placeholder.com/300'/>
                    :
                        <Image alt='' boxSize='300px' src={imageUrl} fallbackSrc={'https://via.placeholder.com/300'}/>
                    }
                    <VStack w='100%' p={1}>
                        <Flex w='100%'>
                            <Text w='27%' align='right' as='b' mr={3}>ID:</Text>
                            <Tooltip hasArrow label={item.id} bg='gray.300' color='black'>
                                <Text>{shortenAddress(item.id, 6)}</Text>
                            </Tooltip>
                        </Flex>
                        <Flex w='100%'>
                            <Text w='27%' align='right' as='b' mr={3}>DATE:</Text>
                            <Tooltip hasArrow label={localDate} bg='gray.300' color='black'>
                                <Text>{date}</Text>
                            </Tooltip>
                        </Flex>
                        <Flex w='100%'>
                            <Text w='27%' align='right' as='b' mr={3}>NAME:</Text>
                            <Text>{name}</Text>
                        </Flex>
                        <Flex w='100%'>
                            <Text w='27%' align='right' as='b' mr={3}>PRICE:</Text>
                            <Text mr={1}>{item.price}</Text>
                            <Tooltip hasArrow label={tokenMint} bg='gray.300' color='black'>
                                <Text>{unit}</Text>
                            </Tooltip>
                        </Flex>
                        <Flex w='100%'>
                            <Text w='27%' align='right' as='b' mr={3}>SUPPLY:</Text>
                            <Text mr={1}>{supply}</Text>
                        </Flex>
                        <Flex w='100%'>
                            <Text w='27%' align='right' as='b' mr={3}>CAPTCHA:</Text>
                            <Text mr={1}>{captcha}</Text>
                        </Flex>
                        <Flex w='100%'>
                            <Text w='27%' align='right' as='b' mr={3}>WL:</Text>
                            <Text mr={1}>{wl}</Text>
                        </Flex>
                        <Button background='white' text='black' onClick={(e) => onMintClick(item, true)}>OPEN</Button>
                    </VStack>
                </VStack>
            </WrapItem>
            </>)
        }

    let rpcValue: string = ''
    if(customRpc != null) {
        rpcValue = customRpc
    }

    return (
        <>
        {renderExtractorModal()}
        {renderMintModal()}
        <VStack spacing='24px' width='100%' pl={12} pr={12}>
            <SectionHeader title='CANDY-MACHINE V2 BOT' width='100%' align='center' fontSize="3xl"/>
            <VStack width='100%' align='center'> 
                <Text as='b' fontSize={'xl'}>DISCLAIMER</Text>
                <Text as='b'>A minting bot is a tool that comes with great risks. If you fall for a honeypot or a scam, Scalp Empire will not be held responsible for your loss. Always use a burner wallet, always charge it with just enough SOL to mint exactly what you want. Our Minting bot will send a lot of transactions per seconds, which can empty your wallet quickly if you don&apos;t have just what you want to buy.</Text>
                <VStack width='100%' align='center'> 
                    <SectionHeader title='CANDY-MACHINES (24 hours timeframe)' width='100%' align='center' fontSize="3xl"/>
                    {localStorage.getItem(STORAGE_LEVEL) === 'gold' ?
                        <HStack w='70%'>
                            <Text mr={2} width='30%' align={'right'}>Custom RPC</Text>
                            <Box w='70%' pl={1}>
                                <TextInput valueArg={''} width='100%' placeholder="HTTP URL" callback={(v) => {setNewCustomRPC(v)}}/>
                            </Box>
                        </HStack> : <></>
                    }
                    <HStack w='70%'>
                        <Text mr={2} width='25%' align={'right'}>Only verified:</Text>
                        <Button width='5%' h='50%' variant='solid' colorScheme={onlyVerified ? 'green' : 'red'} onClick={() => {onOnlyVerifiedClick(!onlyVerified)}}>{onlyVerified ? 'YES' : 'NO'}</Button>
                        <SearchInput width='70%' placeholder="CMv2 ID" callback={(v) => {fetchSpecificCandyMachineV2(v)}}/>
                    </HStack>
                    <HStack w='70%'>
                            <Text mr={2} width='30%' align={'right'}>Mint site extractor</Text>
                            <Box w='70%' pl={1}>
                                <TextInput valueArg={""} width='100%' placeholder="MINT SITE URL" callback={(v) => {extractMintAddress(v)}}/>
                            </Box>
                        </HStack> : <></>
                    <HStack w='70%' >
                        <VStack w='100%' align='center'>
                            <Link fontSize={18} color='white' href='https://nft-scan-me-ui.vercel.app/#/' isExternal>GO TO MAGICEDEN LAUNCHPAD BOT</Link>
                        </VStack>
                    </HStack>
                    <Wrap w='100%' spacing='50px' mt={2}>
                        {data.map((item, i) => {
                            if(onlyVerified) {
                                if(verifiedData.includes(item.id)) {
                                    return getCmCard(item, i)
                                } else {
                                    return <></>
                                }
                            } else {
                                return getCmCard(item, i)
                            }
                        })}
                    </Wrap>
                </VStack>
            </VStack>
        </VStack>
        </>
    )
};

