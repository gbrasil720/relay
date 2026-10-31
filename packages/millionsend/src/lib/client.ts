import { env } from "@relay/env/server";
import { MillionSend } from "millionsend";

const apiKey = env.MILLIONSEND_API_KEY;
const baseUrl = env.MILLIONSEND_BASE_URL;

export const millionsend = new MillionSend(apiKey, {
  baseUrl: baseUrl ?? "https://api.millionsend.com",
});
