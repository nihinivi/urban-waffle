import React, { CSSProperties } from "react";
import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Collapse,
  Link,
  useDisclosure,
} from '@chakra-ui/react';
import { 
  HashLink 
} from 'react-router-hash-link';
import {
  HamburgerIcon,
  CloseIcon
} from '@chakra-ui/icons';
import {
  getSocialIcon,
  Social, 
  getAppLogo
} from '../icon';
import {
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from "@solana/wallet-adapter-react";
import { shortenAddress } from '../../utils/utils';
import { 
  COLOR_APPBAR_BG,
  COLOR_APPBAR_BORDER,
  COLOR_APPBAR_WALLET_BG,
  COLOR_TEXT,
  COLOR_TEXT_HOVER
} from '../../themes/constants';

export default function AppBar() {
  const { isOpen, onToggle } = useDisclosure();
  const { connected, publicKey } = useWallet();

  function getWallButtonContent() {
    if(connected && publicKey) {
      return shortenAddress(publicKey.toBase58())
    } else {
      return ''
    }
  }

  const walletBg = COLOR_APPBAR_WALLET_BG

  return (
    <Box 
    zIndex={9999}
    position='sticky'
    top='0'>
      <Flex
        bg={COLOR_APPBAR_BG}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={COLOR_APPBAR_BORDER}
        align={'center'}>
        <Flex
          flex={{ base: 1, md: 'auto' }}
          ml={{ base: -2 }}
          display={{ base: 'flex', md: 'none' }}>
          <IconButton
            onClick={onToggle}
            icon={
              isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
            }
            variant={'ghost'}
            aria-label={'Toggle Navigation'}/>
        </Flex>
        <Flex flex={{ base: 1, md: 'auto' }} justify={{ base: 'left', md: 'start' }}>
          {getAppLogo('42px')}
          <Flex display={{ base: 'none', md: 'flex' }} ml={5} pt='1'>
            <DesktopNav />
            <b><Link as={HashLink} to='/' textColor='white' fontSize={19}>SCALP EMPIRE</Link></b>
            <Text as={'i'} textColor='white' fontSize={12} ml={2}>Beta</Text>
          </Flex>
        </Flex>
        
        <Stack
          flex={{ base: 1, md: 0 }}
          direction={'row'}
          spacing={0}
          paddingRight='1'>
          <IconButton
            as='a'
            variant='ghost'
            aria-label='twitter'
            target="_blank"
            href='https://twitter.com/ScalpEmpireNFT'
            icon={getSocialIcon(Social.Twitter)}
            _hover={{}}
            _focus={{}}/>
          <IconButton
            as='a'
            variant='ghost'
            aria-label='discord'
            target="_blank"
            href='https://discord.gg/WchB6nY8j7'
            icon={getSocialIcon(Social.Discord)}
            _hover={{}}
            _focus={{}}/>
        </Stack>
        <WalletMultiButton style={{
            fontSize: '14px',
            fontWeight: 600,
            backgroundColor: walletBg,
            color: 'white',
          }}>
            {getWallButtonContent()}
          </WalletMultiButton>
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <MobileNav />
      </Collapse>
    </Box>
  );
}

const DesktopNav = () => {

  const linkColor = COLOR_TEXT
  const linkHoverColor = COLOR_TEXT_HOVER

  return (
    <Stack direction={'row'} spacing={4}>
      {NAV_ITEMS.map((navItem) => (
        <Box key={navItem.label}>
          {
          <Link
            as={HashLink}
            to={navItem.href} 
            fontSize={'sm'}
            fontWeight={600}
            color={linkColor}
            _hover={{
              textDecoration: 'none',
              color: linkHoverColor,
            }}>
            {navItem.label}
          </Link>
          }
        </Box>
      ))}
    </Stack>
  );
};

const MobileNav = () => {
  return (
    <Stack
      bg={COLOR_APPBAR_BG}
      p={4}
      display={{ md: 'none' }}>
      {NAV_ITEMS.map((navItem) => (
        <MobileNavItem key={navItem.label} {...navItem} />
      ))}
    </Stack>
  );
};

const MobileNavItem = ({ label, href }: NavItem) => {
  
  const linkColor = COLOR_TEXT
  const linkHoverColor = COLOR_TEXT_HOVER

  return (
    <Stack spacing={4}>
      <Flex
        py={2}
        as={HashLink}
        to={href}
        justify={'space-between'}
        align={'center'}
        _hover={{
          textDecoration: 'none',
        }}>
        <Text
          fontWeight={500}
          _hover={{
            textDecoration: 'none',
            color: linkHoverColor,
          }}
          color={linkColor}>
          {label}
        </Text>
      </Flex>
    </Stack>
  );
};

interface NavItem {
  label: string;
  href?: string;
}

const NAV_ITEMS: Array<NavItem> = [
  /* {
    label: 'Home',
    href: '/#home',
  }, */
];