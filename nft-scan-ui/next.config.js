const withTM = require('next-transpile-modules')([
  //add package with 'Global CSS cannot be imported from within node_modules.' here
  '@blocto/sdk',
  '@project-serum/sol-wallet-adapter',
  '@solana/wallet-adapter-base',
  '@solana/wallet-adapter-react',
  '@solana/wallet-adapter-wallets',
  '@solana/wallet-adapter-react-ui',
  '@solana/wallet-adapter-phantom',
  '@solana/wallet-adapter-sollet',
]);

module.exports = withTM({
  cssModules: true,
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/:any*',
        destination: '/',
      },
    ];
  },
});