import { extendTheme, ThemeConfig } from "@chakra-ui/react"
import { COLOR_BG } from "./constants";

const config : ThemeConfig = {
  useSystemColorMode: false,
}

const styles = {
  global: (props) => ({
    body: {
      bg: COLOR_BG,
    },
    p: {
      color: 'white',
    },
    th: {
      color: 'white',
    },
    td: {
      color: 'white',
    },
    b: {
      color: 'white',
    },
    a: {
      color: 'white',
    },
    span: {
      color: 'white',
    },
  }),
};

const theme = extendTheme({ config, styles })
export default theme