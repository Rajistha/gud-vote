-- Skema E-Voting GUD 2027 (PostgreSQL). Idempotent: aman dijalankan berulang.

CREATE TABLE IF NOT EXISTS candidates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number          int  NOT NULL UNIQUE,
  president_name  text NOT NULL,
  vice_name       text NOT NULL,
  tagline         text,
  president_info  text,
  vice_info       text,
  photo_url       text,
  vision          text,
  mission         text,
  programs        text,
  video_url       text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Tanpa identitas pemilih dan tanpa timestamp
CREATE TABLE IF NOT EXISTS votes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  uuid REFERENCES candidates(id),
  is_blank      boolean NOT NULL DEFAULT false,
  CHECK ( (candidate_id IS NOT NULL AND is_blank = false)
       OR (candidate_id IS NULL AND is_blank = true) )
);

CREATE TABLE IF NOT EXISTS admins (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email  text NOT NULL UNIQUE,
  name   text
);

-- Hanya ada satu peran (semua panitia setara). Untuk database lama yang masih punya kolom role.
ALTER TABLE admins DROP COLUMN IF EXISTS role;

-- Hitungan kehadiran: satu ketukan = satu baris. Koreksi = baris baru delta -1
CREATE TABLE IF NOT EXISTS check_ins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid NOT NULL REFERENCES admins(id),
  delta       smallint NOT NULL CHECK (delta IN (1, -1)),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Opsional: satu perangkat satu suara. Tanpa waktu dan tanpa relasi ke votes
CREATE TABLE IF NOT EXISTS device_guards (
  token_hash  text PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS election_settings (
  id                    int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title                 text NOT NULL,
  opens_at              timestamptz,
  closes_at             timestamptz,
  status                text NOT NULL DEFAULT 'upcoming'
                        CHECK (status IN ('upcoming','open','closed')),
  eligible_total        int,
  show_live_breakdown   boolean NOT NULL DEFAULT true,
  require_venue_code    boolean NOT NULL DEFAULT false,
  venue_code_hash       text,
  require_device_guard  boolean NOT NULL DEFAULT false,
  allow_blank           boolean NOT NULL DEFAULT false,
  public_live           boolean NOT NULL DEFAULT false,
  attendance_final      int,
  reconciliation_note   text,
  reconciled_at         timestamptz,
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Untuk database yang dibuat sebelum kolom ini ada
ALTER TABLE election_settings ADD COLUMN IF NOT EXISTS allow_blank boolean NOT NULL DEFAULT false;
ALTER TABLE election_settings ADD COLUMN IF NOT EXISTS public_live boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid REFERENCES admins(id),
  action      text NOT NULL,
  detail      jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_created  ON check_ins (created_at DESC);

-- Mencatat satu suara dalam satu transaksi.
-- Jadwal dicek di sini (server menolak suara di luar jadwal, FR-07).
-- 'status = closed' berarti ditutup manual (tutup darurat) atau sudah direkonsiliasi.
CREATE OR REPLACE FUNCTION cast_vote(
  p_candidate   uuid,
  p_blank       boolean DEFAULT false,
  p_device_hash text    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  s election_settings%ROWTYPE;
BEGIN
  SELECT * INTO s FROM election_settings WHERE id = 1;
  IF NOT FOUND OR s.status = 'closed'
     OR s.opens_at IS NULL OR s.closes_at IS NULL
     OR now() < s.opens_at OR now() > s.closes_at THEN
    RAISE EXCEPTION 'VOTING_NOT_OPEN';
  END IF;

  IF p_blank THEN
    IF NOT s.allow_blank THEN RAISE EXCEPTION 'BLANK_NOT_ALLOWED'; END IF;
  ELSIF NOT EXISTS (SELECT 1 FROM candidates WHERE id = p_candidate) THEN
    RAISE EXCEPTION 'INVALID_CANDIDATE';
  END IF;

  IF s.require_device_guard THEN
    IF p_device_hash IS NULL THEN RAISE EXCEPTION 'DEVICE_REQUIRED'; END IF;
    BEGIN
      INSERT INTO device_guards (token_hash) VALUES (p_device_hash);
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'ALREADY_VOTED_ON_DEVICE';
    END;
  END IF;

  INSERT INTO votes (candidate_id, is_blank)
  VALUES (CASE WHEN p_blank THEN NULL ELSE p_candidate END, p_blank);
END;
$$;

-- ---------------------------------------------------------------
-- Keamanan untuk Supabase: tabel di schema public otomatis terbuka lewat
-- API REST publik (anon key). Aktifkan RLS tanpa policy = semua ditolak untuk
-- anon/authenticated. Aplikasi memakai koneksi database langsung (role postgres),
-- yang tidak terpengaruh RLS.
-- ---------------------------------------------------------------
ALTER TABLE candidates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins             ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins          ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_guards      ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;

-- cast_vote hanya boleh dipanggil server aplikasi, bukan lewat RPC publik.
REVOKE ALL ON FUNCTION cast_vote(uuid, boolean, text) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON FUNCTION cast_vote(uuid, boolean, text) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON FUNCTION cast_vote(uuid, boolean, text) FROM authenticated;
  END IF;
END $$;
