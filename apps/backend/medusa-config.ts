import { defineConfig, loadEnv } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const env = (key: string, fallback?: string) => {
  const v = process.env[key]
  return v === undefined || v === "" ? fallback : v
}

const IS_PROD = process.env.NODE_ENV === "production"
const REDIS_URL = env("REDIS_URL")
const STRIPE_API_KEY = env("STRIPE_API_KEY")

// Portfolio safety: never allow live Stripe keys.
if (STRIPE_API_KEY && !STRIPE_API_KEY.startsWith("sk_test_")) {
  throw new Error(
    "[nemaya] STRIPE_API_KEY must be a Stripe TEST key (sk_test_...). Live payments are disabled for this project."
  )
}

const requireInProd = (key: string) => {
  const v = env(key)
  if (IS_PROD && !v) throw new Error(`[nemaya] Missing required env var ${key}`)
  return v
}

// ---------- Infrastructure modules (Redis in docker/prod, in-memory fallback for quick tests) ----------
const redisModules = REDIS_URL
  ? [
      {
        resolve: "@medusajs/medusa/event-bus-redis",
        options: { redisUrl: REDIS_URL },
      },
      {
        resolve: "@medusajs/medusa/workflow-engine-redis",
        options: { redis: { redisUrl: REDIS_URL } },
      },
      {
        resolve: "@medusajs/medusa/locking",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/locking-redis",
              id: "locking-redis",
              is_default: true,
              options: { redisUrl: REDIS_URL },
            },
          ],
        },
      },
    ]
  : []

// ---------- File storage: S3-compatible (MinIO locally, Cloudflare R2 in production) ----------
const fileModule = {
  resolve: "@medusajs/medusa/file",
  options: {
    providers: env("S3_BUCKET")
      ? [
          {
            resolve: "@medusajs/medusa/file-s3",
            id: "s3",
            options: {
              file_url: env("S3_FILE_URL"),
              access_key_id: env("S3_ACCESS_KEY_ID"),
              secret_access_key: env("S3_SECRET_ACCESS_KEY"),
              region: env("S3_REGION", "auto"),
              bucket: env("S3_BUCKET"),
              endpoint: env("S3_ENDPOINT"),
              prefix: env("S3_PREFIX", ""),
              // R2 and MinIO both expect path-style addressing.
              additional_client_config: { forcePathStyle: true },
            },
          },
        ]
      : [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: { backend_url: `${env("MEDUSA_BACKEND_URL", "http://localhost:9000")}/static` },
          },
        ],
  },
}

// ---------- Notification channels ----------
const notificationModule = {
  resolve: "@medusajs/medusa/notification",
  options: {
    providers: [
      {
        resolve: "./src/modules/smtp-notification",
        id: "smtp",
        options: {
          channels: ["email"],
          host: env("SMTP_HOST", "localhost"),
          port: Number(env("SMTP_PORT", "1025")),
          secure: env("SMTP_SECURE", "false") === "true",
          user: env("SMTP_USER"),
          pass: env("SMTP_PASS"),
          from: env("EMAIL_FROM", "Nemaya <hello@nemaya.local>"),
        },
      },
      {
        resolve: "./src/modules/webpush-notification",
        id: "webpush",
        options: {
          channels: ["webpush"],
          vapid_public_key: env("VAPID_PUBLIC_KEY"),
          vapid_private_key: env("VAPID_PRIVATE_KEY"),
          vapid_subject: env("VAPID_SUBJECT", "mailto:hello@nemaya.local"),
        },
      },
    ],
  },
}

const paymentModule = {
  resolve: "@medusajs/medusa/payment",
  options: {
    providers: STRIPE_API_KEY
      ? [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: STRIPE_API_KEY,
              webhookSecret: env("STRIPE_WEBHOOK_SECRET"),
              capture: true,
            },
          },
        ]
      : [],
  },
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: env("DATABASE_URL"),
    databaseDriverOptions: {
      // Neon (and most managed Postgres) require TLS
      ...(env("DATABASE_SSL", "false") === "true" ? { connection: { ssl: { rejectUnauthorized: false } } } : {}),
      pool: {
        min: 0,
        max: Number(env("DATABASE_POOL_MAX", "10")),
        idleTimeoutMillis: 30_000,
      },
    },
    redisUrl: REDIS_URL,
    workerMode: (env("MEDUSA_WORKER_MODE", "shared") as "shared" | "worker" | "server"),
    http: {
      storeCors: env("STORE_CORS", "http://localhost:8000")!,
      adminCors: env("ADMIN_CORS", "http://localhost:9000")!,
      authCors: env("AUTH_CORS", "http://localhost:8000,http://localhost:9000")!,
      jwtSecret: requireInProd("JWT_SECRET") || "dev-jwt-secret",
      cookieSecret: requireInProd("COOKIE_SECRET") || "dev-cookie-secret",
    },
  },
  admin: {
    disable: env("ADMIN_DISABLED", "false") === "true",
    backendUrl: env("MEDUSA_BACKEND_URL", "http://localhost:9000"),
  },
  modules: [
    ...redisModules,
    fileModule,
    notificationModule,
    paymentModule,
    { resolve: "./src/modules/profile" },
    { resolve: "./src/modules/wishlist" },
    { resolve: "./src/modules/gift-card" },
    { resolve: "./src/modules/messaging" },
  ],
})
