import { useEffect, useRef, useState } from "react";
import {
  createSim,
  FIELD_COLS,
  FIELD_ROWS,
  fieldPixels,
  frameSim,
  paint,
  SKY,
  SKY_COLS,
  STRIP_COLS,
  STRIP_ROWS,
  stripPixels,
  tickSim,
} from "./pixels";

type PixelArtProps = {
  pixels: string[];
  cols: number;
  size: number;
  gap?: number;
};

export function PixelArt({ pixels, cols, size, gap = 0 }: PixelArtProps) {
  return (
    <span
      aria-hidden="true"
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gridAutoRows: size,
        gap,
      }}
    >
      {pixels.map((color, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static bitmap
        <span key={i} style={{ background: color }} />
      ))}
    </span>
  );
}

export function SkyField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) paint(ctx, SKY, SKY_COLS);
  }, []);

  return (
    <canvas
      aria-hidden="true"
      className="rl-pixelated absolute inset-x-0 top-0 h-[560px] w-full"
      height={SKY.length / SKY_COLS}
      ref={ref}
      width={SKY_COLS}
    />
  );
}

export function StripField({ className = "opacity-60" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    paint(ctx, stripPixels(frame), STRIP_COLS);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let onScreen = true;
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    });
    observer.observe(ctx.canvas);

    const frames = setInterval(() => {
      if (!onScreen) return;
      frame += 1;
      paint(ctx, stripPixels(frame), STRIP_COLS);
    }, 160);
    return () => {
      observer.disconnect();
      clearInterval(frames);
    };
  }, []);

  return (
    <canvas
      aria-hidden="true"
      className={`rl-pixelated pointer-events-none absolute right-0 bottom-[-3vw] left-0 h-[10vw] w-full ${className}`}
      height={STRIP_ROWS}
      ref={ref}
      width={STRIP_COLS}
    />
  );
}

export function HeroField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [readout, setReadout] = useState(() => readoutOf(createSim()));

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;

    const sim = createSim();
    paint(ctx, fieldPixels(sim), FIELD_COLS);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let onScreen = true;
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    });
    observer.observe(ctx.canvas);

    const ticks = setInterval(() => {
      if (!onScreen) return;
      tickSim(sim);
      setReadout(readoutOf(sim));
    }, 1600);
    const frames = setInterval(() => {
      if (!onScreen) return;
      frameSim(sim);
      paint(ctx, fieldPixels(sim), FIELD_COLS);
    }, 120);

    return () => {
      observer.disconnect();
      clearInterval(ticks);
      clearInterval(frames);
    };
  }, []);

  return (
    <>
      <canvas
        className="rl-pixelated absolute inset-0 size-full object-cover object-bottom lg:object-top"
        height={FIELD_ROWS}
        ref={ref}
        width={FIELD_COLS}
      />
      <div className="absolute top-30 right-[4%] hidden flex-col gap-1 text-right opacity-90 md:flex">
        <span className="font-rl-pixel text-[11.5px] text-rl-faint uppercase">
          próxima edição
        </span>
        <span className="font-extrabold font-rl-display text-[30px] text-rl-fg tracking-[-0.04em]">
          #{readout.edition}
        </span>
        <span className="font-rl-mono text-rl-dim text-[12px]">
          sex · 10:00 · 1.284 inscritos
        </span>
        <span className="mt-1.5 font-rl-mono text-rl-dim text-[12px]">
          {readout.total} commits ·{" "}
          <span className="text-rl-accent-light">{readout.kept} novidades</span>{" "}
          · {readout.total - readout.kept} com o time
        </span>
      </div>
    </>
  );
}

function readoutOf(sim: ReturnType<typeof createSim>) {
  return {
    edition: sim.edition,
    total: sim.commits.length,
    kept: sim.commits.filter(Boolean).length,
  };
}
