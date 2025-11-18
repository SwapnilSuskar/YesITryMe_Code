import { HttpsProxyAgent } from "https-proxy-agent";

let cachedAgent;
let cachedProxyUrl;

const buildFixieUrl = () => {
  const fullUrl = process.env.FIXIE_URL;
  if (fullUrl) return fullUrl;

  const host = process.env.FIXIE_HOST || process.env.FIXIE_SOCKS_HOST;
  const port = process.env.FIXIE_PORT || process.env.FIXIE_SOCKS_PORT;
  const username =
    process.env.FIXIE_USERNAME || process.env.FIXIE_SOCKS_USERNAME;
  const password =
    process.env.FIXIE_PASSWORD || process.env.FIXIE_SOCKS_PASSWORD;

  if (host && port && username && password) {
    return `http://${encodeURIComponent(username)}:${encodeURIComponent(
      password
    )}@${host}:${port}`;
  }

  return undefined;
};

const resolveProxyUrl = () => {
  return (
    process.env.STATIC_EGRESS_PROXY_URL ||
    process.env.QUOTAGUARDSTATIC_URL ||
    process.env.QUOTAGUARD_STATIC_URL ||
    process.env.QUOTAGUARD_URL ||
    process.env.QUOTAGUARD_ENDPOINT ||
    buildFixieUrl()
  );
};

export const getStaticEgressProxyConfig = () => {
  const proxyUrl = resolveProxyUrl();

  if (!proxyUrl) {
    return {};
  }

  if (!cachedAgent || cachedProxyUrl !== proxyUrl) {
    cachedAgent = new HttpsProxyAgent(proxyUrl);
    cachedProxyUrl = proxyUrl;
  }

  return {
    httpAgent: cachedAgent,
    httpsAgent: cachedAgent,
    proxy: false,
  };
};
