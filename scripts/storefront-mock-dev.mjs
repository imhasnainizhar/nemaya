#!/usr/bin/env node
// Runs the storefront on the host with an in-memory mock of the Medusa API.
// UI-only work: no Docker, Postgres or Redis needed.   pnpm --filter @nemaya/storefront dev:mock
import { spawn } from "node:child_process"

const env = {
  ...process.env,
  NEMAYA_MOCK: "1",
  NEXT_PUBLIC_NEMAYA_MOCK: "1",
  MEDUSA_BACKEND_URL: "http://mock.invalid",
  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: "pk_mock",
  NEXT_PUBLIC_BASE_URL: "http://localhost:8000",
}
const child = spawn("next", ["dev", "-p", "8000"], { stdio: "inherit", env, shell: true })
child.on("exit", (code) => process.exit(code ?? 0))
