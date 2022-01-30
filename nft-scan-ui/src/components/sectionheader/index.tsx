import { InfoIcon } from "@chakra-ui/icons";
import { 
    Box, 
    Text,
    HStack,
    VStack
} from "@chakra-ui/layout";
import { Tooltip } from "@chakra-ui/react";
import React from "react";
import { 
    CONTENT_SECTION_HEADER_BORDER,
    CONTENT_SECTION_HEADER,
} from "../../themes/constants";

export interface SectionHeaderProps {
    id?: string;
    title?: string;
    width?: string;
    align?: string;
    fontSize?: string;
    icon?: boolean;
    tooltip?: string;
    subTitle?: string;
    subTitleFontSize?: string;
}

export default function SectionHeader (props: SectionHeaderProps) {
    let {
        id,
        title,
        width,
        align,
        fontSize,
        icon,
        tooltip,
        subTitle,
        subTitleFontSize,
        ...rest
    } = props;

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
            boxShadow={'2xl'}
            align={props.align}>
            <HStack w='100%' justify='center'>
                <VStack p={0}>
                    <Text
                        id={props.id} 
                        as='b' 
                        fontSize={props.fontSize}>
                            {props.title}
                    </Text>
                    {subTitle ? 
                        <Text
                            fontSize={props.subTitleFontSize}>
                                {props.subTitle}
                        </Text>
                    : 
                        <></>
                    }
                </VStack>
                {icon ? 
                    <Tooltip hasArrow label={tooltip} bg='gray.300' color='black'>
                        <InfoIcon pt={0} color='white'/>
                    </Tooltip>
                :
                <></>
                }
                
            </HStack>
            
        </Box>
        </>
    )
};