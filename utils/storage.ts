import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@upwell:onboarding_data';

export interface OnboardingData {
  name: string;
  glp1Status: 'using' | 'used' | 'never';
  mainFear: 'rebound' | 'muscle' | 'nutrition' | 'loneliness';
  currentWeight: number;
  initialWeight?: number; // peso ao completar onboarding
  onboardingCompleted: boolean;
  onboardingDate: string; // ISO date
}

export async function getOnboardingData(): Promise<OnboardingData | null> {
  try {
    const data = await AsyncStorage.getItem(ONBOARDING_KEY);
    if (data) {
      return JSON.parse(data) as OnboardingData;
    }
    return null;
  } catch (error) {
    console.error('Error reading onboarding data:', error);
    return null;
  }
}

export async function saveOnboardingData(data: Partial<OnboardingData>): Promise<void> {
  try {
    const existing = await getOnboardingData();
    const completed = data.onboardingCompleted ?? existing?.onboardingCompleted ?? false;
    const currentWeight = data.currentWeight ?? existing?.currentWeight ?? 0;
    const updated: OnboardingData = {
      name: data.name ?? existing?.name ?? '',
      glp1Status: data.glp1Status ?? existing?.glp1Status ?? 'never',
      mainFear: data.mainFear ?? existing?.mainFear ?? 'rebound',
      currentWeight,
      initialWeight: existing?.initialWeight ?? (completed ? currentWeight : undefined),
      onboardingCompleted: completed,
      onboardingDate: data.onboardingDate ?? existing?.onboardingDate ?? new Date().toISOString(),
    };
    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    throw error;
  }
}

export async function isOnboardingCompleted(): Promise<boolean> {
  try {
    const data = await getOnboardingData();
    return data?.onboardingCompleted ?? false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

export async function clearOnboardingData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Error clearing onboarding data:', error);
  }
}

// --- Check-ins ---
const CHECKINS_KEY = '@upwell:checkins';
const STREAK_KEY = '@upwell:streak';
const SHIELD_USED_KEY = '@upwell:shield_used_week'; // ISO week string

export type AdesaoAlimentar = 'sim' | 'mais_ou_menos' | 'nao';
export type HumorCheckin = 'bem' | 'normal' | 'cansada';
export type ContextoAlimentar = 'evento_social' | 'ansiedade_estresse' | 'fome_fora_de_hora' | 'nao_tive_opcao_melhor';

export interface CheckinData {
  date: string; // YYYY-MM-DD
  treinou: boolean;
  bebeuAgua: boolean;
  dormiuBem: boolean;
  adesaoAlimentar: AdesaoAlimentar;
  contextosAlimentar: ContextoAlimentar[];
  textoLivre?: string;
  humor: HumorCheckin;
  escudoAtivado: boolean;
}

export async function getCheckins(): Promise<CheckinData[]> {
  try {
    const data = await AsyncStorage.getItem(CHECKINS_KEY);
    if (data) return JSON.parse(data);
    return [];
  } catch (error) {
    console.error('Error reading checkins:', error);
    return [];
  }
}

export async function saveCheckin(checkin: CheckinData): Promise<void> {
  const list = await getCheckins();
  const withoutToday = list.filter((c) => c.date !== checkin.date);
  await AsyncStorage.setItem(CHECKINS_KEY, JSON.stringify([...withoutToday, checkin]));
  await updateStreak();
}

function getWeekKey(d: Date): string {
  const start = new Date(d);
  const day = start.getDay(); // 0=dom, 1=seg, ...
  const diff = day === 0 ? 6 : day - 1; // segunda = início da semana
  start.setDate(start.getDate() - diff);
  return start.toISOString().slice(0, 10);
}

export async function getCheckinByDate(dateStr: string): Promise<CheckinData | null> {
  const list = await getCheckins();
  return list.find((c) => c.date === dateStr) ?? null;
}

export async function didCheckinToday(): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const c = await getCheckinByDate(today);
  return !!c;
}

export async function getStreak(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    if (raw) return parseInt(raw, 10);
    return 0;
  } catch {
    return 0;
  }
}

async function updateStreak(): Promise<void> {
  const list = await getCheckins();
  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let expect = today;
  for (const c of sorted) {
    if (c.date !== expect) break;
    streak++;
    const d = new Date(expect);
    d.setDate(d.getDate() - 1);
    expect = d.toISOString().slice(0, 10);
  }
  await AsyncStorage.setItem(STREAK_KEY, String(streak));
}

export async function getShieldUsedThisWeek(): Promise<boolean> {
  const weekKey = getWeekKey(new Date());
  const used = await AsyncStorage.getItem(SHIELD_USED_KEY);
  return used === weekKey;
}

export async function setShieldUsedThisWeek(): Promise<void> {
  const weekKey = getWeekKey(new Date());
  await AsyncStorage.setItem(SHIELD_USED_KEY, weekKey);
}

/** Últimos 7 dias (seg a dom) com flag de check-in feito. [0]=mais antigo. */
export async function getLast7DaysCheckins(): Promise<{ date: string; label: string; done: boolean }[]> {
  const result: { date: string; label: string; done: boolean }[] = [];
  const checkins = await getCheckins();
  const set = new Set(checkins.map((c) => c.date));
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayIdx = (d.getDay() + 6) % 7; // seg=0
    result.push({
      date: dateStr,
      label: days[dayIdx],
      done: set.has(dateStr),
    });
  }
  return result;
}

/** Check-ins completos dos últimos 7 dias (para métricas de ritmo). */
export async function getLast7DaysCheckinsFull(): Promise<CheckinData[]> {
  const list = await getCheckins();
  const result: CheckinData[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const c = list.find((x) => x.date === dateStr);
    if (c) result.push(c);
  }
  return result;
}

/** Check-ins de um mês (YYYY-MM). */
export function getCheckinsForMonth(checkins: CheckinData[], year: number, month: number): CheckinData[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;
  return checkins.filter((c) => c.date.startsWith(prefix));
}

/** Dias do mês com status: done, escudoAtivado. */
export function getMonthCalendar(
  checkins: CheckinData[],
  year: number,
  month: number
): { dateStr: string; dayOfMonth: number; done: boolean; shield: boolean }[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const byDate = new Map(checkins.map((c) => [c.date, c]));
  const result: { dateStr: string; dayOfMonth: number; done: boolean; shield: boolean }[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const c = byDate.get(dateStr);
    result.push({
      dateStr,
      dayOfMonth: day,
      done: !!c,
      shield: c?.escudoAtivado ?? false,
    });
  }
  return result;
}

/** Maior sequência consecutiva de check-ins no mês. */
export function getBestStreakInMonth(
  checkins: CheckinData[],
  year: number,
  month: number
): number {
  const monthCheckins = getCheckinsForMonth(checkins, year, month);
  const dates = new Set(monthCheckins.map((c) => c.date));
  const daysInMonth = new Date(year, month, 0).getDate();
  let best = 0;
  let current = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dates.has(dateStr)) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

/** Métricas do mês: treinos, água, sono, alimentação. */
export function getMonthMetrics(
  checkins: CheckinData[],
  year: number,
  month: number
): { treinos: number; agua: number; dormiuBem: number; alimentacao: number } {
  const monthCheckins = getCheckinsForMonth(checkins, year, month);
  return {
    treinos: monthCheckins.filter((c) => c.treinou).length,
    agua: monthCheckins.filter((c) => c.bebeuAgua).length,
    dormiuBem: monthCheckins.filter((c) => c.dormiuBem).length,
    alimentacao: monthCheckins.filter((c) => c.adesaoAlimentar === 'sim').length,
  };
}

const CONTEXTO_LABELS: Record<ContextoAlimentar, string> = {
  evento_social: 'evento social',
  ansiedade_estresse: 'ansiedade/estresse',
  fome_fora_de_hora: 'fome fora de hora',
  nao_tive_opcao_melhor: 'não tive opção melhor',
};

/** Dois contextos alimentares mais frequentes nos check-ins. */
export function getContextosFrequentes(checkins: CheckinData[]): string[] {
  const count: Record<ContextoAlimentar, number> = {
    evento_social: 0,
    ansiedade_estresse: 0,
    fome_fora_de_hora: 0,
    nao_tive_opcao_melhor: 0,
  };
  for (const c of checkins) {
    for (const ctx of c.contextosAlimentar) {
      count[ctx]++;
    }
  }
  const sorted = (Object.entries(count) as [ContextoAlimentar, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 2).map(([k]) => CONTEXTO_LABELS[k]);
}

// --- GLP-1 Companion ---
const GLP1_APPLICATIONS_KEY = '@upwell:glp1_applications';
const GLP1_SYMPTOMS_KEY = '@upwell:glp1_symptoms';

export interface Glp1Application {
  id?: string; // from DB when present
  date: string; // YYYY-MM-DD
  medication: string;
  dose: string;
  observation?: string;
}

export interface Glp1SymptomsRecord {
  date: string;
  symptoms: string[];
}

export async function getGlp1Applications(): Promise<Glp1Application[]> {
  try {
    const data = await AsyncStorage.getItem(GLP1_APPLICATIONS_KEY);
    if (data) return JSON.parse(data);
    return [];
  } catch (error) {
    console.error('Error reading GLP-1 applications:', error);
    return [];
  }
}

export async function saveGlp1Application(application: Glp1Application): Promise<void> {
  const list = await getGlp1Applications();
  const withoutSameDay = list.filter((a) => a.date !== application.date);
  await AsyncStorage.setItem(GLP1_APPLICATIONS_KEY, JSON.stringify([...withoutSameDay, application]));
}

/** Data da próxima aplicação (7 dias após a última registrada). */
export async function getNextGlp1ApplicationDate(): Promise<string | null> {
  const list = await getGlp1Applications();
  if (list.length === 0) return null;
  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
  const last = sorted[0];
  const d = new Date(last.date);
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export async function getGlp1SymptomsRecords(): Promise<Glp1SymptomsRecord[]> {
  try {
    const data = await AsyncStorage.getItem(GLP1_SYMPTOMS_KEY);
    if (data) return JSON.parse(data);
    return [];
  } catch (error) {
    console.error('Error reading GLP-1 symptoms:', error);
    return [];
  }
}

export async function saveGlp1SymptomsRecord(record: Glp1SymptomsRecord): Promise<void> {
  const list = await getGlp1SymptomsRecords();
  const withoutToday = list.filter((r) => r.date !== record.date);
  await AsyncStorage.setItem(GLP1_SYMPTOMS_KEY, JSON.stringify([...withoutToday, record]));
}
