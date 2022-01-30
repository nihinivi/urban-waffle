import { HStack, IconButton, Input, Tooltip } from "@chakra-ui/react";
import React, { useState } from "react";
import { getSearchIcon } from "../icon";


export interface SearchInputProps {
    width: string;
    placeholder?: string;
    callback?: (v: string) => void;
}

export default function SearchInput (props: SearchInputProps) {
    let {
        width,
        placeholder,
        callback,
        ...rest
    } = props;

    const [value, setValue] = useState('');

    const handleSearchNameSubmit = (e) => {
        e.preventDefault();
        if (e.key === "Enter") {
           if(typeof callback !== 'undefined') {
               callback(value)
           }
        }
      };
    
    const handleSearchNameClick = (e) => {
        if(typeof callback !== 'undefined') {
            callback(value)
        }
    };

    return (
        <HStack w={props.width}>
            <Input type="text" size='xl' variant='outline' w='95%' placeholder={placeholder} textColor={'white'} pl={3} ml={2}
                    value={value} 
                    onChange={(e)=> setValue(e.currentTarget.value)}
                    onKeyUp={handleSearchNameSubmit}/>
            <IconButton
                w='5%'
                variant='ghost'
                aria-label=''
                onClick={handleSearchNameClick}
                icon={getSearchIcon()}
                _hover={{}}
                _focus={{}}/>
        </HStack>
    )
};