-- Migration: Stay selection becomes per-city night allocation.
-- `selected` (boolean) is replaced by `nights` (integer): how many nights of
-- the city stay the user assigned to this option. 0 = not picked.

ALTER TABLE public."Stay" ADD COLUMN nights integer NOT NULL DEFAULT 0;
ALTER TABLE public."Stay" DROP COLUMN selected;
