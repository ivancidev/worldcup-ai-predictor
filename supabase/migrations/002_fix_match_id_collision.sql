-- Fix predictions.match_id collision.
--
-- The original scheme derived match_id by stripping non-digits from ids like
-- "H-0-1", which dropped the group letter. As a result every match that shared
-- team indices across groups (e.g. all twelve "0 vs 1" openers) collapsed onto
-- the same match_id and, via UNIQUE(user_id, match_id), overwrote one another —
-- so a user could only ever keep ~6 predictions total instead of 72.
--
-- New scheme (matches lib/world-cup-data.ts `groupMatchIdToNumber`):
--   match_id = groupIndex(0-11) * 100 + min(i,j) * 10 + max(i,j)
--   e.g. "H-0-1" -> 7*100 + 0*10 + 1 = 701   (range 0–1133)
--
-- Step 1 de-duplicates rows that map to the same real match (an old row under
-- the colliding id plus a newer row already saved under the new scheme), keeping
-- the most recent. Step 2 remaps the survivors. Uses CTEs (no temp tables) so it
-- runs cleanly in the Supabase SQL editor. Rows whose names don't map to a 2026
-- group team (legacy manual entries) are left untouched. Predictions already
-- lost to the collision cannot be recovered. Safe to run more than once.

BEGIN;

-- Step 1 — remove duplicate predictions for the same real match (keep newest).
WITH team_lookup(name, g, idx) AS (
  VALUES
    ('Mexico',0,0),('South Africa',0,1),('Korea Republic',0,2),('Czech Republic',0,3),
    ('Canada',1,0),('Bosnia & Herz.',1,1),('Qatar',1,2),('Switzerland',1,3),
    ('Brazil',2,0),('Morocco',2,1),('Haiti',2,2),('Scotland',2,3),
    ('USA',3,0),('Paraguay',3,1),('Australia',3,2),('Turkey',3,3),
    ('Germany',4,0),('Curaçao',4,1),('Ivory Coast',4,2),('Ecuador',4,3),
    ('Netherlands',5,0),('Japan',5,1),('Sweden',5,2),('Tunisia',5,3),
    ('Belgium',6,0),('Egypt',6,1),('Iran',6,2),('New Zealand',6,3),
    ('Spain',7,0),('Cape Verde',7,1),('Saudi Arabia',7,2),('Uruguay',7,3),
    ('France',8,0),('Senegal',8,1),('Iraq',8,2),('Norway',8,3),
    ('Argentina',9,0),('Algeria',9,1),('Austria',9,2),('Jordan',9,3),
    ('Portugal',10,0),('DR Congo',10,1),('Uzbekistan',10,2),('Colombia',10,3),
    ('England',11,0),('Croatia',11,1),('Ghana',11,2),('Panama',11,3)
),
ranked AS (
  SELECT
    p.id,
    ROW_NUMBER() OVER (
      PARTITION BY
        p.user_id,
        (th.g * 100 + LEAST(th.idx, ta.idx) * 10 + GREATEST(th.idx, ta.idx))
      ORDER BY p.created_at DESC, p.id DESC
    ) AS rn
  FROM public.predictions p
  JOIN team_lookup th ON p.home_team = th.name
  JOIN team_lookup ta ON p.away_team = ta.name AND ta.g = th.g
)
DELETE FROM public.predictions
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Step 2 — remap the survivors to their collision-free id.
WITH team_lookup(name, g, idx) AS (
  VALUES
    ('Mexico',0,0),('South Africa',0,1),('Korea Republic',0,2),('Czech Republic',0,3),
    ('Canada',1,0),('Bosnia & Herz.',1,1),('Qatar',1,2),('Switzerland',1,3),
    ('Brazil',2,0),('Morocco',2,1),('Haiti',2,2),('Scotland',2,3),
    ('USA',3,0),('Paraguay',3,1),('Australia',3,2),('Turkey',3,3),
    ('Germany',4,0),('Curaçao',4,1),('Ivory Coast',4,2),('Ecuador',4,3),
    ('Netherlands',5,0),('Japan',5,1),('Sweden',5,2),('Tunisia',5,3),
    ('Belgium',6,0),('Egypt',6,1),('Iran',6,2),('New Zealand',6,3),
    ('Spain',7,0),('Cape Verde',7,1),('Saudi Arabia',7,2),('Uruguay',7,3),
    ('France',8,0),('Senegal',8,1),('Iraq',8,2),('Norway',8,3),
    ('Argentina',9,0),('Algeria',9,1),('Austria',9,2),('Jordan',9,3),
    ('Portugal',10,0),('DR Congo',10,1),('Uzbekistan',10,2),('Colombia',10,3),
    ('England',11,0),('Croatia',11,1),('Ghana',11,2),('Panama',11,3)
)
UPDATE public.predictions p
SET match_id = th.g * 100 + LEAST(th.idx, ta.idx) * 10 + GREATEST(th.idx, ta.idx)
FROM team_lookup th, team_lookup ta
WHERE p.home_team = th.name
  AND p.away_team = ta.name
  AND th.g = ta.g;

COMMIT;
