import { Dashboard } from "@/components/dashboard";
import { demoBusiness } from "@/lib/demo/session";
export const metadata = { title: "Demo workspace" };
export default async function Page() {
  const business = await demoBusiness();
  return <Dashboard demo name={business.name} />;
}
