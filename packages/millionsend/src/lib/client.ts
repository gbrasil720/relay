import { env } from "@relay/env/server";
import { MillionSend } from "millionsend";

const apiKey = env.MILLIONSEND_API_KEY;
const baseUrl = env.MILLIONSEND_BASE_URL;

if (!apiKey) {
  throw new Error("MILLIONSEND_API_KEY is required to send email");
}

export const millionsend = new MillionSend(apiKey, {
  baseUrl: baseUrl ?? "https://api.millionsend.com",
  // The SDK calls fetch as a method, which Workers reject on the bare global.
  fetch: ((input, init) => fetch(input, init)) as typeof fetch,
});
