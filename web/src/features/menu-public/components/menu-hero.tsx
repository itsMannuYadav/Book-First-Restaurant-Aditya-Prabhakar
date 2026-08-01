interface MenuHeroProps {
  name: string;
  tagline?: string;
  logoUrl?: string;
  coverUrl?: string;
  rating?: string;
  timing?: string;
  address?: string;
}

export function MenuHero({
  name,
  tagline,
  logoUrl,
  coverUrl,
  rating,
  timing,
  address,
}: MenuHeroProps) {
  return (
    <header
      className="relative flex min-h-[280px] w-full items-end justify-center overflow-hidden bg-cover bg-center"
      style={
        coverUrl
          ? { backgroundImage: `url(${coverUrl})` }
          : {
              backgroundImage:
                "linear-gradient(135deg, #1a1a1f 0%, #0B0B0D 50%, #2a2418 100%)",
            }
      }
    >
      <div className="absolute inset-0 bg-[image:var(--menu-header-overlay)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-[900px] flex-col items-center px-5 pt-10 pb-6 text-center">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={`${name} logo`}
            className="mb-3.5 size-24 rounded-full border-[3px] border-[var(--menu-border)] object-cover shadow-[0_8px_25px_rgba(0,0,0,0.4)]"
          />
        ) : (
          <div
            className="mb-3.5 flex size-24 items-center justify-center rounded-full border-[3px] border-[var(--menu-border)] bg-black/40 text-2xl font-semibold text-[var(--menu-accent)] shadow-[0_8px_25px_rgba(0,0,0,0.4)]"
            aria-hidden
          >
            {name.slice(0, 1)}
          </div>
        )}

        <h1 className="menu-heading mb-1.5 bg-[image:var(--menu-gold-gradient)] bg-clip-text text-[2.4rem] leading-tight font-bold tracking-tight text-transparent">
          {name}
        </h1>

        {tagline ? (
          <p className="mb-3 text-[0.95rem] font-medium text-[var(--menu-muted)]">
            {tagline}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-center gap-3 text-[0.82rem]">
          {rating ? <MetaBadge>{rating}</MetaBadge> : null}
          {timing ? <MetaBadge>{timing}</MetaBadge> : null}
          {address ? <MetaBadge>{address}</MetaBadge> : null}
        </div>
      </div>
    </header>
  );
}

function MetaBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--menu-border-muted)] bg-[var(--menu-pill)] px-3 py-1 text-[var(--menu-text)]">
      {children}
    </span>
  );
}
