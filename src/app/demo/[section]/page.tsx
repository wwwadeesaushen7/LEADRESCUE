import { notFound } from "next/navigation";
import { WorkspaceApp, type Section } from "@/components/workspace/app";
import { demoBusiness } from "@/lib/demo/session";
export const metadata = { title: "Demo workspace" };
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const sections: Record<string, Section> = {
    simulator: "Recovery demo",
    leads: "Leads",
    inbox: "Inbox",
    appointments: "Appointments",
    settings: "Settings",
  };
  if (!sections[section]) notFound();
  const business = await demoBusiness();
  return (
    <WorkspaceApp
      demo
      name={business.name}
      business={business}
      section={sections[section]}
    />
  );
}
