export const dynamic = "force-dynamic";
import { LiveWorkspace } from "@/components/workspace/live-page";
export const metadata = { title: "Settings" };
export default function Page() {
  return <LiveWorkspace section="Settings" />;
}
