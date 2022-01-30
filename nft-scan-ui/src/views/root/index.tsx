import React, { useEffect, useState } from "react";
import { 
  Box, 
  Flex
} from "@chakra-ui/layout";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
/* import { isWalletAuthorized } from "../../api/api"; */
import ConnectWallet from "../../components/connectwallet";
import UnauthorizedWallet from "../../components/unauthorizedwallet";
import LoadingPage from "../../components/loadingpage";
import { MODULE_ANALYTIC, MODULE_AUTO_BUY, MODULE_HOMEPAGE, MODULE_MINT_BOT, STORAGE_LEVEL } from "../../constants";
import { AssetHoldResult, verifyHolder } from "../../utils/solana/solana";

export interface RootViewProps {
  content: JSX.Element;
  module: number;
}

export const RootView = (props: RootViewProps) => {
  let {
    content,
    module,
    ...rest
  } = props;

  const { connected, publicKey } = useWallet()
  const [walletHasAccess, setWalletHasAccess] = useState<Boolean>(false)
  const [isLoading, setIsLoading] = useState<Boolean>(true)

  const connection = useConnection().connection

  const initStorage = () => {
    const level = localStorage.getItem(STORAGE_LEVEL)
    if(level == null) {
      localStorage.setItem(STORAGE_LEVEL, 'none')
    }
  }

  useEffect(() => {
    initStorage()
    if(module === MODULE_HOMEPAGE) {
      setWalletHasAccess(true)
      setIsLoading(false)
    } else {
      if(connected) {
        setIsLoading(true)
        verifyHolder(connection, publicKey?.toBase58()).then((response: AssetHoldResult) => {
            if(response.status === 'OK') {
              const level = response.level
              if(module === MODULE_ANALYTIC) {
                if(level === 'gold') {
                  setWalletHasAccess(true)
                }
              } else if(module === MODULE_MINT_BOT) { 
                if(level === 'gold' || level === 'silver') {
                  setWalletHasAccess(true)
                }
              } else if(module === MODULE_AUTO_BUY) { 
                if(level === 'gold' || level === 'silver' || level === 'bronze') {
                  setWalletHasAccess(true)
                }
              } else {
                setWalletHasAccess(false)
              }
              localStorage.setItem(STORAGE_LEVEL, level)
              setIsLoading(false)
            } else {
              setWalletHasAccess(false)
              setIsLoading(false)
            }
        }).catch(() => {
          setWalletHasAccess(false)
          setIsLoading(false)
        })
      } else {
        localStorage.setItem(STORAGE_LEVEL, 'none')
        setWalletHasAccess(false)
        setIsLoading(false)
      }
    }
  }, [connected, publicKey]);


  return (
    <Box width='100%' height='100%'>
      <Flex w='auto' wrap='wrap' justify='center' mt='4'>
      {module === MODULE_HOMEPAGE ?
        props.content
        :
        !connected ?
            <ConnectWallet/>
            : isLoading ?
              <LoadingPage/>
              : !true ?
                <UnauthorizedWallet/>
              :
                props.content
        }
      </Flex>
     
    </Box>
  );
};
