import { PublicNav } from "@/components/public-nav";
import { Footer } from "@/components/footer";
import { InstallGuide } from "@/components/install-guide";
export const metadata = { title: "Install LeadRescue" };
export default function InstallPage() {
  return (
    <>
      <PublicNav />
      <main id="main" className="container install-page">
        <InstallGuide />
      </main>
      <Footer />
    </>
  );
}
