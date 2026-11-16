"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getSettings, phaseOf } from "@/lib/election";
import { hashDevice, hashVenueCode, newDeviceToken, rateLimit, rateLimitHit, rateLimitOpen, safeEqual } from "@/lib/security";
import { DEVICE_COOKIE, DONE_COOKIE, VENUE_COOKIE, clientIp, venueOk } from "@/lib/voter";

export type FormState = { error?: string } | undefined;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function enterVenueCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await clientIp();
  // Yang dibatasi hanya kode yang salah: puluhan pemilih di satu Wi-Fi lokasi (satu IP) tetap bisa masuk bersamaan.
  if (!rateLimitOpen(`venue-fail:${ip}`, 10)) return { error: "Terlalu banyak percobaan. Silakan coba beberapa saat lagi." };

  const s = await getSettings();
  const code = String(formData.get("code") ?? "");
  if (!s.venue_code_hash || !safeEqual(hashVenueCode(code), s.venue_code_hash)) {
    rateLimitHit(`venue-fail:${ip}`, 60_000);
    return { error: "Kode tidak sesuai. Silakan hubungi panitia di lokasi." };
  }
  (await cookies()).set(VENUE_COOKIE, s.venue_code_hash, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8,
  });
  redirect("/e-vote");
}

export async function castVote(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await clientIp();
  // Banyak pemilih berbagi satu IP di lokasi, jadi batasnya longgar; pengaman utamanya adalah jadwal dan satu-perangkat-satu-suara.
  if (!rateLimit(`vote:${ip}`, 600, 60_000)) return { error: "Terlalu banyak percobaan. Silakan coba beberapa saat lagi." };

  const s = await getSettings();
  if (phaseOf(s) !== "open") redirect("/e-vote");
  if (!(await venueOk(s))) redirect("/e-vote");

  const choice = String(formData.get("choice") ?? "");
  const blank = choice === "blank";
  if (!blank && !UUID.test(choice)) return { error: "Silakan pilih satu Pasangan Calon." };

  const jar = await cookies();
  let deviceToken = jar.get(DEVICE_COOKIE)?.value ?? null;
  let deviceHash: string | null = null;
  if (s.require_device_guard) {
    deviceToken ??= newDeviceToken();
    deviceHash = hashDevice(deviceToken);
  }

  let failure: string | null = null;
  try {
    await query("SELECT cast_vote($1, $2, $3)", [blank ? null : choice, blank, deviceHash]);
  } catch (e) {
    failure = e instanceof Error ? e.message : "";
  }

  if (failure) {
    if (failure.includes("VOTING_NOT_OPEN")) redirect("/e-vote");
    if (failure.includes("ALREADY_VOTED_ON_DEVICE")) redirect("/e-vote");
    if (failure.includes("BLANK_NOT_ALLOWED")) return { error: "Kotak Kosong tidak tersedia." };
    if (failure.includes("INVALID_CANDIDATE")) return { error: "Pasangan Calon tidak ditemukan. Silakan muat ulang halaman." };
    console.error("cast_vote gagal:", failure);
    return { error: "Suara belum terkirim. Silakan coba lagi atau hubungi panitia." };
  }

  const cookieOpts = { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" } as const;
  if (deviceHash && deviceToken) jar.set(DEVICE_COOKIE, deviceToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 });
  jar.delete(VENUE_COOKIE);
  jar.set(DONE_COOKIE, "1", { ...cookieOpts, maxAge: 300 });
  redirect("/selesai");
}

/** Dipanggil saat layar "suara tercatat" kembali ke awal untuk pemilih berikutnya. */
export async function resetBooth() {
  (await cookies()).delete(DONE_COOKIE);
}
