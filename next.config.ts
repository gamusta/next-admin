import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;

module.exports = {
  allowedDevOrigins: ['localhost.com', '*.localhost.com'],
  images: {
    remotePatterns: [new URL('https://agqwwjrudchuktirggmx.supabase.co/storage/v1/object/public/inbound-invoices/**')],
  },
}
