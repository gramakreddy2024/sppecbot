/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep pdf-parse as a server-only package (never bundled for the browser)
  serverExternalPackages: ['pdf-parse'],
  // Use Turbopack (default in Next.js 16) — no webpack config needed
  turbopack: {},
};

export default nextConfig;
