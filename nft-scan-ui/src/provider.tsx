import { FC } from 'react';
import WalletConnectionProvider from './components/providers/walletconnectionprovider/index';

export const Providers: FC = ({ children }) => {
    return (
        <WalletConnectionProvider>
            {children}
        </WalletConnectionProvider>
    )
};
