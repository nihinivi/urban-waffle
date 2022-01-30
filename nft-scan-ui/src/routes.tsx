import { Button } from "@chakra-ui/button";
import { Box, Text } from "@chakra-ui/layout";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { HashRouter, Route, Switch } from "react-router-dom";
import AppBar from "./components/appbar";
import Layout from "./components/layouts/layout";
import HomepageView from "./components/views/homepage";
import MeCollectionMainView from "./components/views/analytic/me/mecollectionview";
import MeAllCollectionMainView from "./components/views/analytic/me/allcollectionview";
import { Providers } from "./provider";
import { RootView } from "./views/root";
import MainMintBotView from "./components/views/mintbot";
import { MODULE_ANALYTIC, MODULE_HOMEPAGE, MODULE_MINT_BOT } from "./constants";
import MainAnalyticView from "./components/views/analytic/mainanalyticview";

function errorFallback({error, resetErrorBoundary}) {
  return (
    <Box p="4">
      <Text fontSize='25px' as='b'>Something went wrong</Text>
      <Text color='red' mt='4'>{error.message}</Text>
      <Button mt='8' onClick={
          () => {
            window.location.reload();
          }
        }>
        Try again
      </Button>
    </Box>
  )
}

export function Routes() {
  return (
    <ErrorBoundary FallbackComponent={errorFallback} >
      <HashRouter basename={"/"}>
        <Providers>
          <div id='home'></div>
          <AppBar />
          <Switch>
            <Layout>
              <Route exact path="/" component={() => <RootView content={HomepageView()} module={MODULE_HOMEPAGE}/>} />
              <Route exact path="/analytics" component={() => <RootView content={MainAnalyticView()} module={MODULE_ANALYTIC}/>} />
              <Route exact path="/collection/me" component={() => <RootView content={MeCollectionMainView()} module={MODULE_ANALYTIC}/>} />
              <Route exact path="/collection/me/all" component={() => <RootView content={MeAllCollectionMainView()} module={MODULE_ANALYTIC}/>} />
              <Route exact path="/bot" component={() => <RootView content={MainMintBotView()} module={MODULE_MINT_BOT}/>} />
            </Layout>
          </Switch>
        </Providers>
      </HashRouter>
    </ErrorBoundary>
  );
}
