import { expect, test } from "vitest";
import { publicKeyOf, statusOf, stringToSign, verify } from "./webhook";

// Throwaway self-signed v3 certificate, like the ones SNS signs with. No private key kept.
const CERT = `-----BEGIN CERTIFICATE-----
MIICtjCCAZ6gAwIBAgIJAIk8z0gXXo2IMA0GCSqGSIb3DQEBCwUAMBMxETAPBgNV
BAMMCHNucy10ZXN0MB4XDTI2MTEwMzE2NTgwM1oXDTM2MTAzMTE2NTgwM1owEzER
MA8GA1UEAwwIc25zLXRlc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
AQDbxL/Oye86yTVypKnKkgVNoaBH01B6CbT5ELZpuMB2ZOuWgtSNWmxBTmM4HTC+
TVOdEVBxMfb7q/4tRxPz8vhSx/kS5bDkajHesM1xzjSDZus4Az4yk9BtavgY8WL8
jCVZeiajG6aBa/Vn4VjMFiGdVjGJS/Zi+ijcuRUu/RDyvSDPYR6mzqIWUt44kRQ7
OPW9AXUeKLvfXnu7+LpD7/EYvsG0r5IPwJDfaZopAt78G0qB8BP9E127YDoTRHcD
JkAeUc3hisJPWkUkxhWYQDqpgsVEmd+/bQuX7PB8pbr2v3GLOo7ncD0lUq3Kqc2P
YnnxRtzalG0wbq88uXEAcyWHAgMBAAGjDTALMAkGA1UdEwQCMAAwDQYJKoZIhvcN
AQELBQADggEBAGeERjl7q7PCd7u9uYc01Ax3bQeJRvWVcSlI5eETT/b7cRg7ItgE
tDUsXiLcwPinE7stliVJKh1cVrJJCRwdZ4/jodYFup+lk2K1TxWk5+hjGwUmXPZl
tAkK7p0V8gW4oldoMr01f0fLF2QS0F5lZlmMyFmtmAFIWOlvWGZT4YdlR+PkiLRd
B2bagKdPcyo5LGlMH21LnA8AY5aUkqRxQHPOr0WAJxoqBIHRM212W2hbRA0d+/S9
TFOKFQxh4dXUOqdre66ahT92pfkmZoeUSA6s0ykj9QWmCDR0skOStDv+N09a9uR3
qheGmTidEC7NNJURjmVVbMuq22g4u8fQS4Y=
-----END CERTIFICATE-----`;

// `openssl x509 -pubkey` of CERT.
const SPKI =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA28S/zsnvOsk1cqSpypIFTaGgR9NQegm0+RC2abjAdmTrloLUjVpsQU5jOB0wvk1TnRFQcTH2+6v+LUcT8/L4Usf5EuWw5Gox3rDNcc40g2brOAM+MpPQbWr4GPFi/IwlWXomoxumgWv1Z+FYzBYhnVYxiUv2Yvoo3LkVLv0Q8r0gz2Eeps6iFlLeOJEUOzj1vQF1Hii73157u/i6Q+/xGL7BtK+SD8CQ32maKQLe/BtKgfAT/RNdu2A6E0R3AyZAHlHN4YrCT1pFJMYVmEA6qYLFRJnfv20Ll+zwfKW69r9xizqO53A9JVKtyqnNj2J58Ubc2pRtMG6vPLlxAHMlhwIDAQAB";

const notification = {
  Type: "Notification" as const,
  MessageId: "m-1",
  TopicArn: "arn:aws:sns:us-east-1:1:ses-events",
  Message: '{"eventType":"Delivery"}',
  Timestamp: "2026-11-03T17:00:00.000Z",
  SignatureVersion: "2" as const,
  Signature: "",
  SigningCertURL: "https://sns.us-east-1.amazonaws.com/cert.pem",
};

test("extracts the public key from an X.509 certificate", () => {
  expect(Buffer.from(publicKeyOf(CERT)).toString("base64")).toBe(SPKI);
});

test("signs notifications in AWS field order, skipping a missing Subject", () => {
  expect(stringToSign(notification)).toBe(
    "Message\n{\"eventType\":\"Delivery\"}\nMessageId\nm-1\nTimestamp\n2026-11-03T17:00:00.000Z\nTopicArn\narn:aws:sns:us-east-1:1:ses-events\nType\nNotification\n",
  );
});

test("accepts only AWS-signed messages from an SNS host", async () => {
  const algorithm = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
  const pair = (await crypto.subtle.generateKey(
    { ...algorithm, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
    false,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const signed = new Uint8Array(
    await crypto.subtle.sign(
      algorithm,
      pair.privateKey,
      new TextEncoder().encode(stringToSign(notification)),
    ),
  );
  const message = { ...notification, Signature: Buffer.from(signed).toString("base64") };
  const getKey = async () => pair.publicKey;

  expect(await verify(message, getKey)).toBe(true);
  expect(await verify({ ...message, Message: "{}" }, getKey)).toBe(false);
  expect(
    await verify({ ...message, SigningCertURL: "https://evil.example/sns.amazonaws.com" }, getKey),
  ).toBe(false);
});

test("maps SES events to statuses, ignoring soft bounces", () => {
  const mail = { messageId: "x", destination: ["a@b.c"] };
  expect(statusOf({ eventType: "Delivery", mail })).toBe("delivered");
  expect(statusOf({ eventType: "Bounce", mail, bounce: { bounceType: "Permanent" } })).toBe("bounced");
  expect(statusOf({ eventType: "Bounce", mail, bounce: { bounceType: "Transient" } })).toBeNull();
  expect(statusOf({ eventType: "Send", mail })).toBeNull();
});
