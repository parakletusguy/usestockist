-- Migration: Add confirmation fields to transfer_ledger for receiving departments (e.g. Cube)
-- Date: 2026-09-07

ALTER TABLE public.transfer_ledger
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmed';

ALTER TABLE public.transfer_ledger
ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

ALTER TABLE public.transfer_ledger
ADD COLUMN IF NOT EXISTS confirmed_by text;

-- Index for querying pending vs confirmed transfers by destination
CREATE INDEX IF NOT EXISTS idx_transfer_ledger_dest_status 
ON public.transfer_ledger (destination, status, date DESC);
