/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["mongoose", "pdf-parse", "mammoth"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "uploadthing.com" },
    ],
  },
};

export default nextConfig;
