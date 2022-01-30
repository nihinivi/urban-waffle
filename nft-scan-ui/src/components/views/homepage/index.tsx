import { Text, VStack, Link, Button, IconButton, HStack, Wrap, WrapItem, Spacer } from "@chakra-ui/react";
import React from "react";
import SectionHeader from "../../sectionheader";
import { CONTENT_SECTION_HEADER_BORDER } from "../../../themes/constants";
import { getMagicEdenLogo } from "../../icon";

export default function HomepageView () {
    
    interface Module {
        title: string,
        description: JSX.Element,
        href: string,
        me: string
    }

    const MODULES: Array<Module> = [
        {
            title: "ANALYTICS",
            description: (
                <>
                <Text w='100%'>Monitoring tool for Trading NFT.</Text>
                <Text w='100%' pt={6}>Floor chart, listing chart, big sales pictures, prices analyses, minting date, minting price, average sales/min... Everything you need is in our monitoring tool.</Text>
                <Text w='100%' pt={6}>Only for the golden holder.</Text>
                </>
            ),
            href: '#/analytics',
            me: 'https://www.magiceden.io/marketplace/scalp_empire_gold_edition'
        },
        {
            title: "MINT BOT",
            description: (
                <>
                <Text w='100%'>Candy-Machine V2 and Magic-Eden launchpad minting bot.</Text>
                <Text w='100%' pt={6}>Golden holder: unlimited TX, no cooldown, custom RPC.</Text>
                <Text w='100%'>Silver holder: 5TX MAX, 3sec cooldown.</Text>
                <Text w='100%' pt={6}>Only for the golden and silver holder.</Text>
                </>
            ),
            href: '#/bot',
            me: '#/'
        },
        {
            title: "AUTO BUY",
            description: (
                <>
                <Text>Coming soon</Text>
                </>
            ),
            href: '#/',
            me: '#/'
        }
    ]

    return (
        <>
        <VStack spacing='24px' width='100%' pl={12} pr={12}>
            <SectionHeader title='SCALP EMPIRE' width='100%' align='center' fontSize="3xl"/>
            <Wrap w='100%'>
                {
                    MODULES.map((item, i) => {
                        return (
                            <>
                            <WrapItem key={i} w='32%' h='400px'
                                borderRadius='md'
                                borderStyle={'solid'}
                                borderWidth='2px'
                                borderColor={CONTENT_SECTION_HEADER_BORDER}
                                boxShadow={'2xl'}>
                                <VStack w='100%' h='100%' m={2}>
                                    <Text as='b' w='100%' h='15%' textAlign={'center'} fontSize={'2xl'}>{item.title}</Text>
                                    <VStack w='100%' h='60%'>{item.description}</VStack>
                                    <HStack w='100%' h='5%'>
                                        <Text fontSize={'m'}>Buy on</Text>
                                        <IconButton
                                            h='5%'
                                            as='a'
                                            _hover={{}}
                                            _focus={{}}
                                            variant='ghost'
                                            aria-label='Magic-Eden'
                                            target="_blank"
                                            href={item.me}
                                            icon={getMagicEdenLogo("42px")}/>
                                    </HStack>
                                    <Link w='100%' h='15%' textAlign={'center'} textColor='white' fontSize={'2xl'} href={item.href}><b>GO</b></Link>
                                </VStack>
                            </WrapItem>
                            { i < 2 ? <Spacer/> : <></> }
                            </>
                        )
                    })
                }
            </Wrap>
        </VStack>
        </>
    )
};

