import { useEffect, useRef, useState, type ReactNode } from "react";

const sparkColors = ["#ffd59e", "#ff6a3d", "#ff6a3d", "#c2366b"];

type Spark = {
  x: number;
  y: number;
  r: number;
  vy: number;
  drift: number;
  phase: number;
  life: number;
  color: number;
};

function makeSpark(width: number, height: number, anywhere: boolean): Spark {
  return {
    x: Math.random() < 0.65 ? width / 2 + (Math.random() + Math.random() - 1) * width * 0.22 : Math.random() * width,
    y: anywhere ? Math.random() * height : height + Math.random() * 40,
    r: 0.6 + Math.random() ** 3 * 2.4,
    vy: 0.18 + Math.random() * 0.5,
    drift: 0.2 + Math.random() * 0.6,
    phase: Math.random() * Math.PI * 2,
    life: 0.5 + Math.random() * 0.5,
    color: Math.floor(Math.random() * sparkColors.length),
  };
}

function useNoise() {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    if (!context) return;
    const image = context.createImageData(128, 128);
    for (let index = 0; index < image.data.length; index += 4) {
      const tone = Math.random() * 255;
      image.data[index] = tone;
      image.data[index + 1] = tone;
      image.data[index + 2] = tone;
      image.data[index + 3] = 18;
    }
    context.putImageData(image, 0, 0);
    setUrl(canvas.toDataURL());
  }, []);
  return url;
}

function Embers({ density }: { density: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sprites = sparkColors.map((color) => {
      const sprite = document.createElement("canvas");
      sprite.width = 32;
      sprite.height = 32;
      const spriteContext = sprite.getContext("2d");
      if (!spriteContext) return sprite;
      const gradient = spriteContext.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, "#fff6e8");
      gradient.addColorStop(0.12, color);
      gradient.addColorStop(0.35, `${color}66`);
      gradient.addColorStop(1, `${color}00`);
      spriteContext.fillStyle = gradient;
      spriteContext.fillRect(0, 0, 32, 32);
      return sprite;
    });

    let width = 0;
    let height = 0;
    let sparks: Spark[] = [];
    let frame = 0;
    let last = 0;
    let running = false;
    let visible = true;
    let animation = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(Math.round((width * height) / 10_000 * density), 140);
      sparks = Array.from({ length: count }, () => makeSpark(width, height, true));
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";
      for (const spark of sparks) {
        const heightFade = Math.max(0, Math.min(1, (spark.y / height) * 1.6)) * spark.life;
        const pulse = 0.75 + 0.25 * Math.sin(frame * 0.08 + spark.phase);
        const size = spark.r * 7;
        context.globalAlpha = heightFade * pulse;
        context.drawImage(sprites[spark.color], spark.x - size / 2, spark.y - size / 2, size, size);
      }
      context.globalAlpha = 1;
    };

    const tick = (time: number) => {
      const delta = last ? Math.min((time - last) / 16.67, 3) : 1;
      last = time;
      frame += delta;
      sparks = sparks.map((spark) => {
        const next = {
          ...spark,
          y: spark.y - spark.vy * delta,
          x: spark.x + Math.sin(frame * 0.012 * spark.drift + spark.phase) * 0.25 * delta,
        };
        return next.y < -10 ? makeSpark(width, height, false) : next;
      });
      draw();
      animation = requestAnimationFrame(tick);
    };

    const sync = () => {
      const shouldRun = visible && !document.hidden && !reduced;
      if (shouldRun && !running) {
        running = true;
        last = 0;
        animation = requestAnimationFrame(tick);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(animation);
      }
    };

    resize();
    draw();
    sync();
    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    resizeObserver.observe(canvas);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    intersectionObserver.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelAnimationFrame(animation);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [density]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

export function Afterglow({
  children,
  className = "",
  layout = "hero",
}: {
  children: ReactNode;
  className?: string;
  layout?: "hero" | "band";
}) {
  const noise = useNoise();
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className={`pointer-events-none absolute inset-0 z-0 ${layout === "band" ? "afterglow-band" : "afterglow"}`} aria-hidden>
        <div className="afterglow-horizon" />
        <Embers density={layout === "band" ? 0.5 : 1.1} />
        {noise ? <div className="absolute inset-0" style={{ backgroundImage: `url(${noise})` }} /> : null}
      </div>
      {children}
    </div>
  );
}
