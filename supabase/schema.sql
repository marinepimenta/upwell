-- Tabela de perfis (estende o auth.users do Supabase)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  weight_initial numeric(5,2),
  weight_current numeric(5,2),
  glp1_status text check (glp1_status in ('using', 'used', 'never')),
  main_fear text,
  program_start_date date,
  onboarding_completed boolean default false,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Habilita RLS
alter table public.profiles enable row level security;

-- Políticas: usuária só acessa o próprio perfil
create policy "Usuária vê próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuária atualiza próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Usuária cria próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Função que cria perfil automaticamente ao cadastrar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger que dispara a função acima
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
