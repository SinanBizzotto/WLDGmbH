update public.exercises
set
  name = 'Kurzhantel-Rack',
  muscle_group = 'Ganzkörper',
  equipment_type = 'Kurzhantel',
  exercise_type = 'Kraft',
  description = 'Freie Gewichte für vielseitiges Ganzkörpertraining.',
  instructions = array[
    'Passendes Gewicht kontrolliert entnehmen',
    'Kurzhanteln nach dem Training sicher zurücklegen'
  ],
  updated_at = now()
where id = '10000000-0000-4000-8000-000000000004';
