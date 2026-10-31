import { HimetricaClient } from "@himetrica/tracker-js";
import { env } from "@relay/env/web";

export const himetrica =
  typeof window !== "undefined" && env.VITE_HIMETRICA_API_KEY
    ? new HimetricaClient({
        apiKey: env.VITE_HIMETRICA_API_KEY,
        autoTrackPageViews: true,
        autoTrackErrors: true,
        trackVitals: true,
      })
    : null;
