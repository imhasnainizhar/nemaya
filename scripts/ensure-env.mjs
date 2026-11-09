#!/usr/bin/env node
// Creates .env.docker from .env.docker.example on first run and fills in
// random secrets + a VAPID key pair. Existing files are never overwritten.
import { createECDH, randomBytes } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const target = join(root, ".env.docker")
const example = join(root, ".env.docker.example")

if (existsSync(target)) {
  console.log("✓ .env.docker already exists — leaving it untouched")
  process.exit(0)
}

const b64url = (buf) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
const ecdh = createECDH("prime256v1")
ecdh.generateKeys()
const vapidPublic = b64url(ecdh.getPublicKey())
const vapidPrivate = b64url(ecdh.getPrivateKey())

let out = readFileSync(example, "utf8")
out = out
  .replace("VAPID_PUBLIC_KEY=__GENERATE__", `VAPID_PUBLIC_KEY=${vapidPublic}`)
  .replace("VAPID_PRIVATE_KEY=__GENERATE__", `VAPID_PRIVATE_KEY=${vapidPrivate}`)
  .replace("NEXT_PUBLIC_VAPID_PUBLIC_KEY=__COPY_VAPID_PUBLIC__", `NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidPublic}`)
  .replace(/=__GENERATE__/g, () => `=${randomBytes(32).toString("hex")}`)

writeFileSync(target, out)
console.log("✓ created .env.docker with fresh secrets and VAPID keys")
