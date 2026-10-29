"use client";
import {useEffect,useRef,useState} from "react";
import {PICTURE_WIDTH,PICTURE_HEIGHT} from "@/lib/picture-presentation";
export function Pixel({
  svg,
  start,
  seconds,
  now,
}: {
  svg: string;
  start: number;
  seconds: number;
  now: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    img = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    img.current = null;
    setLoaded(false);
    setFailed(false);
    const i = new Image();
    i.onload = () => {
      img.current = i;
      setLoaded(true);
    };
    i.onerror = () => setFailed(true);
    i.src = svg.startsWith("/")
      ? svg
      : "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    return () => {
      i.onload = null;
      i.onerror = null;
      img.current = null;
    };
  }, [svg]);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !img.current) return;
    const ctx = canvas.getContext("2d")!,
      small = document.createElement("canvas"),
      progress = Math.max(0, Math.min(1, (now - start) / (seconds * 1000))),
      w = Math.round(5 + progress ** 2 * 220);
    small.width = w;
    small.height = Math.round((w * PICTURE_HEIGHT) / PICTURE_WIDTH);
    const sc = small.getContext("2d")!;
    sc.fillStyle = "#142b3c";
    sc.fillRect(0, 0, small.width, small.height);
    const fit = Math.min(
      small.width / img.current.naturalWidth,
      small.height / img.current.naturalHeight,
    );
    const iw = img.current.naturalWidth * fit,
      ih = img.current.naturalHeight * fit;
    sc.drawImage(
      img.current,
      (small.width - iw) / 2,
      (small.height - ih) / 2,
      iw,
      ih,
    );
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, PICTURE_WIDTH, PICTURE_HEIGHT);
    ctx.drawImage(small, 0, 0, PICTURE_WIDTH, PICTURE_HEIGHT);
  }, [now, start, seconds, loaded]);
  return (
    <div className="pixel-photo-stage">
      {!loaded && (
        <p role="status">
          {failed
            ? "Das Foto konnte nicht geladen werden. Bitte lade die Seite neu."
            : "Foto wird geladen …"}
        </p>
      )}
      <canvas
        ref={ref}
        width={PICTURE_WIDTH}
        height={PICTURE_HEIGHT}
        className="pixel-canvas"
        data-picture-ready={loaded}
        data-picture-source={svg}
        aria-label="Schrittweise aufgedecktes Rätselbild"
      />
      <span className="photo-progress">
        ECHTES FOTO ·{" "}
        {Math.min(100, Math.max(0, Math.round((now - start) / (seconds * 10))))}
        % aufgedeckt
      </span>
    </div>
  );
}
