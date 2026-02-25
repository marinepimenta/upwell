-- Tabela de check-ins
create table public.checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  trained boolean default false,
  drank_water boolean default false,
  slept_well boolean default false,
  food_adherence text check (food_adherence in ('sim', 'mais_ou_menos', 'nao')),
  food_contexts text[] default '{}',
  food_notes text,
  mood text check (mood in ('bem', 'normal', 'cansada')),
  shield_activated boolean default false,
  created_at timestamp with time zone default timezone('utc', now()),
  unique(user_id, date)
);

alter table public.checkins enable row level security;

create policy "Usuária gerencia próprios checkins"
  on public.checkins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tabela de registros de peso
create table public.weight_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  weight numeric(5,2) not null,
  contexts text[] default '{}',
  notes text,
  created_at timestamp with time zone default timezone('utc', now())
);

alter table public.weight_records enable row level security;

create policy "Usuária gerencia próprios pesos"
  on public.weight_records for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tabela de aplicações GLP-1
create table public.glp1_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  medication text not null,
  dose text not null,
  notes text,
  next_application_date date,
  created_at timestamp with time zone default timezone('utc', now())
);

alter table public.glp1_applications enable row level security;

create policy "Usuária gerencia próprias aplicações"
  on public.glp1_applications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tabela de sintomas GLP-1
create table public.glp1_symptoms (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  symptoms text[] default '{}',
  created_at timestamp with time zone default timezone('utc', now()),
  unique(user_id, date)
);

alter table public.glp1_symptoms enable row level security;

create policy "Usuária gerencia próprios sintomas"
  on public.glp1_symptoms for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
