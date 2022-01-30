import { 
    Box, 
    Text,
    HStack
} from "@chakra-ui/layout";
import { IconButton, Tooltip } from "@chakra-ui/react";
import React from "react";
import { 
    CONTENT_SECTION_HEADER_BORDER,
    CONTENT_SECTION_HEADER,
} from "../../themes/constants";
import { shortenAddress } from "../../utils/utils";
import { getMagicEdenLogo, getSocialIcon, getWebsiteIcon, Social } from "../icon";

export interface CollectionHeaderProps {
    width?: string;
    name?: string;
    mintPrice?: string;
    mintDate?: string;
    listed?: string;
    volume?: number;
    volume24hr?: number;
    avgSalesMin?: string;
    meUrl?: string;
    websiteUrl?: string;
    twitterUrl?: string;
    discordUrl?: string;
    fees?: string;
    creator?: string;
}

export default function CollectionHeader (props: CollectionHeaderProps) {
    let {
        width,
        name,
        mintPrice,
        mintDate,
        listed,
        volume,
        volume24hr,
        meUrl,
        websiteUrl,
        twitterUrl,
        discordUrl,
        fees,
        creator,
        ...rest
    } = props;

    const nameSize = '3xl'
    const subNameSize = '15px'
    const subNameValueSize = '15px'
    return (
        <>
        <Box
            mt={'10px'}
            bg={CONTENT_SECTION_HEADER}
            w={props.width}
            borderRadius='md'
            borderStyle={'solid'}
            borderWidth='2px'
            borderColor={CONTENT_SECTION_HEADER_BORDER}
            boxShadow={'2xl'}>
            <HStack w='100%' pl={2} pr={2} spacing={3} justify={'center'}>
                <Text
                    as='b' 
                    fontSize={nameSize}
                    mb={1}>
                        {props.name}
                </Text>
                <HStack>
                    {meUrl ?
                        <IconButton
                            as='a'
                            _hover={{}}
                            _focus={{}}
                            variant='ghost'
                            aria-label='Magic-Eden'
                            target="_blank"
                            href={meUrl?.toString()}
                            icon={getMagicEdenLogo('36px')}/>
                        :
                        <></>
                    }
                    {twitterUrl ?
                        <IconButton
                            as='a'
                            _hover={{}}
                            _focus={{}}
                            variant='ghost'
                            aria-label='Website'
                            target="_blank"
                            href={twitterUrl?.toString()}
                            icon={getSocialIcon(Social.Twitter, '24px')}/>
                        :
                        <></>
                    }
                    {discordUrl ?
                        <IconButton
                            as='a'
                            _hover={{}}
                            _focus={{}}
                            variant='ghost'
                            aria-label='Discord'
                            target="_blank"
                            href={discordUrl?.toString()}
                            icon={getSocialIcon(Social.Discord, '24px')}/>
                        :
                        <></>
                    }
                    {websiteUrl ?
                        <IconButton
                            as='a'
                            _hover={{}}
                            _focus={{}}
                            variant='ghost'
                            aria-label='Website'
                            target="_blank"
                            href={websiteUrl?.toString()}
                            icon={getWebsiteIcon('24px')}/>
                        :
                        <></>
                    }
                </HStack>
                <HStack>
                    <Text
                        as='b' 
                        fontSize={subNameSize}>
                            Mint price:
                    </Text>
                    <Text
                        fontSize={subNameValueSize}>
                            {mintPrice}
                    </Text>
                </HStack>
                <HStack>
                    <Text
                        as='b' 
                        fontSize={subNameSize}>
                            Mint date:
                    </Text>
                    <Text
                        fontSize={subNameValueSize}>
                            {mintDate}
                    </Text>
                </HStack>
                <HStack>
                    <Text
                        as='b' 
                        fontSize={subNameSize}>
                            Volume:
                    </Text>
                    <Text
                        fontSize={subNameValueSize}>
                            {volume}
                    </Text>
                </HStack>
                <HStack>
                    <Text
                        as='b' 
                        fontSize={subNameSize}>
                            Volume 24hr:
                    </Text>
                    <Text
                        fontSize={subNameValueSize}>
                            {volume24hr}
                    </Text>
                </HStack>
                <HStack>
                    <Text
                        as='b' 
                        fontSize={subNameSize}>
                            Fees:
                    </Text>
                    <Text
                        fontSize={subNameValueSize}>
                            {fees}
                    </Text>
                </HStack>
            </HStack>
        </Box>
        </>
    )
};