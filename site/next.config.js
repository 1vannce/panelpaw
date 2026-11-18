/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML in out/; scripts/build-web.mjs merges it with the Expo export.
  output: 'export',
  images: { unoptimized: true },
  // site/ sits inside the Expo repo; keep Next from treating the parent as its root.
  turbopack: { root: import.meta.dirname }
};

export default nextConfig;
