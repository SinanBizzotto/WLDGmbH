create table if not exists public.exercise_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  custom_name text,
  custom_muscle_group text,
  custom_equipment_type text,
  custom_exercise_type text,
  custom_description text,
  custom_instructions text[],
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

alter table public.exercise_preferences enable row level security;

create policy "exercise preferences own"
on public.exercise_preferences
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create trigger set_exercise_preferences_updated_at
before update on public.exercise_preferences
for each row execute function public.set_updated_at();

create index exercise_preferences_favorites_idx
on public.exercise_preferences(user_id, is_favorite)
where is_favorite;

insert into public.exercises
  (id, name, muscle_group, equipment_type, exercise_type, description, instructions, image_url, is_public)
values
  ('10000000-0000-4000-8000-000000000011','Bankdrücken','Brust','Langhantel','Kraft','Klassische Grundübung für Brust, Schulter und Trizeps.',array['Schulterblätter zurückziehen','Füße fest aufstellen','Hantel kontrolliert zur Brust senken'],'/assets/fitness/dumbbells.jpeg',true),
  ('10000000-0000-4000-8000-000000000012','Schrägbankdrücken','Brust','Kurzhantel','Kraft','Drückübung mit Fokus auf die obere Brust.',array['Bank moderat anstellen','Handgelenke stabil halten','Kurzhanteln kontrolliert führen'],'/assets/fitness/dumbbells.jpeg',true),
  ('10000000-0000-4000-8000-000000000013','Brustpresse','Brust','Maschine','Kraft','Geführtes Brusttraining mit stabiler Bewegung.',array['Sitzhöhe einstellen','Schultern tief halten','Arme nicht vollständig einrasten'],'/assets/fitness/dumbbells.jpeg',true),
  ('10000000-0000-4000-8000-000000000014','Kabel-Flys','Brust','Kabelzug','Kraft','Kontrollierte Adduktion für eine starke Brustkontraktion.',array['Leichte Ellenbogenbeugung halten','Kabel vor der Brust zusammenführen','Langsam zurückkehren'],'/assets/fitness/dumbbells.jpeg',true),
  ('10000000-0000-4000-8000-000000000015','Liegestütze','Brust','Körpergewicht','Kraft','Vielseitige Druckübung für Brust, Schulter und Rumpf.',array['Körperlinie stabil halten','Brust kontrolliert absenken','Boden kraftvoll wegdrücken'],'/assets/fitness/dumbbells.jpeg',true),
  ('10000000-0000-4000-8000-000000000016','Klimmzüge','Rücken','Körpergewicht','Kraft','Vertikaler Zug für Latissimus und Arme.',array['Schultern aktiv nach unten ziehen','Brust zur Stange führen','Kontrolliert ablassen'],'/assets/fitness/backextension.jpeg',true),
  ('10000000-0000-4000-8000-000000000017','Latzug','Rücken','Kabelzug','Kraft','Geführter vertikaler Zug für einen breiten Rücken.',array['Brust anheben','Stange zur oberen Brust ziehen','Schultern nicht hochziehen'],'/assets/fitness/backextension.jpeg',true),
  ('10000000-0000-4000-8000-000000000018','Langhantelrudern','Rücken','Langhantel','Kraft','Freier horizontaler Zug für den gesamten Rücken.',array['Rücken neutral halten','Hantel zum Bauch ziehen','Ellenbogen körpernah führen'],'/assets/fitness/backextension.jpeg',true),
  ('10000000-0000-4000-8000-000000000019','Einarmiges Kurzhantelrudern','Rücken','Kurzhantel','Kraft','Einseitiges Rückentraining mit großem Bewegungsumfang.',array['Rumpf stabilisieren','Ellenbogen zur Hüfte ziehen','Schulter kontrolliert absenken'],'/assets/fitness/dumbbells.jpeg',true),
  ('10000000-0000-4000-8000-000000000020','Face Pulls','Schulter','Kabelzug','Kraft','Zugbewegung für hintere Schulter und Schulterblattkontrolle.',array['Seil auf Gesichtshöhe einstellen','Hände neben das Gesicht ziehen','Schulterblätter zusammenführen'],'/assets/fitness/dumbbells.jpeg',true),
  ('10000000-0000-4000-8000-000000000021','Kniebeuge','Beine','Langhantel','Kraft','Grundübung für Oberschenkel, Gesäß und Rumpf.',array['Füße stabil platzieren','Knie folgen den Fußspitzen','Rumpf unter Spannung halten'],'/assets/fitness/hackenschmidt.jpeg',true),
  ('10000000-0000-4000-8000-000000000022','Kreuzheben','Ganzkörper','Langhantel','Kraft','Komplexe Zugübung für die gesamte hintere Kette.',array['Hantel nah am Körper halten','Rücken neutral stabilisieren','Hüfte und Knie gemeinsam strecken'],'/assets/fitness/backextension.jpeg',true),
  ('10000000-0000-4000-8000-000000000023','Rumänisches Kreuzheben','Beine','Langhantel','Kraft','Hüftdominante Übung für Beinbeuger und Gesäß.',array['Knie leicht beugen','Hüfte weit zurückschieben','Hantel eng an den Beinen führen'],'/assets/fitness/legcurl.jpeg',true),
  ('10000000-0000-4000-8000-000000000024','Hip Thrust','Beine','Langhantel','Kraft','Gezieltes Hüftstrecken mit Fokus auf das Gesäß.',array['Schulterblätter an der Bank ablegen','Kinn leicht einziehen','Hüfte vollständig strecken'],'/assets/fitness/legpress.jpeg',true),
  ('10000000-0000-4000-8000-000000000025','Bulgarian Split Squat','Beine','Kurzhantel','Kraft','Einbeinige Kniebeuge für Kraft und Stabilität.',array['Hinteren Fuß erhöht ablegen','Vorderes Knie stabil führen','Kontrolliert tief gehen'],'/assets/fitness/dumbbells.jpeg',true),
  ('10000000-0000-4000-8000-000000000026','Ausfallschritte','Beine','Kurzhantel','Kraft','Dynamisches einbeiniges Training für Beine und Gesäß.',array['Großen Schritt setzen','Oberkörper aufrecht halten','Über den vorderen Fuß hochdrücken'],'/assets/fitness/dumbbells.jpeg',true),
  ('10000000-0000-4000-8000-000000000027','Wadenheben','Beine','Maschine','Kraft','Kontrolliertes Training der Wadenmuskulatur.',array['Ferse weit absenken','Über den Fußballen hochdrücken','Oben kurz halten'],'/assets/fitness/legpress.jpeg',true),
  ('10000000-0000-4000-8000-000000000028','Schulterdrücken Langhantel','Schulter','Langhantel','Kraft','Vertikale Grundübung für Schulter und Trizeps.',array['Gesäß und Rumpf anspannen','Hantel über Kopf drücken','Rippen unten halten'],'/assets/fitness/dumbbells.jpeg',true),
  ('10000000-0000-4000-8000-000000000029','Seitheben','Schulter','Kurzhantel','Kraft','Isolationsübung für die seitliche Schulter.',array['Ellenbogen leicht beugen','Arme bis Schulterhöhe heben','Gewicht kontrolliert senken'],'/assets/fitness/dumbbells.jpeg',true),
  ('10000000-0000-4000-8000-000000000030','Reverse Flys','Schulter','Maschine','Kraft','Gezieltes Training der hinteren Schulter.',array['Brust am Polster halten','Arme nach außen führen','Schulterblätter kontrollieren'],'/assets/fitness/dumbbells.jpeg',true),
  ('10000000-0000-4000-8000-000000000031','Bizeps-Curls','Arme','Kurzhantel','Kraft','Klassische Armbeugung für den Bizeps.',array['Ellenbogen ruhig halten','Ohne Schwung beugen','Langsam absenken'],'/assets/fitness/dumbbells.jpeg',true),
  ('10000000-0000-4000-8000-000000000032','Hammer Curls','Arme','Kurzhantel','Kraft','Neutraler Griff für Bizeps und Unterarme.',array['Handflächen zeigen zueinander','Ellenbogen am Körper halten','Kontrolliert bewegen'],'/assets/fitness/dumbbells.jpeg',true),
  ('10000000-0000-4000-8000-000000000033','Trizepsdrücken','Arme','Kabelzug','Kraft','Kontrollierte Ellenbogenstreckung am Kabelzug.',array['Oberarme ruhig halten','Unterarme vollständig strecken','Gewicht langsam zurückführen'],'/assets/fitness/dumbbells.jpeg',true),
  ('10000000-0000-4000-8000-000000000034','French Press','Arme','Kurzhantel','Kraft','Überkopfstrecken mit Fokus auf den langen Trizepskopf.',array['Oberarme senkrecht halten','Gewicht hinter den Kopf senken','Ellenbogen kontrolliert strecken'],'/assets/fitness/dumbbells.jpeg',true),
  ('10000000-0000-4000-8000-000000000035','Unterarmstütz','Bauch','Körpergewicht','Kraft','Isometrische Rumpfübung für Stabilität und Körperspannung.',array['Ellenbogen unter den Schultern','Gesäß und Bauch anspannen','Körperlinie stabil halten'],'/assets/fitness/crunch.jpeg',true),
  ('10000000-0000-4000-8000-000000000036','Beinheben','Bauch','Körpergewicht','Kraft','Dynamische Rumpfübung mit Fokus auf den unteren Bauch.',array['Unteren Rücken stabil halten','Beine kontrolliert anheben','Nicht ins Hohlkreuz fallen'],'/assets/fitness/crunch.jpeg',true),
  ('10000000-0000-4000-8000-000000000037','Russian Twists','Bauch','Körpergewicht','Kraft','Rotationsübung für die seitliche Rumpfmuskulatur.',array['Brust anheben','Rumpf kontrolliert drehen','Becken stabil halten'],'/assets/fitness/crunch.jpeg',true),
  ('10000000-0000-4000-8000-000000000038','Kabel-Crunches','Bauch','Kabelzug','Kraft','Belastbare Rumpfbeugung am Kabelzug.',array['Hüfte ruhig halten','Brustbein zum Becken führen','Bauch aktiv einrollen'],'/assets/fitness/crunch.jpeg',true),
  ('10000000-0000-4000-8000-000000000039','Burpees','Ganzkörper','Körpergewicht','Kraft','Intensive Ganzkörperübung für Kraft und Ausdauer.',array['Stabil in den Stütz springen','Brust kontrolliert senken','Explosiv aufrichten'],'/assets/fitness/treadmill.jpeg',true)
on conflict (id) do update set
  name = excluded.name,
  muscle_group = excluded.muscle_group,
  equipment_type = excluded.equipment_type,
  exercise_type = excluded.exercise_type,
  description = excluded.description,
  instructions = excluded.instructions,
  image_url = excluded.image_url,
  is_public = true,
  updated_at = now();
