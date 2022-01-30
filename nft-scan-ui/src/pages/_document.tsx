import { ColorModeScript } from '@chakra-ui/color-mode';
// eslint-disable-next-line @next/next/no-document-import-in-page
import Document, {
    Html,
    Head,
    Main,
    NextScript,
    DocumentContext,
  } from 'next/document';
import theme from '../themes/theme';
  
  export default class DappDocument extends Document {
    static async getInitialProps(ctx: DocumentContext) {
      const initialProps = await Document.getInitialProps(ctx);
      return { ...initialProps };
    }
  
    render() {
      return (
        <Html lang="en">
          <Head>
            <meta charSet="utf-8" />
            <link
              rel="icon"
              type="image/png"
              sizes="96x96"
              href="/favicon.png"
            />
            <meta name="description" content="Scalp-Empire" />
            <link rel="manifest" href="/manifest.json" />
          </Head>
          <body>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <Main />
            <NextScript />
            <script
              type="text/javascript"
              dangerouslySetInnerHTML={{
                __html: `
                  (function () {
                    var s = document.createElement("script");
                    s.src = "https://stackpile.io/stack_162299.js"; s.async = true;
                    var e = document.getElementsByTagName("script")[0]; e.parentNode.insertBefore(s, e);
                  })();
            `,
              }}
            />
          </body>
        </Html>
      );
    }
  }
  