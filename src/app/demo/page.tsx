import { WorkspaceApp } from "@/components/workspace/app";
import { demoBusiness } from "@/lib/demo/session";
export const metadata = { title: "Demo workspace" };
export default async function Page() {
  const business = await demoBusiness();
  return <WorkspaceApp demo name={business.name} business={business} />;
}
