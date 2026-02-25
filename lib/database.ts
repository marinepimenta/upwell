import { supabase } from './supabase';
import type { CheckinData, Glp1Application, Glp1SymptomsRecord } from '@/utils/storage';

// --- Helpers: map DB rows <-> app types ---

type CheckinRow = {
  date: string;
  trained: boolean;
  drank_water: boolean;
  slept_well: boolean;
  food_adherence: 'sim' | 'mais_ou_menos' | 'nao';
  food_contexts: string[];
  food_notes: string | null;
  mood: 'bem' | 'normal' | 'cansada';
  shield_activated: boolean;
};

function rowToCheckin(row: CheckinRow): CheckinData {
  return {
    date: row.date,
    treinou: row.trained,
    bebeuAgua: row.drank_water,
    dormiuBem: row.slept_well,
    adesaoAlimentar: row.food_adherence,
    contextosAlimentar: (row.food_contexts || []) as CheckinData['contextosAlimentar'],
    textoLivre: row.food_notes ?? undefined,
    humor: row.mood,
    escudoAtivado: row.shield_activated,
  };
}

function checkinToRow(c: CheckinData): Omit<CheckinRow, 'date'> & { date: string } {
  return {
    date: c.date,
    trained: c.treinou,
    drank_water: c.bebeuAgua,
    slept_well: c.dormiuBem,
    food_adherence: c.adesaoAlimentar,
    food_contexts: c.contextosAlimentar ?? [],
    food_notes: c.textoLivre ?? null,
    mood: c.humor,
    shield_activated: c.escudoAtivado,
  };
}

// --- Profile ---

export type Profile = {
  id: string;
  name: string | null;
  weight_initial: number | null;
  weight_current: number | null;
  glp1_status: 'using' | 'used' | 'never' | null;
  main_fear: string | null;
  program_start_date: string | null;
  onboarding_completed: boolean;
};

export async function getProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return data as Profile | null;
}

export async function updateProfile(updates: Partial<Profile>): Promise<unknown> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return undefined;
  return supabase.from('profiles').update(updates).eq('id', user.id);
}

// --- Check-ins ---

export async function saveCheckin(checkin: CheckinData): Promise<unknown> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return undefined;
  const row = checkinToRow(checkin);
  return supabase.from('checkins').upsert(
    { user_id: user.id, ...row },
    { onConflict: 'user_id,date' }
  );
}

// Retorna a data local no formato YYYY-MM-DD (respeita o fuso do dispositivo)
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function getTodayCheckin(): Promise<CheckinData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const today = localDateStr();
  const { data } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();
  if (!data) return null;
  return rowToCheckin(data as CheckinRow);
}

export async function getCheckinsByMonth(year: number, month: number): Promise<CheckinData[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const { data } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true });
  return (data || []).map((row) => rowToCheckin(row as CheckinRow));
}

// Segunda=0 … Domingo=6
const DAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export async function getLastSevenDaysCheckins(): Promise<
  { date: string; label: string; done: boolean }[]
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Usa hora LOCAL do dispositivo (fuso brasileiro)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb local
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // Segunda-feira local da semana atual
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);

  const start = localDateStr(monday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const end = localDateStr(sunday);

  const { data } = await supabase
    .from('checkins')
    .select('date')
    .eq('user_id', user.id)
    .gte('date', start)
    .lte('date', end);

  const set = new Set((data || []).map((r: { date: string }) => r.date));

  const result: { date: string; label: string; done: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = localDateStr(d);
    result.push({
      date: dateStr,
      label: DAY_LABELS[i],
      done: set.has(dateStr),
    });
  }
  return result;
}

export async function getLastSevenDaysCheckinsFull(): Promise<CheckinData[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const start = sevenDaysAgo.toISOString().split('T')[0];
  const { data } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', start)
    .order('date', { ascending: true });
  return (data || []).map((row) => rowToCheckin(row as CheckinRow));
}

export async function calculateStreak(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data } = await supabase
    .from('checkins')
    .select('date, shield_activated')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(90);
  if (!data || data.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < data.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    const isSameDay = data[i].date === localDateStr(expectedDate);
    if (isSameDay) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// --- Weekly & Monthly metrics ---

export type WeeklyMetrics = {
  treinos: number;
  agua: number;
  sono: number;
  alimentacao: number;
  desafiosAlimentares: number;
  totalCheckins: number;
};

export type MonthlyMetrics = WeeklyMetrics & {
  escudosUsados: number;
  contextos: Record<string, number>;
};

export async function getWeeklyMetrics(): Promise<WeeklyMetrics | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const { data } = await supabase
    .from('checkins')
    .select('trained, drank_water, slept_well, food_adherence, shield_activated, date')
    .eq('user_id', user.id)
    .gte('date', localDateStr(monday))
    .lte('date', localDateStr(sunday));

  const rows = data || [];
  return {
    treinos: rows.filter((c: CheckinRow) => c.trained).length,
    agua: rows.filter((c: CheckinRow) => c.drank_water).length,
    sono: rows.filter((c: CheckinRow) => c.slept_well).length,
    alimentacao: rows.filter((c: CheckinRow) => c.food_adherence === 'sim').length,
    desafiosAlimentares: rows.filter(
      (c: CheckinRow) => c.food_adherence === 'mais_ou_menos' || c.food_adherence === 'nao'
    ).length,
    totalCheckins: rows.length,
  };
}

export async function getMonthlyMetrics(): Promise<MonthlyMetrics | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const checkins = await getCheckinsByMonth(now.getFullYear(), now.getMonth() + 1);
  const contextosMap: Record<string, number> = {};
  for (const c of checkins) {
    for (const ctx of c.contextosAlimentar ?? []) {
      contextosMap[ctx] = (contextosMap[ctx] || 0) + 1;
    }
  }
  return {
    treinos: checkins.filter((c) => c.treinou).length,
    agua: checkins.filter((c) => c.bebeuAgua).length,
    sono: checkins.filter((c) => c.dormiuBem).length,
    alimentacao: checkins.filter((c) => c.adesaoAlimentar === 'sim').length,
    desafiosAlimentares: checkins.filter(
      (c) => c.adesaoAlimentar === 'mais_ou_menos' || c.adesaoAlimentar === 'nao'
    ).length,
    escudosUsados: checkins.filter((c) => c.escudoAtivado).length,
    contextos: contextosMap,
    totalCheckins: checkins.length,
  };
}

export async function getTotalCheckinsCount(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);
  return count ?? 0;
}

// --- Weight records ---

export async function saveWeightRecord(record: {
  date?: string;
  weight: number;
  contexts?: string[];
  notes?: string;
}): Promise<unknown> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return undefined;
  const date = record.date ?? new Date().toISOString().split('T')[0];
  return supabase.from('weight_records').insert({
    user_id: user.id,
    date,
    weight: record.weight,
    contexts: record.contexts ?? [],
    notes: record.notes ?? null,
  });
}

export async function getWeightRecords(): Promise<
  { id: string; date: string; weight: number; contexts: string[]; notes: string | null }[]
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('weight_records')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true });
  return (data || []).map((r: { id: string; date: string; weight: number; contexts?: string[]; notes?: string | null }) => ({
    id: r.id,
    date: r.date,
    weight: r.weight,
    contexts: r.contexts ?? [],
    notes: r.notes ?? null,
  }));
}

// --- GLP-1 applications ---

export async function saveGlp1Application(application: Glp1Application): Promise<unknown> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return undefined;
  const d = new Date(application.date);
  d.setDate(d.getDate() + 7);
  const next_application_date = d.toISOString().split('T')[0];
  return supabase.from('glp1_applications').insert({
    user_id: user.id,
    date: application.date,
    medication: application.medication,
    dose: application.dose,
    notes: application.observation ?? null,
    next_application_date,
  });
}

export async function getGlp1Applications(): Promise<Glp1Application[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('glp1_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(10);
  return (data || []).map(
    (r: { date: string; medication: string; dose: string; notes?: string | null }) => ({
      date: r.date,
      medication: r.medication,
      dose: r.dose,
      observation: r.notes ?? undefined,
    })
  );
}

export async function getNextGlp1ApplicationDate(): Promise<string | null> {
  const list = await getGlp1Applications();
  if (list.length === 0) return null;
  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
  const last = sorted[0];
  const d = new Date(last.date);
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

// --- GLP-1 symptoms ---

export async function saveGlp1Symptoms(symptoms: string[]): Promise<unknown> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return undefined;
  const today = new Date().toISOString().split('T')[0];
  return supabase
    .from('glp1_symptoms')
    .upsert({ user_id: user.id, date: today, symptoms }, { onConflict: 'user_id,date' });
}

export async function getGlp1Symptoms(): Promise<Glp1SymptomsRecord[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('glp1_symptoms')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(10);
  return (data || []).map((r: { date: string; symptoms: string[] }) => ({
    date: r.date,
    symptoms: r.symptoms ?? [],
  }));
}
