-- Migration 020 : ajoute active_frame_id sur les profils
-- Permet de tracer le cadre équipé par le joueur (gagné à la roue).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_frame_id text;
