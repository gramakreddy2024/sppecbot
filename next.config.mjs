/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep PDF libraries as server-only — never bundled for the browser
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'pdf2json'],
  // Use Turbopack (default in Next.js 16) — no webpack config needed
  turbopack: {},
};

export default nextConfig;
