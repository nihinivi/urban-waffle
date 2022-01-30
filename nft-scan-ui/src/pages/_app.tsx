import { ChakraProvider, CSSReset } from "@chakra-ui/react"
import type { AppProps } from 'next/app';
import Head from 'next/head';
import theme from "../themes/theme";


export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Scalp-Empire</title>
      </Head>
      <div id="root">
        <ChakraProvider theme={theme}>
          <CSSReset />
          <Component {...pageProps} />
        </ChakraProvider>
      </div>
    </>
  );
}