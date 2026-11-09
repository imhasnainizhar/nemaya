import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261109125516 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "gift_card" drop constraint if exists "gift_card_code_unique";`);
    this.addSql(`create table if not exists "gift_card" ("id" text not null, "code" text not null, "currency_code" text not null default 'usd', "initial_amount" real not null, "balance" real not null, "status" text check ("status" in ('active', 'disabled')) not null default 'active', "expires_at" timestamptz null, "source" text check ("source" in ('purchase', 'admin')) not null default 'purchase', "purchaser_customer_id" text null, "purchaser_email" text null, "sender_name" text null, "recipient_name" text null, "recipient_email" text null, "message" text null, "deliver_at" timestamptz null, "delivered_at" timestamptz null, "order_id" text null, "line_item_id" text null, "note" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "gift_card_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_gift_card_code_unique" ON "gift_card" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_gift_card_deleted_at" ON "gift_card" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "gift_card_transaction" ("id" text not null, "type" text check ("type" in ('issue', 'redeem', 'adjust', 'refund', 'disable', 'enable')) not null, "amount" real not null, "balance_after" real not null, "reason" text null, "order_id" text null, "cart_id" text null, "actor_id" text null, "gift_card_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "gift_card_transaction_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_gift_card_transaction_gift_card_id" ON "gift_card_transaction" ("gift_card_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_gift_card_transaction_deleted_at" ON "gift_card_transaction" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "gift_card_transaction" add constraint "gift_card_transaction_gift_card_id_foreign" foreign key ("gift_card_id") references "gift_card" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "gift_card_transaction" drop constraint if exists "gift_card_transaction_gift_card_id_foreign";`);

    this.addSql(`drop table if exists "gift_card" cascade;`);

    this.addSql(`drop table if exists "gift_card_transaction" cascade;`);
  }

}
