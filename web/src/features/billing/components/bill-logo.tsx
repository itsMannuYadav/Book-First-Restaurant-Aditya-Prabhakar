import { cn } from "@/lib/utils";

/** Restaurant logo for a bill, with a letter-mark fallback (mirrors the public menu). */
export function BillLogo({
  name,
  logoUrl,
  size = "md",
}: {
  name: string;
  logoUrl?: string;
  size?: "md" | "lg";
}) {
  const box = size === "lg" ? "size-16" : "size-12";

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className={cn(
          box,
          "shrink-0 rounded-xl border border-[#14110e]/10 object-cover",
        )}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        box,
        "flex shrink-0 items-center justify-center rounded-xl border border-[#14110e]/10 bg-[#14110e]/5 font-[family-name:var(--font-serif-display)] font-bold text-[#14110e]",
        size === "lg" ? "text-xl" : "text-lg",
      )}
    >
      {name.slice(0, 1) || "—"}
    </div>
  );
}
