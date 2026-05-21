const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

const trimTrailingSlash = (value: string) => value.replace(/\/$/, "");

const isLocalUrl = (value: string) => {
  try {
    const { hostname } = new URL(value);
    return ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname);
  } catch {
    return false;
  }
};

const isRunningLocally = () => {
  if (typeof window === "undefined") return true;
  return ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(window.location.hostname);
};

const isServerlessHost = (value: string) => {
  try {
    const { hostname } = new URL(value);
    return /vercel\.app$/i.test(hostname);
  } catch {
    return false;
  }
};

export const resolveRealtimeUrl = () => {
  const configuredWsUrl = import.meta.env.VITE_WS_URL as string | undefined;

  if (configuredWsUrl && (isRunningLocally() || !isLocalUrl(configuredWsUrl))) {
    return trimTrailingSlash(configuredWsUrl);
  }

  try {
    const url = new URL(API_URL);
    url.pathname = url.pathname.replace(/\/api\/?$/, "");
    url.search = "";
    url.hash = "";
    return trimTrailingSlash(url.toString());
  } catch {
    return configuredWsUrl ? trimTrailingSlash(configuredWsUrl) : "http://localhost:8000";
  }
};

export const isRealtimeEnabled = () => {
  if (import.meta.env.VITE_DISABLE_REALTIME === "true") return false;

  const configuredWsUrl = import.meta.env.VITE_WS_URL as string | undefined;
  if (configuredWsUrl && isServerlessHost(configuredWsUrl)) return false;
  if (isServerlessHost(API_URL)) return false;

  const realtimeUrl = resolveRealtimeUrl();
  if (isServerlessHost(realtimeUrl)) return false;

  return true;
};
