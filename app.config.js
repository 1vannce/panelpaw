// Extends app.json. The combined web build (scripts/build-web.mjs) sets EXPO_BASE_URL=/app
// so the tracker is served under /app while the landing site (site/) owns /.
// Local dev and native builds leave it unset and keep serving from the root.
export default ({ config }) => {
  const baseUrl = process.env.EXPO_BASE_URL;
  if (!baseUrl) return config;
  return { ...config, experiments: { ...config.experiments, baseUrl } };
};
