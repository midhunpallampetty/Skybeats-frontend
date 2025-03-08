/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
<<<<<<< HEAD
    domains: ['images.unsplash.com','airline-datace.s3.ap-south-1.amazonaws.com'],
=======
    domains: ['images.unsplash.com,','airline-datace.s3.ap-south-1.amazonaws.com'],
>>>>>>> 97fc021 (test commit after ui animation)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'airline-datacenter.s3.ap-south-1.amazonaws.com',
        port: '', // Leave empty for no specific port
        pathname: '/**', // Allow all paths from this domain
      },
      {
        protocol: 'https',
        hostname: 'images2.alphacoders.com',
        port: '', // Leave empty for no specific port
        pathname: '/**', // Allow all paths from this domain
      },
    ],
      
  },
};

export default nextConfig;
