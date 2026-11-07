import { PublicNav } from "@/components/public-nav";
import { Pricing } from "@/components/pricing";
import { Footer } from "@/components/footer";
export const metadata = { title: "Pricing" };
export default function Page() {
  return (
    <>
      <PublicNav />
      <main id="main">
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
