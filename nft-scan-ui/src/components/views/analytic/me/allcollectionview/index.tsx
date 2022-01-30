import React, { useEffect, useState } from "react";
import { Divider, Flex, HStack, Text, VStack, Link, IconButton } from "@chakra-ui/react";
import { Collection } from "../../../../../models/collection";
import SectionHeader from "../../../../sectionheader";
import { formatUTCTimestamp } from "../../../../../utils/date";
import { getMeCollectionAll } from "../../../../../api/api";
import SearchInput from "../../../../search";
import LoadingPage from "../../../../loadingpage";
import { getAppLogo, getMagicEdenLogo } from "../../../../icon";

export default function MeAllCollectionMainView () {
    const [data, setData] = useState<Array<Collection>>([])
    const [isLoading, setIsLoading] = useState(true);

    const fetchMeAllCollections = (search: string) => {
      setIsLoading(true)
      getMeCollectionAll(search).then((response) => {
          if(response.status == 200) {
              response.json().then((body) => {
                  setData(body['collections'])
              }).catch(() => {

              })
          }
      }).catch(() => {

      }).finally(() => {
          setIsLoading(false)
      })
  }

    useEffect(() => {
      fetchMeAllCollections('')
    }, [])

    return (
        <VStack spacing='0px' h='100%' width='90%' m={2}>
            <SectionHeader title="MAGIC-EDEN COLLECTIONS" align='center' fontSize="2xl" width="100%"/>
            <Flex w='auto' h='20px' wrap='wrap' justify='center' mt='4'>
              {isLoading ?
                <LoadingPage/>
                : <></>
              }
            </Flex>
            <HStack w='100%' pt={2}>
              <Flex width='3%'>
              <Text as='b' w='100%' textAlign={'right'}>#</Text>
              </Flex>
              <Flex width='20%'>
                <Text as='b' w='100%'>NAME</Text>
              </Flex>
              <Flex width='10%'>
                <Text as='b' w='100%'>TIME</Text>
              </Flex>
              <Flex width='5%'>
                
              </Flex>
              <Flex width='5%'>

              </Flex>
              <Flex width='57%'>
                <Text as='b' w='100%'></Text>
              </Flex>
            </HStack>
            <Flex width='100%' pt={2}>
              <Flex width='3%'>
                
              </Flex>
              <Flex width='20%'>
                <SearchInput width='100%' placeholder="search" callback={(v) => {fetchMeAllCollections(v)}}/>
              </Flex>
              <Flex width='10%'>

              </Flex>
              <Flex width='5%'>

              </Flex>
              <Flex width='5%'>

              </Flex>
              <Flex width='57%'>

              </Flex>
            </Flex>
            {data?.map((item, i) => {
              return (
                <>
                <HStack key={i} w='100%' pt={2} pb={2}>
                  <Flex width='3%'>
                    <Text w='100%' textAlign={'right'}>{i+1}</Text>
                  </Flex>
                  <Flex width='20%'>
                    <Link w='100%' color='white' href={'#/collection/me?collectionId=' + item?.id} isExternal={true}>{item?.name}</Link>
                  </Flex>
                  <Flex width='10%'>
                    <Text w='100%'>{formatUTCTimestamp(Date.parse(item?.createdAt))}</Text>
                  </Flex>
                  <Flex width='5%'>
                    <IconButton
                      w='20%'
                      as='a'
                      _hover={{}}
                      _focus={{}}
                      variant='ghost'
                      aria-label='Magic-Eden'
                      target="_blank"
                      href={'https://magiceden.io/marketplace/' + item?.symbol}
                      icon={getMagicEdenLogo("36px")}/>
                  </Flex>
                  <Flex width='5%'>
                    <IconButton
                      w='20%'
                      as='a'
                      _hover={{}}
                      _focus={{}}
                      _selection={{}}
                      variant='ghost'
                      aria-label='Trade'
                      target="_blank"
                      href={'#/collection/me?collectionId=' + item?.id}
                      icon={getAppLogo("36px")}/>
                  </Flex>
                  <Flex width='57%'>
                    <Text w='100%'></Text>
                  </Flex>
                </HStack>
                <Divider/>
                </>
              )
            })}
        </VStack>
    );
};
