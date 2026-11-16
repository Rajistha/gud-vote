"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "./Toast";

const MAX_SIDE = 1400;

/** Mengecilkan foto di browser (maks 1400px, WebP/JPEG) supaya unggahan ringan. */
async function shrink(file: File): Promise<File> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k);
  const h = Math.round(bmp.height * k);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.86));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
}

/**
 * Unggah foto paslon. Berkas terolah dikirim lewat input file tersembunyi bernama `name`;
 * `remove_photo=1` dikirim bila foto yang ada ingin dihapus.
 */
export function ImageUploader({ name = "photo", current, disabled }: { name?: string; current?: string | null; disabled?: boolean }) {
  const toast = useToast();
  const pick = useRef<HTMLInputElement>(null);
  const out = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(current ?? null);
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const blobUrl = useRef<string | null>(null);

  useEffect(() => () => { if (blobUrl.current) URL.revokeObjectURL(blobUrl.current); }, []);

  async function handle(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast({ kind: "error", message: "Format foto harus JPG, PNG, atau WebP." });
      return;
    }
    setBusy(true);
    try {
      const small = await shrink(file);
      if (small.size > 3 * 1024 * 1024) { toast({ kind: "error", message: "Ukuran foto terlalu besar. Silakan pilih foto lain." }); return; }
      const dt = new DataTransfer();
      dt.items.add(small);
      if (out.current) out.current.files = dt.files;
      if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
      blobUrl.current = URL.createObjectURL(small);
      setPreview(blobUrl.current);
      setRemoved(false);
      toast({ kind: "info", message: `Foto dipilih. Simpan paslon untuk menerapkan.` });
    } catch {
      toast({ kind: "error", message: "Foto tidak dapat diproses. Silakan pilih berkas lain." });
    } finally {
      setBusy(false);
      if (pick.current) pick.current.value = "";
    }
  }

  function clear() {
    if (out.current) out.current.value = "";
    if (blobUrl.current) { URL.revokeObjectURL(blobUrl.current); blobUrl.current = null; }
    setPreview(null);
    setRemoved(true);
  }

  return (
    <div className="upl">
      <input ref={out} type="file" name={name} hidden />
      {removed && <input type="hidden" name="remove_photo" value="1" />}
      <input ref={pick} type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={disabled} onChange={(e) => handle(e.target.files?.[0])} />

      <div
        className={`upl-drop${over ? " over" : ""}${preview ? " has" : ""}`}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) void handle(e.dataTransfer.files?.[0]); }}
      >
        <div className="upl-prev">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Pratinjau foto paslon" />
          ) : (
            <span>Belum ada foto</span>
          )}
        </div>
        <div className="upl-side">
          <b>Foto paslon</b>
          <small>Rasio 3:4. Format JPG, PNG, atau WebP.</small>
          <div className="upl-btns">
            <button type="button" className="btn btn-s btn-sm" disabled={disabled || busy} onClick={() => pick.current?.click()}>
              {busy ? "Memproses…" : preview ? "Ganti foto" : "Pilih foto"}
            </button>
            {preview && <button type="button" className="btn btn-g btn-sm" disabled={disabled || busy} onClick={clear}>Hapus foto</button>}
          </div>
          <small className="upl-hint">atau tarik foto ke sini</small>
        </div>
      </div>
    </div>
  );
}
