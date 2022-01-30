import { HStack, IconButton, Input } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { getCheckMarkIcon } from "../icon";


export interface TextInputProps {
    width: string;
    valueArg: string;
    placeholder?: string;
    callback?: (v: string) => void;
}

export default function TextInput (props: TextInputProps) {
    let {
        width,
        valueArg,
        placeholder,
        callback,
        ...rest
    } = props;

    useEffect(() => {
        if(typeof props.valueArg !== 'undefined' && props.valueArg.length > 0) {
            setValue(props.valueArg)
        }
    }, [])

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
                icon={getCheckMarkIcon()}
                _hover={{}}
                _focus={{}}/>
        </HStack>
    )
};