export const dynamic = "force-dynamic";
import { LiveWorkspace } from "@/components/workspace/live-page";
export const metadata = { title: "Appointments" };
export default function Page() {
  return <LiveWorkspace section="Appointments" />;
}
