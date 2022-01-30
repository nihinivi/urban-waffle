import React from 'react'
import { Image } from '@chakra-ui/image'
export enum Social {
    Twitter = 'twitter',
    Discord = 'discord'
}

export function getSocialIcon(social: Social, boxSize: string = '18px') {
    if(social === Social.Discord) {
      return <Discord boxSize={boxSize}/>;
    } else if(social === Social.Twitter) {
        return <Twitter boxSize={boxSize}/>;
    }
    throw new Error("Invalid social");
}

export function getAppLogo(boxSize: string) {
    let src = 'logo.png'
    return  (
        <Image boxSize={boxSize} alt='app_logo' src={src}/>
    )
}

function Twitter({boxSize}) {
    let src = 'twitter.svg'
    return  (
        <Image boxSize={boxSize} alt='t' src={src}/>
    )
}

function Discord({boxSize}) {
    let src = 'discord.svg'
    return  (
        <Image boxSize={boxSize} alt='d' src={src}/>
    )
}

export function getSearchIcon() {
    let src = 'search.svg'
    return  (
        <Image boxSize={'24px'} alt='detail' src={src}/>
    )
}

export function getCheckMarkIcon() {
    let src = 'check-mark.png'
    return  (
        <Image boxSize={'24px'} alt='check' src={src}/>
    )
}

export function getMagicEdenLogo(boxSize: string) {
    let src = 'me_logo.png'
    return  (
        <Image boxSize={boxSize} alt='me' src={src}/>
    )
}

export function getWebsiteIcon(boxSize: string) {
    let src = 'web.png'
    return  (
        <Image boxSize={boxSize} alt='w' src={src}/>
    )
}