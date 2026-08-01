"use client";

export function SavanOverlay() {
  // Deterministic values for rain drops & leaves to avoid hydration mismatch
  const rainDrops = Array.from({ length: 22 }).map((_, i) => ({
    id: i,
    left: `${(i * 4.5 + (i % 5) * 2) % 100}%`,
    duration: `${2.2 + (i % 5) * 0.4}s`, // Slow, gentle drizzle
    delay: `${(i * 0.35) % 3.5}s`,
    opacity: 0.2 + ((i % 4) * 0.1),
    height: `${30 + (i % 5) * 10}px`,
  }));

  const leaves = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    left: `${(i * 12 + 6) % 94}%`,
    duration: `${7 + (i % 4) * 2}s`, // Smooth, slow floating
    delay: `${(i * 1.1) % 6}s`,
    size: 20 + (i % 3) * 6,
  }));

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    >
      {/* Slow Gentle Rain Layer */}
      <div className="absolute inset-0">
        {rainDrops.map((drop) => (
          <div
            key={drop.id}
            className="absolute top-0 w-[1.5px] bg-gradient-to-b from-transparent via-[#86efac]/80 to-white/60"
            style={{
              left: drop.left,
              height: drop.height,
              opacity: drop.opacity,
              animation: `savanRainDrop ${drop.duration} linear infinite`,
              animationDelay: drop.delay,
            }}
          />
        ))}
      </div>

      {/* Elegant Floating Leaves */}
      <div className="absolute inset-0">
        {leaves.map((leaf) => (
          <div
            key={leaf.id}
            className="absolute top-0 text-[#4ade80]/65 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
            style={{
              left: leaf.left,
              animation: `savanLeafFloat ${leaf.duration} ease-in-out infinite`,
              animationDelay: leaf.delay,
            }}
          >
            {/* Elegant Botanical Leaf SVG */}
            <svg
              width={leaf.size}
              height={leaf.size * 1.3}
              viewBox="0 0 24 32"
              fill="currentColor"
            >
              <path d="M12 2C6.5 2 2 7.5 2 14.5C2 19.5 5.8 23.5 10.5 23.9L10 30C10 30.6 10.4 31 11 31C11.6 31 12 30.6 12 30L11.5 23.9C16.2 23.5 20 19.5 20 14.5C20 7.5 15.5 2 12 2ZM12 21.5C8 21.5 4.5 18 4.5 14C4.5 9.5 8.5 4.8 12 3.6C15.5 4.8 19.5 9.5 19.5 14C19.5 18 16 21.5 12 21.5Z" />
              <path
                d="M12 6V19M12 11L8.5 8.5M12 14L15.5 11.5M12 17L9 15"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
                opacity="0.75"
              />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}
