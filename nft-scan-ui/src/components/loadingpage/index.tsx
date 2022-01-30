import { CircularProgress, Box } from "@chakra-ui/react";
import React from "react";

export default function LoadingPage () {

    return (
        <>
        <Box>
            <CircularProgress isIndeterminate/>
        </Box>
        </>
    )
};