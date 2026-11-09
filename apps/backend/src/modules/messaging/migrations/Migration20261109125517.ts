import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261109125517 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "sale_announcement" drop constraint if exists "sale_announcement_promotion_campaign_id_unique";`);
    this.addSql(`alter table if exists "push_subscription" drop constraint if exists "push_subscription_endpoint_unique";`);
    this.addSql(`alter table if exists "notification_setting" drop constraint if exists "notification_setting_type_unique";`);
    this.addSql(`alter table if exists "notification_preference" drop constraint if exists "notification_preference_customer_id_unique";`);
    this.addSql(`alter table if exists "known_device" drop constraint if exists "known_device_customer_id_fingerprint_unique";`);
    this.addSql(`create table if not exists "inbox_message" ("id" text not null, "customer_id" text not null, "type" text not null, "category" text not null, "title" text not null, "body" text not null, "url" text null, "image_url" text null, "campaign_id" text null, "read_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "inbox_message_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_inbox_message_customer_id" ON "inbox_message" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_inbox_message_deleted_at" ON "inbox_message" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "known_device" ("id" text not null, "customer_id" text not null, "fingerprint" text not null, "label" text null, "last_ip" text null, "last_seen_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "known_device_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_known_device_customer_id" ON "known_device" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_known_device_deleted_at" ON "known_device" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_known_device_customer_id_fingerprint_unique" ON "known_device" ("customer_id", "fingerprint") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "notification_campaign" ("id" text not null, "name" text not null, "title" text not null, "body" text not null, "image_url" text null, "url" text null, "email_subject" text null, "channels" jsonb not null, "audience" jsonb not null, "status" text check ("status" in ('draft', 'scheduled', 'sending', 'sent', 'canceled', 'failed')) not null default 'draft', "scheduled_at" timestamptz null, "sent_at" timestamptz null, "stats" jsonb null, "error" text null, "created_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "notification_campaign_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_notification_campaign_deleted_at" ON "notification_campaign" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "notification_delivery" ("id" text not null, "type" text not null, "channel" text not null, "status" text check ("status" in ('sent', 'failed', 'skipped')) not null, "customer_id" text null, "recipient" text null, "campaign_id" text null, "error" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "notification_delivery_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_notification_delivery_type" ON "notification_delivery" ("type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_notification_delivery_deleted_at" ON "notification_delivery" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "notification_preference" ("id" text not null, "customer_id" text not null, "marketing_email" boolean not null default true, "marketing_push" boolean not null default true, "muted_types" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "notification_preference_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_notification_preference_customer_id_unique" ON "notification_preference" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_notification_preference_deleted_at" ON "notification_preference" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "notification_setting" ("id" text not null, "type" text not null, "enabled" boolean not null default true, "channels" jsonb null, "templates" jsonb null, "config" jsonb null, "updated_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "notification_setting_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_notification_setting_type_unique" ON "notification_setting" ("type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_notification_setting_deleted_at" ON "notification_setting" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "push_subscription" ("id" text not null, "customer_id" text not null, "endpoint" text not null, "p256dh" text not null, "auth" text not null, "platform" text not null default 'web', "user_agent" text null, "failures" integer not null default 0, "last_seen_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "push_subscription_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_push_subscription_customer_id" ON "push_subscription" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_push_subscription_endpoint_unique" ON "push_subscription" ("endpoint") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_push_subscription_deleted_at" ON "push_subscription" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "sale_announcement" ("id" text not null, "promotion_campaign_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "sale_announcement_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_sale_announcement_promotion_campaign_id_unique" ON "sale_announcement" ("promotion_campaign_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_sale_announcement_deleted_at" ON "sale_announcement" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "inbox_message" cascade;`);

    this.addSql(`drop table if exists "known_device" cascade;`);

    this.addSql(`drop table if exists "notification_campaign" cascade;`);

    this.addSql(`drop table if exists "notification_delivery" cascade;`);

    this.addSql(`drop table if exists "notification_preference" cascade;`);

    this.addSql(`drop table if exists "notification_setting" cascade;`);

    this.addSql(`drop table if exists "push_subscription" cascade;`);

    this.addSql(`drop table if exists "sale_announcement" cascade;`);
  }

}
