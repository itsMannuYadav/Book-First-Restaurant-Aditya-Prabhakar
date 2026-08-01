import Link from "next/link";
import { BRAND } from "@/constants/brand";
import { ROUTES } from "@/constants/routes";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#11100e]">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 0% 0%, rgba(212,175,55,0.16), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(255,245,220,0.05), transparent), linear-gradient(165deg, #0d0c0b, #171511 50%, #10100e)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 lg:flex-row lg:items-center lg:gap-16">
        <div className="mb-10 hidden max-w-md flex-1 lg:mb-0 lg:block">
          <Link
            href={ROUTES.home}
            className="font-[family-name:var(--font-serif-display)] text-3xl font-bold text-[#f4efe6]"
          >
            <span className="bf-gold-text">{BRAND.name}</span>
          </Link>
          <p className="mt-6 font-[family-name:var(--font-serif-display)] text-4xl leading-tight font-semibold text-[#f4efe6]">
            Run your digital menu like a premium brand.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[#9d9486]">
            One dashboard for profile, categories, dishes, themes, and QR —
            built for restaurant owners who care how their menu looks.
          </p>
        </div>

        <div className="mx-auto w-full max-w-md flex-1 lg:mx-0">
          <div className="rounded-3xl border border-white/10 bg-[#f6f1e8] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
