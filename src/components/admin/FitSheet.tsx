"use client";

import { useEffect, useRef, useState } from "react";

const A4_PX = 794; // 210 mm pada 96 dpi
const MIN = 0.4;
const MAX = 2;
const STEP = 0.1;

/**
 * Menampilkan lembar A4 dengan kontrol perbesar/perkecil. Awalnya pas selebar layar;
 * saat dicetak, skala dilepas sehingga hasil cetak tetap A4 penuh.
 */
export function FitSheet({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  const [zoom, setZoom] = useState<number | null>(null); // null = pas layar
  const [height, setHeight] = useState<number | undefined>();

  const scale = zoom ?? fit;

  useEffect(() => {
    const el = box.current;
    const sheet = inner.current;
    if (!el || !sheet) return;
    const update = () => {
      setFit(Math.min(1, el.clientWidth / A4_PX));
      setHeight(sheet.offsetHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    ro.observe(sheet);
    return () => ro.disconnect();
  }, []);

  const set = (v: number) => setZoom(Math.min(MAX, Math.max(MIN, Math.round(v * 100) / 100)));

  return (
    <>
      <div className="ba-zoombar no-print" role="group" aria-label="Ukuran pratinjau">
        <button type="button" className="btn btn-g btn-sm" onClick={() => set(scale - STEP)} disabled={scale <= MIN} aria-label="Perkecil">−</button>
        <span className="ba-zoomval" aria-live="polite">{Math.round(scale * 100)}%</span>
        <button type="button" className="btn btn-g btn-sm" onClick={() => set(scale + STEP)} disabled={scale >= MAX} aria-label="Perbesar">+</button>
        <button type="button" className="btn btn-g btn-sm" onClick={() => setZoom(null)} disabled={zoom === null}>Pas layar</button>
        <button type="button" className="btn btn-g btn-sm" onClick={() => setZoom(1)} disabled={zoom === 1}>100%</button>
      </div>
      <div ref={box} className="ba-viewport">
        <div className="ba-canvas" style={{ width: A4_PX * scale, height: height !== undefined ? height * scale : undefined }}>
          <div ref={inner} className="ba-fit-in" style={{ transform: `scale(${scale})` }}>{children}</div>
        </div>
      </div>
    </>
  );
}
