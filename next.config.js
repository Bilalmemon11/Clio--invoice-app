/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
  },
  images: {
    domains: ['app.clio.com'],
  },
}

module.exports = nextConfig
