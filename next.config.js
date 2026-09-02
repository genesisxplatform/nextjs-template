const path = require('path');

const isCodeExport = process.env.CNTRL_BUILD_MODE === 'self-hosted';

// Point LOCAL_SDK_REL_PATH (in .env.local) at a local sdk checkout to develop against its
// source: '@gxpl/sdk' resolves straight to <sdk>/src and Next compiles + hot-reloads it.
// The checkout's own node_modules carries a second react/next/styled-jsx, so while the
// local sdk is active those must resolve to the template's copies.
const localSdkPath = process.env.LOCAL_SDK_REL_PATH;
const sdkDir = localSdkPath ? path.resolve(__dirname, localSdkPath) : null;

const nextConfig = {
  reactStrictMode: false,
  trailingSlash: true,
  output: 'export',
  distDir: '_static',
  assetPrefix: isCodeExport ? './' : undefined,
  ...(sdkDir ? { transpilePackages: ['@gxpl/sdk'] } : {}),
  webpack: (config) => {
    if (sdkDir) {
      for (const dep of ['react', 'react-dom', 'next', 'styled-jsx']) {
        config.resolve.alias[dep] = path.resolve(__dirname, 'node_modules', dep);
      }
      config.resolve.alias['@gxpl/sdk'] = path.resolve(sdkDir, 'src/index.ts');
    }
    return config;
  },
};

module.exports = nextConfig;
