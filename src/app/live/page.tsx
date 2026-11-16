import type { Metadata } from "next";
import { getLiveSnapshot } from "@/lib/live";
import { LiveBoard } from "@/components/live/LiveBoard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Live count · Regenerasi Girl Up Diponegoro",
  robots: { index: false, follow: false },
};

/** Layar publik perolehan suara. Dapat dibuka siapa saja; isinya diatur panitia dari panel admin. */
export default async function Live() {
  const initial = await getLiveSnapshot();
  return <LiveBoard initial={initial} />;
}
