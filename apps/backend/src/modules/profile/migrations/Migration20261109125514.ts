import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261109125514 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "username_reservation" drop constraint if exists "username_reservation_username_unique";`);
    this.addSql(`alter table if exists "profile" drop constraint if exists "profile_username_unique";`);
    this.addSql(`alter table if exists "profile" drop constraint if exists "profile_customer_id_unique";`);
    this.addSql(`create table if not exists "profile" ("id" text not null, "customer_id" text not null, "username" text not null, "avatar_id" text not null default 'av-01', "username_changes" jsonb null, "email_snapshot" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "profile_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_profile_customer_id_unique" ON "profile" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_profile_username_unique" ON "profile" ("username") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_profile_deleted_at" ON "profile" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "username_reservation" ("id" text not null, "username" text not null, "customer_id" text not null, "reserved_until" timestamptz not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "username_reservation_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_username_reservation_username_unique" ON "username_reservation" ("username") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_username_reservation_deleted_at" ON "username_reservation" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "profile" cascade;`);

    this.addSql(`drop table if exists "username_reservation" cascade;`);
  }

}
