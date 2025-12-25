/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',              // ये सबसे important है
  images: {
    unoptimized: true,           // static export के लिए ज़रूरी
  },
  trailingSlash: true,           // links properly work करेंगे
  distDir: 'out',                // default ही है, optional
};

export default nextConfig;
