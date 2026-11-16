import "server-only";

/**
 * Cache memori berumur pendek untuk data yang dibaca pengunjung publik (pengaturan, paslon, live count).
 * Ribuan permintaan dalam beberapa detik hanya memicu satu pembacaan database, dan permintaan yang
 * bersamaan berbagi satu pembacaan. Cache dikosongkan otomatis setiap kali panitia mengubah data.
 */
const values = new Map<string, { at: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = values.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;

  let p = inflight.get(key) as Promise<T> | undefined;
  if (!p) {
    p = load()
      .then((v) => {
        values.set(key, { at: Date.now(), value: v });
        return v;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, p);
  }
  return p;
}

export function invalidateCache() {
  values.clear();
}
