import Constants from "expo-constants";

type EnvVars = {
  SPACETIMEDB_HOST: string;
  SPACETIMEDB_DB_NAME: string;
  APP_NAME: string;
  BLUESKY_PUBLIC_API: string;
};

const defaults: EnvVars = {
  SPACETIMEDB_HOST: "wss://maincloud.spacetimedb.com",
  SPACETIMEDB_DB_NAME: "thamizh-chat",
  APP_NAME: "Thamizh",
  BLUESKY_PUBLIC_API: "https://public.api.bsky.app",
};

function getEnv(): EnvVars {
  const extra = Constants.expoConfig?.extra ?? {};
  return {
    SPACETIMEDB_HOST:
      process.env.EXPO_PUBLIC_SPACETIMEDB_HOST ??
      (extra.spacetimedbHost as string) ??
      defaults.SPACETIMEDB_HOST,
    SPACETIMEDB_DB_NAME:
      process.env.EXPO_PUBLIC_SPACETIMEDB_DB_NAME ??
      (extra.spacetimedbDbName as string) ??
      defaults.SPACETIMEDB_DB_NAME,
    APP_NAME:
      process.env.EXPO_PUBLIC_APP_NAME ??
      (extra.appName as string) ??
      defaults.APP_NAME,
    BLUESKY_PUBLIC_API:
      process.env.EXPO_PUBLIC_BLUESKY_PUBLIC_API ??
      (extra.blueskyPublicApi as string) ??
      defaults.BLUESKY_PUBLIC_API,
  };
}

export const env = getEnv();
