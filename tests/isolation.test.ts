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
  await db.exec(
    await readFile("supabase/migrations/0002_business_tools.sql", "utf8"),
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

describe("Phase 2 business tools in PostgreSQL", () => {
  let aliceLead: string, bobLead: string, conversation: string, booking: string;
  it("creates tenant-private leads and rejects forged business ownership", async () => {
    await asUser(alice);
    aliceLead = (
      await db.query<{ id: string }>(
        "insert into leads(business_id,name,phone) values($1,'Alice Customer','+14155550101') returning id",
        [aliceBusiness],
      )
    ).rows[0].id;
    await asUser(bob);
    bobLead = (
      await db.query<{ id: string }>(
        "insert into leads(business_id,name,phone) values($1,'Bob Customer','+14155550101') returning id",
        [bobBusiness],
      )
    ).rows[0].id;
    expect((await db.query("select id from leads")).rows).toEqual([
      { id: bobLead },
    ]);
    await expect(
      db.query(
        "insert into leads(business_id,name,phone) values($1,'Forged customer','+14155550102')",
        [aliceBusiness],
      ),
    ).rejects.toThrow();
    expect(
      (
        await db.query(
          "update leads set notes='changed' where id=$1 returning id",
          [aliceLead],
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("rejects cross-tenant conversation and message references, even with owned business IDs", async () => {
    await asUser(alice);
    await expect(
      db.query(
        "insert into conversations(business_id,lead_id,channel) values($1,$2,'SMS')",
        [aliceBusiness, bobLead],
      ),
    ).rejects.toThrow();
    conversation = (
      await db.query<{ id: string }>(
        "insert into conversations(business_id,lead_id,channel) values($1,$2,'SMS') returning id",
        [aliceBusiness, aliceLead],
      )
    ).rows[0].id;
    await asUser(bob);
    await expect(
      db.query(
        "insert into messages(business_id,conversation_id,body) values($1,$2,'Not yours')",
        [bobBusiness, conversation],
      ),
    ).rejects.toThrow();
    expect((await db.query("select * from conversations")).rows).toHaveLength(
      0,
    );
  });
  it("stores drafts and cannot fabricate delivered or inbound messages", async () => {
    await asUser(alice);
    await db.query(
      "insert into messages(business_id,conversation_id,body) values($1,$2,'Hello')",
      [aliceBusiness, conversation],
    );
    expect(
      (await db.query("select direction,status from messages")).rows,
    ).toEqual([{ direction: "outbound", status: "draft" }]);
    await expect(
      db.query("update messages set status='delivered'"),
    ).rejects.toThrow();
    await expect(
      db.query("update messages set direction='inbound'"),
    ).rejects.toThrow();
    await asUser(bob);
    expect((await db.query("select * from messages")).rows).toHaveLength(0);
  });
  it("rejects cross-tenant appointments and overlapping scheduled bookings", async () => {
    await asUser(alice);
    await expect(
      db.query(
        "insert into appointments(business_id,lead_id,title,starts_at,ends_at) values($1,$2,'Repair','2026-12-01T15:00Z','2026-12-01T16:00Z')",
        [aliceBusiness, bobLead],
      ),
    ).rejects.toThrow();
    booking = (
      await db.query<{ id: string }>(
        "insert into appointments(business_id,lead_id,title,starts_at,ends_at) values($1,$2,'Repair','2026-12-01T15:00Z','2026-12-01T16:00Z') returning id",
        [aliceBusiness, aliceLead],
      )
    ).rows[0].id;
    await expect(
      db.query(
        "insert into appointments(business_id,lead_id,title,starts_at,ends_at) values($1,$2,'Overlapping','2026-12-01T15:30Z','2026-12-01T16:30Z')",
        [aliceBusiness, aliceLead],
      ),
    ).rejects.toThrow("overlaps");
    await db.query(
      "insert into appointments(business_id,lead_id,title,starts_at,ends_at) values($1,$2,'Adjacent','2026-12-01T16:00Z','2026-12-01T17:00Z')",
      [aliceBusiness, aliceLead],
    );
    await asUser(bob);
    expect((await db.query("select * from appointments")).rows).toHaveLength(0);
  });
  it("canceled appointments free time and cannot be reactivated over another booking", async () => {
    await asUser(alice);
    await db.query("update appointments set status='Canceled' where id=$1", [
      booking,
    ]);
    await db.query(
      "insert into appointments(business_id,lead_id,title,starts_at,ends_at) values($1,$2,'Replacement','2026-12-01T15:00Z','2026-12-01T16:00Z')",
      [aliceBusiness, aliceLead],
    );
    await expect(
      db.query("update appointments set status='Scheduled' where id=$1", [
        booking,
      ]),
    ).rejects.toThrow("overlaps");
  });
  it("generates private notifications with read-only content", async () => {
    await asUser(alice);
    const notices = await db.query<{ business_id: string; title: string }>(
      "select * from notifications",
    );
    expect(notices.rows.length).toBeGreaterThan(2);
    expect(notices.rows.every((n) => n.business_id === aliceBusiness)).toBe(
      true,
    );
    await db.query("update notifications set read=true");
    await expect(
      db.query("update notifications set title='Fake notification'"),
    ).rejects.toThrow();
    await expect(
      db.query(
        "insert into notifications(business_id,title) values($1,'Fake')",
        [aliceBusiness],
      ),
    ).rejects.toThrow();
    await asUser(bob);
    expect(
      (
        await db.query<{ business_id: string }>("select * from notifications")
      ).rows.every((n) => n.business_id === bobBusiness),
    ).toBe(true);
  });
  it("updates business and hours atomically for owners and blocks cross-business edits", async () => {
    await asUser(alice);
    await db.query("select update_business($1,$2::jsonb)", [
      aliceBusiness,
      JSON.stringify({
        ...input,
        name: "Alice Updated",
        timezone: "Asia/Colombo",
        opens: "08:00",
      }),
    ]);
    expect(
      (await db.query<{ name: string }>("select name from businesses")).rows[0]
        .name,
    ).toBe("Alice Updated");
    await expect(
      db.query("select update_business($1,$2::jsonb)", [
        aliceBusiness,
        JSON.stringify({ ...input, name: "Should roll back", opens: "18:00" }),
      ]),
    ).rejects.toThrow();
    expect(
      (await db.query<{ name: string }>("select name from businesses")).rows[0]
        .name,
    ).toBe("Alice Updated");
    await expect(
      db.query("select update_business($1,$2::jsonb)", [
        bobBusiness,
        JSON.stringify(input),
      ]),
    ).rejects.toThrow("Owner permission");
  });
  it("lets an authorized member book but restricts business settings to owners", async () => {
    await db.exec("reset role");
    await db.query(
      "insert into memberships(business_id,user_id,role) values($1,$2,'member')",
      [aliceBusiness, bob],
    );
    await asUser(bob);
    await db.query(
      "insert into appointments(business_id,lead_id,title,starts_at,ends_at) values($1,$2,'Member booking','2026-12-02T15:00Z','2026-12-02T16:00Z')",
      [aliceBusiness, aliceLead],
    );
    await expect(
      db.query("select update_business($1,$2::jsonb)", [
        aliceBusiness,
        JSON.stringify(input),
      ]),
    ).rejects.toThrow("Owner permission");
  });
  it("denies anonymous access to all new tables", async () => {
    await db.exec("reset role;set role anon");
    for (const table of [
      "leads",
      "conversations",
      "messages",
      "appointments",
      "notifications",
    ])
      await expect(db.query(`select * from ${table}`)).rejects.toThrow();
  });
});
