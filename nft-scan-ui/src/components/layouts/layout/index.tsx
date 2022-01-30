import { 
    Box, 
    Text 
} from "@chakra-ui/layout";
import { 
    CONTENT_PADDING,
} from '../../../themes/constants';
  
export default function Layout ({ children }) {
    return (
        <>
        <Box p={CONTENT_PADDING}>
            {children}
        </Box>
        </>
    )
};
  