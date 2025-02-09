/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['api.placeholder.com'],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**',
        },
      ],
    },
  };
  
  export default nextConfig;