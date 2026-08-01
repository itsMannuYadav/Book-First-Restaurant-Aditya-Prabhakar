import Link from "next/link";
import { BRAND } from "@/constants/brand";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button";
import { LandingMenuPreview } from "@/features/marketing/components/landing-menu-preview";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#11100e] text-[#f4efe6]">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 85% 20%, rgba(212,175,55,0.18), transparent 55%), radial-gradient(ellipse 45% 40% at 10% 90%, rgba(255,245,220,0.06), transparent 50%), linear-gradient(160deg, #0d0c0b 0%, #171511 48%, #10100e 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        aria-hidden
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 bf-fade-up">
        <Link
          href={ROUTES.home}
          className="font-[family-name:var(--font-serif-display)] text-2xl font-bold tracking-tight"
        >
          {BRAND.name}
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href={ROUTES.login}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "text-[#f4efe6] hover:bg-white/10 hover:text-white",
            )}
          >
            Sign in
          </Link>
          <Link
            href={ROUTES.signup}
            className={cn(
              buttonVariants(),
              "bg-[#e6c875] text-[#14110e] hover:bg-[#f0d78a]",
            )}
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 pt-8 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-0">
        <section className="max-w-xl">
          <p className="bf-fade-up font-[family-name:var(--font-serif-display)] text-5xl leading-[0.95] font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bf-gold-text">{BRAND.name}</span>
          </p>
          <h1 className="bf-fade-up-delay-1 mt-5 max-w-lg text-xl leading-snug font-medium text-[#d9d0c0] sm:text-2xl">
            Digital menus your guests will actually enjoy opening.
          </h1>
          <p className="bf-fade-up-delay-2 mt-4 max-w-md text-base leading-relaxed text-[#9d9486]">
            Create your restaurant profile, manage the menu, share a QR code.
            Guests scan and browse — no login, no clutter.
          </p>
          <div className="bf-fade-up-delay-3 mt-8 flex flex-wrap gap-3">
            <Link
              href={ROUTES.signup}
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-[#e6c875] px-5 text-[#14110e] hover:bg-[#f0d78a]",
              )}
            >
              Start free
            </Link>
            <Link
              href={ROUTES.publicMenu("cafe-aroma")}
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-white/20 bg-transparent px-5 text-[#f4efe6] hover:bg-white/10",
              )}
            >
              View sample menu
            </Link>
          </div>
        </section>

        <LandingMenuPreview />
      </main>
    </div>
  );
}
