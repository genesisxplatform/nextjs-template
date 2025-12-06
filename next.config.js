const isCodeExport = process.env.CNTRL_BUILD_MODE === 'self-hosted';

const nextConfig = {
  reactStrictMode: false,
  trailingSlash: true,
  assetPrefix: isCodeExport ? './' : undefined,
};

module.exports = nextConfig;
