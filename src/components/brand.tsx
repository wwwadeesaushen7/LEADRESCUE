import Link from "next/link";
import { AudioLines } from "lucide-react";
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="LeadRescue home">
      <span className="brand-mark">
        <AudioLines size={22} />
      </span>
      {!compact && (
        <span>
          lead<span className="brand-light">rescue</span>
          <span className="brand-dot">.</span>
        </span>
      )}
    </Link>
  );
}
