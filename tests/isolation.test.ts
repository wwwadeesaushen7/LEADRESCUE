import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
const alice = "00000000-0000-4000-8000-000000000001",
  bob = "00000000-0000-4000-8000-000000000002",
  unverified = "00000000-0000-4000-8000-000000000003";
const input = {
  name: "Alice Plumbing",
  industry: "Plumbing",
  phone: "+14155550100",
  email: "alice@example.com",
  location: "Austin, TX",
  timezone: "America/Chicago",
  opens: "09:00",
  closes: "17:00",
  workingDays: [1, 2, 3, 4, 5],
};
let db: PGlite;
let aliceBusiness: string;
let bobBusiness: string;
async function asUser(id: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role authenticated");
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,email_confirmed_at timestamptz); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated; insert into auth.users values ('${alice}',now()),('${bob}',now()),('${unverified}',null);`,
  );
  await db.exec(
    await readFile("supabase/migrations/0001_foundation.sql", "utf8"),
  );
  await asUser(alice);
  aliceBusiness = (
    await db.query<{ id: string }>(
      "select public.create_business($1::jsonb) as id",
      [JSON.stringify(input)],
    )
  ).rows[0].id;
  await asUser(bob);
  bobBusiness = (
    await db.query<{ id: string }>(
      "select public.create_business($1::jsonb) as id",
      [
        JSON.stringify({
          ...input,
          name: "Bob HVAC",
          email: "bob@example.com",
        }),
      ],
    )
  ).rows[0].id;
});
afterAll(async () => {
  await db?.close();
});
describe("Real PostgreSQL migration and RLS in embedded PGlite (not hosted Supabase)", () => {
  it("isolates businesses, settings, subscriptions and memberships", async () => {
    await asUser(alice);
    expect(
      (
        await db.query<{ id: string }>("select id from public.businesses")
      ).rows.map((r) => r.id),
    ).toEqual([aliceBusiness]);
    for (const table of ["business_settings", "subscriptions", "memberships"])
      expect(
        (
          await db.query<{ business_id: string }>(
            `select business_id from public.${table}`,
          )
        ).rows.map((r) => r.business_id),
      ).toEqual([aliceBusiness]);
  });
  it("prevents cross-business updates", async () => {
    await asUser(alice);
    expect(
      (
        await db.query(
          "update public.businesses set name=$1 where id=$2 returning id",
          ["Stolen business", bobBusiness],
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("prevents forged membership and paid subscription writes", async () => {
    await asUser(alice);
    await expect(
      db.query(
        "insert into public.memberships(business_id,user_id,role) values ($1,$2,'owner')",
        [bobBusiness, alice],
      ),
    ).rejects.toThrow();
    await expect(
      db.query(
        "update public.subscriptions set status='active' where business_id=$1",
        [aliceBusiness],
      ),
    ).rejects.toThrow();
  });
  it("creates only one business on duplicate onboarding", async () => {
    await asUser(alice);
    expect(
      (
        await db.query<{ id: string }>(
          "select public.create_business($1::jsonb) as id",
          [JSON.stringify(input)],
        )
      ).rows[0].id,
    ).toBe(aliceBusiness);
  });
  it("rejects unverified business creation", async () => {
    await asUser(unverified);
    await expect(
      db.query("select public.create_business($1::jsonb)", [
        JSON.stringify(input),
      ]),
    ).rejects.toThrow("Verified email required");
  });
  it("keeps messaging disabled even if owner writes directly", async () => {
    await asUser(alice);
    await expect(
      db.query(
        "update public.business_settings set automatic_recovery=true where business_id=$1",
        [aliceBusiness],
      ),
    ).rejects.toThrow();
  });
  it("blocks anonymous reads and onboarding RPC", async () => {
    await db.exec("reset role; set role anon");
    await expect(db.query("select * from public.businesses")).rejects.toThrow();
    await expect(
      db.query("select public.create_business($1::jsonb)", [
        JSON.stringify(input),
      ]),
    ).rejects.toThrow();
  });
  it("keeps profiles private and prevents spoofed profile inserts", async () => {
    await asUser(alice);
    expect(
      (
        await db.query<{ id: string }>("select id from public.profiles")
      ).rows.map((r) => r.id),
    ).toEqual([alice]);
    await expect(
      db.query("insert into public.profiles(id,full_name) values($1,$2)", [
        unverified,
        "Impersonated",
      ]),
    ).rejects.toThrow();
  });
});
