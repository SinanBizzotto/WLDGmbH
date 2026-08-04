-- Several self-writable tables had no sanity constraints on their numeric
-- columns (unlike water_logs.amount_ml / body_measurements.weight_kg, which
-- already had them) — a buggy client or a user editing requests directly
-- could write negative/nonsensical values into their own history. RLS only
-- restricts by ownership, not by value range, so this needs to be enforced
-- here. Verified against the current data first: zero rows would violate
-- any of these.

alter table public.workout_sets
  add constraint workout_sets_weight_kg_check check (weight_kg >= 0),
  add constraint workout_sets_actual_reps_check check (actual_reps >= 0),
  add constraint workout_sets_planned_reps_check check (planned_reps >= 0),
  add constraint workout_sets_set_number_check check (set_number > 0);

alter table public.meals
  add constraint meals_calories_check check (calories >= 0),
  add constraint meals_protein_g_check check (protein_g >= 0),
  add constraint meals_carbs_g_check check (carbs_g >= 0),
  add constraint meals_fat_g_check check (fat_g >= 0);

alter table public.meal_entries
  add constraint meal_entries_amount_g_check check (amount_g >= 0),
  add constraint meal_entries_calories_check check (calories >= 0),
  add constraint meal_entries_protein_g_check check (protein_g >= 0),
  add constraint meal_entries_carbs_g_check check (carbs_g >= 0),
  add constraint meal_entries_fat_g_check check (fat_g >= 0);

alter table public.nutrition_goals
  add constraint nutrition_goals_calories_check check (calories > 0),
  add constraint nutrition_goals_protein_g_check check (protein_g >= 0),
  add constraint nutrition_goals_carbs_g_check check (carbs_g >= 0),
  add constraint nutrition_goals_fat_g_check check (fat_g >= 0),
  add constraint nutrition_goals_water_goal_ml_check check (water_goal_ml > 0);

alter table public.personal_records
  add constraint personal_records_weight_kg_check check (weight_kg > 0);

-- meal_entries.meal_id is joined on every select/insert/update/delete via
-- the RLS policy on public.meals, but had no supporting index (unlike
-- every other FK-through-owner table, e.g. workout_sets.session_id).
create index if not exists meal_entries_meal_id_idx on public.meal_entries(meal_id);
