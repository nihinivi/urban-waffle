import * as anchor from '@project-serum/anchor';

import {
  awaitTransactionSignatureConfirmation,
  CandyMachineAccount,
  mintOneToken,
} from './candy-machine';

export function mint(
    connection: anchor.web3.Connection,
    wallet: anchor.Wallet,
    candyMachine: CandyMachineAccount,
    txTimeout: number = 30000
  ) {
    _mint(connection, wallet, candyMachine, txTimeout)
  }

const _mint = async (
    connection: anchor.web3.Connection,
    wallet: anchor.Wallet,
    candyMachine: CandyMachineAccount,
    txTimeout: number = 30000,
  ) => {
    try {
      if (candyMachine?.program && wallet.publicKey) {
        const mintTxId = (await mintOneToken(candyMachine, wallet.publicKey))[0];
        let status: any = { err: true };
        if (mintTxId) {
          status = await awaitTransactionSignatureConfirmation(mintTxId, txTimeout, connection, true);
        }
      }
    } catch (error: any) {
      let message = error.msg || 'Minting failed! Please try again!';
      if (!error.msg) {
        if (!error.message) {
          message = 'Transaction Timeout! Please try again.';
        } else if (error.message.indexOf('0x137')) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf('0x135')) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          window.location.reload();
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }
    }
  };