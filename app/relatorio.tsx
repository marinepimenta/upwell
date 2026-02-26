import { useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text as RNText,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { colors, gradients, shadows } from '@/constants/theme';
import {
  getProfile,
  getWeightRecords,
  getGlp1Applications,
  getGlp1Symptoms,
  getMonthlyMetrics,
  getCheckinsByMonth,
  type Profile,
  type MonthlyMetrics,
} from '@/lib/database';
import type { Glp1Application, Glp1SymptomsRecord, CheckinData } from '@/utils/storage';
import { getTodayBRT, formatDateBRT } from '@/lib/utils';
import UpWellLogoGreen from '@/components/UpWellLogoGreen';
import type { ReactNode } from 'react';

type WeightRecord = { id: string; date: string; weight: number; context?: string | null; notes?: string | null };

function ReportSection({
  icon,
  title,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        marginTop: 8,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E8EDE8',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Ionicons name={icon} size={16} color="#5C7A5C" />
        <RNText style={{ fontSize: 15, fontWeight: '700', color: '#5C7A5C', marginLeft: 8 }}>
          {title}
        </RNText>
      </View>
      {children}
    </View>
  );
}

const chartConfig = {
  backgroundColor: 'transparent',
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#FFFFFF',
  decimalPlaces: 1,
  color: () => '#5C7A5C',
  labelColor: () => '#6B6B6B',
  strokeWidth: 2,
};

const PDF_STYLES = `
  body { font-family: -apple-system, Helvetica, sans-serif; color: #1A1A1A; padding: 40px; max-width: 580px; margin: 0 auto; background: #FAFAF8; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .header-right { font-size: 13px; color: #6B6B6B; }
  .divider { border: none; border-top: 1px solid #E8EDE8; margin: 20px 0; }
  .section-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: #5C7A5C; margin-bottom: 14px; }
  .disclaimer { background: #FFF8F0; border: 1px solid #F0D4C8; border-radius: 10px; padding: 14px 16px; font-size: 12px; color: #C4846A; line-height: 20px; margin-bottom: 20px; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #F5F5F5; }
  .label { font-size: 13px; color: #6B6B6B; }
  .value { font-size: 14px; font-weight: 700; color: #1A1A1A; }
  .chip { display: inline-block; background: #F0D4C8; color: #C4846A; border-radius: 999px; padding: 5px 14px; font-size: 12px; margin: 3px 3px 3px 0; font-weight: 500; }
  .chip-sage { background: #EBF3EB; color: #5C7A5C; }
  .timeline-item { display: flex; gap: 12px; margin-bottom: 14px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #5C7A5C; margin-top: 6px; flex-shrink: 0; }
  .timeline-content .date { font-size: 13px; color: #6B6B6B; margin-bottom: 2px; }
  .timeline-content .med { font-size: 14px; font-weight: 700; color: #1A1A1A; }
  .timeline-content .note { font-size: 13px; color: #6B6B6B; font-style: italic; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 14px 0; }
  .grid-item { background: #F5F8F5; border-radius: 10px; padding: 14px; text-align: center; }
  .grid-number { font-size: 24px; font-weight: 800; color: #5C7A5C; }
  .grid-label { font-size: 12px; color: #6B6B6B; margin-top: 2px; }
  .weight-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 14px 0; }
  .weight-box { background: #F5F8F5; border-radius: 10px; padding: 14px; text-align: center; }
  .weight-label { font-size: 13px; color: #6B6B6B; }
  .weight-value { font-size: 22px; font-weight: 800; color: #5C7A5C; margin-top: 4px; }
  .variacao-pos { color: #C4846A; font-weight: 700; font-size: 14px; }
  .variacao-neg { color: #5C7A5C; font-weight: 700; font-size: 14px; }
  .insight { background: #EBF3EB; border-radius: 10px; padding: 14px; font-size: 13px; color: #5C7A5C; line-height: 20px; margin-top: 12px; }
  .obs-box { background: #F5F8F5; border-radius: 10px; padding: 14px; font-size: 14px; color: #6B6B6B; font-style: italic; line-height: 22px; }
  .footer { display: flex; justify-content: space-between; font-size: 11px; color: #BDBDBD; margin-top: 24px; padding-top: 16px; border-top: 1px solid #E8EDE8; }
  h3 { font-size: 13px; color: #6B6B6B; font-weight: 400; margin: 14px 0 8px; }
`;

function getLogoDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="235 395 555 210"><path fill="#5C7A5C" d="M442.375 405.949C442.953 406.497 442.695 406.113 442.794 407.274C423.264 433.448 428.215 474.432 427.599 505.118C427.407 514.681 427.989 522.603 426.253 532.244C424.783 540.57 421.826 548.563 417.521 555.84C399.391 586.66 360.302 596.818 329.67 578.139C327.559 576.729 326.02 575.287 324.123 573.62C330.388 572.115 336.599 570.392 342.744 568.456C366.017 576.883 384.278 573.459 401.583 553.843C403.599 551.557 407.016 546.125 407.956 543.288C424.912 492.118 393.253 446.254 442.375 405.949Z"/><path fill="#5C7A5C" d="M425.615 411.958L426.517 412.287L426.742 413.145C425.473 415.178 424.207 415.852 422.389 417.35C402.12 434.055 397.623 455.961 396.443 481.048C396.115 488.041 396.181 494.461 395.55 501.424C393.343 531.485 370.828 553.066 343.126 561.82C326.192 567.171 309.016 570.474 293.716 580.207C289.634 582.803 286.028 585.766 282.239 588.859L281.675 589.107L281.264 588.572C286.2 572.151 306.993 558.652 322.255 553.535C329.212 551.203 336.477 549.389 343.325 546.723C351.594 543.579 359.181 538.874 365.673 532.865C385.509 514.309 380.395 493.691 382.997 469.208C383.947 460.508 386.237 452.008 389.785 444.008C396.938 427.824 409.466 418.115 425.615 411.958Z"/><path fill="#5C7A5C" d="M558.666 493.596C586.293 492.221 593.36 522.48 576.932 540.109C569.256 548.346 561.31 550.327 550.154 550.627C561.895 540.398 563.333 543.78 572.036 527.502C568.185 531.58 565.433 534.224 561.293 537.937C551.862 545.345 552.908 543.845 545.466 535.719C545.319 545.664 545.314 555.611 545.451 565.557L535.531 565.555L535.512 494.623C539.067 494.064 542.206 492.888 544.668 495.719C545.38 497.962 544.946 500.051 544.726 502.444C549.909 497.436 551.691 495.584 558.666 493.596ZM552.093 533.622L556.265 526.622C561.873 519.227 566.505 517.359 575.052 514.592C571.881 503.725 568.123 501.648 556.959 502.066C542.949 508.477 540.308 523.319 552.093 533.622Z"/><path fill="#5C7A5C" d="M671.015 476.901C673.985 476.789 677.586 476.955 680.603 477.021C679.65 480.777 678.512 484.618 677.454 488.358C674.114 499.411 670.841 510.484 667.636 521.576C665.543 528.757 663.321 537.221 660.652 544.09L651.327 544.003C649.916 541.136 645.794 528.485 644.751 524.809C642.049 515.295 636.042 499.657 634.519 490.341C633.85 492.965 633.13 495.597 632.301 498.174C627.378 513.486 623.23 529.142 617.662 544.23C614.629 544.304 611.498 544.281 608.456 544.297C606.202 537.645 588.802 479.919 589.065 477.254C592.247 477.187 594.639 477.28 597.816 477.464C603.673 491.225 608.218 514.635 613.69 529.937C614.947 524.81 617.74 516.876 619.402 511.57L630.169 476.93C633.562 476.96 635.595 477.061 638.96 477.453C644.513 492.243 650.569 514.389 655.578 530.204C660.159 514.182 665.394 491.841 671.015 476.901Z"/><path fill="#5C7A5C" d="M279.904 425.485C286.974 427.804 296.533 439.871 300.343 445.81C316.242 470.592 308.134 498.582 311.742 525.604C312.301 529.789 313.451 532.421 314.516 536.21C315.237 538.774 319.247 546.875 318.933 548.331L317.238 549.319C313.366 550.737 310.392 551.701 306.42 552.803C289.774 520.929 300.727 492.638 294.134 459.309C291.089 443.917 285.373 438.423 280.267 426.359L279.904 425.485Z"/><path fill="#5C7A5C" d="M701.682 493.585C702.953 493.495 704.227 493.465 705.5 493.496C723.197 493.808 729.083 506.934 728.259 522.456C716.856 523.02 701.511 522.597 689.69 522.711C693.147 536.72 705.32 542.15 717.318 533.584C718.643 532.477 719.056 531.9 720.767 531.75C722.957 532.224 724.557 533.953 726.34 535.466C717.097 545.406 704.282 548.447 691.997 541.921C675.379 533.095 677.036 503.845 693.741 496.01C696.546 494.695 698.679 494.197 701.682 493.585ZM689.917 515.195C695.173 515.708 701.199 515.518 706.536 515.488L719.268 515.515C717.321 505.391 713.594 501.418 702.952 501.568C695.212 503.486 691.881 507.698 689.917 515.195Z"/><path fill="#5C7A5C" d="M465.111 477.073L474.972 477.11C474.97 489.085 474.87 501.041 474.891 513.034C474.623 520.283 476.327 529.063 482.814 533.391C491.856 540.029 508.688 535.717 510.417 523.576C512.517 508.825 510.753 492.303 511.175 477.232C514.177 477.392 517.858 477.334 520.916 477.367L520.97 485.31C521.007 494.675 521.854 519.845 519.608 527.756C518.615 531.365 516.731 534.667 514.129 537.357C500.946 551.075 469.981 546.378 466.576 527.394C463.988 512.964 465.148 492.146 465.111 477.073Z"/><path fill="#5C7A5C" d="M296.458 429.058C307.843 429.622 319.659 437.73 326.85 446.159C344.866 467.275 339.097 494.55 341.3 519.823C341.907 526.778 346.401 531.237 347.134 537.639C347.21 538.296 346.184 538.63 345.656 538.941C343.789 539.94 341.681 540.921 339.764 541.863C317.668 510.787 333.974 496.898 323.326 463.037C320.473 453.964 315 445.2 308.357 438.341C305.658 435.554 297.497 431.706 296.458 429.058Z"/><path fill="#5C7A5C" d="M299.836 559.529C298.64 559.518 297.444 559.465 296.251 559.369C274.856 557.441 261.594 537.76 263.539 517.121C264 516.431 264.457 515.736 265.497 515.815C287.134 517.453 296.635 532.088 297.802 552.145C294.668 550.075 291.721 547.752 288.742 545.465C282.07 539.24 279.744 535.037 274.318 529.505C276.392 533.265 281.648 545.079 284.563 547.089C287.806 551.447 295.25 556.391 299.836 559.529Z"/><path fill="#5C7A5C" d="M763.464 473.484L773.031 473.494C772.705 481.169 772.912 490.473 772.895 498.266L772.741 543.729C771.167 543.953 765.385 543.826 763.486 543.823L763.464 473.484Z"/><path fill="#5C7A5C" d="M739.056 473.615L748.497 473.655L748.488 520.657C748.486 525.577 748.789 539.877 748.172 543.852C745.473 543.994 742.239 543.962 739.495 544C739.151 520.54 739.005 497.077 739.056 473.615Z"/><path fill="#5C7A5C" d="M358.99 426.818C362.604 426.103 366.321 427.415 368.685 430.24C371.05 433.065 371.687 436.954 370.346 440.386C369.006 443.818 365.902 446.246 362.248 446.72C356.852 447.421 351.872 443.715 350.993 438.345C350.114 432.975 353.652 427.875 358.99 426.818Z"/><path fill="#5C7A5C" d="M357.762 511.191C360.289 510.243 363.13 510.728 365.2 512.459C367.269 514.191 368.248 516.901 367.761 519.556C367.275 522.21 365.398 524.397 362.849 525.282C358.974 526.627 354.739 524.606 353.347 520.748C351.954 516.891 353.922 512.631 357.762 511.191Z"/></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function generateReportHTML(
  {
    profile,
    weightRecords,
    applications,
    symptoms,
    metrics,
    checkins,
  }: {
    profile: Profile | null;
    weightRecords: WeightRecord[];
    applications: Glp1Application[];
    symptoms: Glp1SymptomsRecord[];
    metrics: MonthlyMetrics | null;
    checkins: CheckinData[];
  },
  logoDataUri: string
) {
  const pesoInicial = profile?.weight_initial != null ? String(profile.weight_initial) : '—';
  const pesoAtual =
    weightRecords.length > 0 ? String(weightRecords[weightRecords.length - 1].weight) : pesoInicial;
  const numInicial = parseFloat(pesoInicial);
  const numAtual = parseFloat(pesoAtual);
  const variacao =
    !Number.isNaN(numInicial) && !Number.isNaN(numAtual) ? (numAtual - numInicial).toFixed(1) : '0';
  const meds =
    [...new Set(applications.map((a) => a.medication))].join(', ') || '—';
  const appsHTML = applications
    .map(
      (a) =>
        `<tr><td>${formatDateBRT(a.date)}</td><td><b>${a.medication} ${a.dose}</b></td><td><i>${a.observation || ''}</i></td></tr>`
    )
    .join('');
  const allSymptoms = symptoms.flatMap((s) => s.symptoms || []);
  const symptomCount = allSymptoms.reduce(
    (acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const topSymptoms =
    Object.entries(symptomCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s]) => s)
      .join(', ') || '—';
  const hoje = formatDateBRT(getTodayBRT());
  const observacoesText = checkins
    .filter((c) => c.textoLivre?.trim())
    .map((c) => `${formatDateBRT(c.date)}: ${c.textoLivre}`)
    .join('\n') || 'Nenhuma observação registrada.';
  const variacaoNum = parseFloat(variacao);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${PDF_STYLES}</style>
    </head>
    <body>
      <div class="header">
        <img src="${logoDataUri}" style="height: 48px; width: auto;" alt="UpWell" />
        <span class="header-right">Relatório de Saúde</span>
      </div>
      <div class="disclaimer">Este relatório foi gerado pelo app UpWell para uso pessoal. Não constitui diagnóstico ou recomendação médica. Compartilhe com seu médico se achar útil.</div>

      <hr class="divider" />
      <div class="section-title">📅 Período</div>
      <div class="row"><span class="label">De</span><span class="value">${formatDateBRT(profile?.program_start_date || getTodayBRT())}</span></div>
      <div class="row"><span class="label">Até</span><span class="value">${hoje}</span></div>

      ${
        profile?.glp1_status !== 'never'
          ? `
      <hr class="divider" />
      <div class="section-title">💉 Acompanhamento GLP-1</div>
      <h3>Medicamentos</h3>
      <p><span class="chip">${meds}</span></p>
      <h3>Aplicações registradas</h3>
      <table style="width:100%; border-collapse:collapse; font-size:13px;"><tr style="border-bottom:1px solid #F0F0F0;"><td style="padding:8px 4px;">Data</td><td style="padding:8px 4px;">Medicamento</td><td style="padding:8px 4px;">Obs</td></tr>${appsHTML}</table>
      <h3>Sintomas mais frequentes</h3>
      <p><b>${topSymptoms}</b></p>
      `
          : ''
      }

      <hr class="divider" />
      <div class="section-title">⚖️ Evolução do peso</div>
      <div class="weight-boxes">
        <div class="weight-box"><div class="weight-label">Peso inicial</div><div class="weight-value">${pesoInicial} kg</div></div>
        <div class="weight-box"><div class="weight-label">Peso atual</div><div class="weight-value">${pesoAtual} kg</div></div>
      </div>
      <p class="${variacaoNum <= 0 ? 'variacao-neg' : 'variacao-pos'}">${variacaoNum <= 0 ? '▼' : '▲'} ${Math.abs(variacaoNum)} kg no período</p>

      <hr class="divider" />
      <div class="section-title">✅ Hábitos no período</div>
      <p><b>${metrics?.totalCheckins || 0} check-ins realizados</b></p>
      <div class="grid">
        <div class="grid-item"><div class="grid-number">${metrics?.treinos || 0}</div><div class="grid-label">treinos</div></div>
        <div class="grid-item"><div class="grid-number">${metrics?.agua || 0}</div><div class="grid-label">dias com água</div></div>
        <div class="grid-item"><div class="grid-number">${metrics?.sono || 0}</div><div class="grid-label">noites bem dormidas</div></div>
        <div class="grid-item"><div class="grid-number">${metrics?.alimentacao || 0}</div><div class="grid-label">dias na alimentação</div></div>
      </div>

      <hr class="divider" />
      <div class="section-title">📝 Observações</div>
      <div class="obs-box">${observacoesText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>

      <div class="footer">
        <span>Gerado pelo UpWell em ${hoje}</span>
        <span>upwell.app</span>
      </div>
    </body>
    </html>
  `;
}

export default function RelatorioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [applications, setApplications] = useState<Glp1Application[]>([]);
  const [symptoms, setSymptoms] = useState<Glp1SymptomsRecord[]>([]);
  const [metrics, setMetrics] = useState<MonthlyMetrics | null>(null);
  const [checkins, setCheckins] = useState<CheckinData[]>([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        const now = new Date();
        const [p, w, a, s, m, c] = await Promise.all([
          getProfile(),
          getWeightRecords(),
          getGlp1Applications(),
          getGlp1Symptoms(),
          getMonthlyMetrics(),
          getCheckinsByMonth(now.getFullYear(), now.getMonth() + 1),
        ]);
        setProfile(p ?? null);
        setWeightRecords(w || []);
        setApplications((a || []).sort((x, y) => y.date.localeCompare(x.date)));
        setSymptoms(s || []);
        setMetrics(m ?? null);
        setCheckins(c || []);
        setLoading(false);
      };
      load();
    }, [])
  );

  const handleShare = async () => {
    try {
      setGenerating(true);
      const logoDataUri = getLogoDataUri();
      const html = generateReportHTML(
        {
          profile,
          weightRecords,
          applications,
          symptoms,
          metrics,
          checkins,
        },
        logoDataUri
      );
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartilhar Relatório UpWell',
        UTI: 'com.adobe.pdf',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.sageDark} />
      </View>
    );
  }

  const hoje = getTodayBRT();
  const dataInicio = profile?.program_start_date || hoje;
  const pesoInicial = profile?.weight_initial;
  const weightRecordsOrdenados = [...weightRecords].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const pesoAtualNum =
    weightRecordsOrdenados[0]?.weight ?? profile?.weight_current ?? profile?.weight_initial ?? null;
  const pesoAtual = pesoAtualNum != null ? pesoAtualNum : '—';
  const variacao =
    pesoAtualNum != null && pesoInicial != null
      ? parseFloat((pesoAtualNum - pesoInicial).toFixed(1))
      : null;

  const allSymptoms = symptoms.flatMap((s) => s.symptoms || []);
  const symptomCount = allSymptoms.reduce(
    (acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const topSymptoms = Object.entries(symptomCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s);
  const medicamentos = [...new Set(applications.map((a) => a.medication))];
  const observacoesText = checkins
    .filter((c) => c.textoLivre?.trim())
    .map((c) => `${formatDateBRT(c.date)}: ${c.textoLivre}`)
    .join('\n') || 'Nenhuma observação registrada.';

  const chartWidth = Dimensions.get('window').width - 80;
  const chartLabels = weightRecords.map((_, i) => `S${i + 1}`);
  const chartValues = weightRecords.map((r) => r.weight);
  const hasChartData = chartValues.length >= 2;
  const now = new Date();
  const diasNoMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.gradientHeader}
        style={[styles.header, { paddingTop: insets.top + 12, paddingBottom: 16 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <RNText style={styles.headerTitle}>Relatório para consulta</RNText>
        <TouchableOpacity onPress={handleShare} style={styles.headerShare} hitSlop={12} disabled={generating}>
          {generating ? (
            <ActivityIndicator size="small" color={colors.sageDark} />
          ) : (
            <Ionicons name="share-outline" size={24} color={colors.text} />
          )}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <UpWellLogoGreen width={120} height={44} />
            <RNText style={styles.cardHeaderSub}>Relatório de Saúde</RNText>
          </View>
          <View style={styles.divider} />

          <View style={styles.disclaimerBanner}>
            <Ionicons name="information-circle-outline" size={14} color="#C4846A" style={styles.disclaimerIcon} />
            <RNText style={styles.disclaimerText}>
              Este relatório foi gerado pelo app UpWell para uso pessoal. Não constitui diagnóstico ou recomendação
              médica. Compartilhe com seu médico se achar útil.
            </RNText>
          </View>

          <ReportSection icon="calendar-outline" title="Período">
            <View style={styles.row}>
              <RNText style={styles.label}>De</RNText>
              <RNText style={styles.value}>{formatDateBRT(dataInicio)}</RNText>
            </View>
            <View style={styles.row}>
              <RNText style={styles.label}>Até</RNText>
              <RNText style={styles.value}>{formatDateBRT(hoje)}</RNText>
            </View>
          </ReportSection>

          {profile?.glp1_status !== 'never' && (
            <ReportSection icon="medical-outline" title="Acompanhamento GLP-1">
              <RNText style={styles.subsectionLabel}>Medicamentos utilizados</RNText>
              <View style={styles.chipsRow}>
                {medicamentos.map((m) => (
                  <View key={m} style={styles.chipTerracotta}>
                    <RNText style={styles.chipTerracottaText}>{m}</RNText>
                  </View>
                ))}
              </View>
              <RNText style={styles.subsectionLabelWithTop}>Aplicações registradas</RNText>
              <View style={styles.timeline}>
                {applications.map((app, i) => (
                  <View key={app.id ?? app.date + i} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    {i < applications.length - 1 && <View style={styles.timelineLine} />}
                    <View style={styles.timelineContent}>
                      <RNText style={styles.timelineDate}>{formatDateBRT(app.date)}</RNText>
                      <RNText style={styles.timelineDetail}>
                        {app.medication} {app.dose}
                      </RNText>
                      {app.observation ? (
                        <RNText style={styles.timelineObs}>{app.observation}</RNText>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
              <RNText style={styles.subsectionLabelWithTop}>Sintomas mais frequentes</RNText>
              <View style={styles.chipsRow}>
                {topSymptoms.map((s) => (
                  <View key={s} style={styles.chipTerracotta}>
                    <RNText style={styles.chipTerracottaText}>{s}</RNText>
                  </View>
                ))}
              </View>
              <RNText style={styles.hint}>
                Registrados em {symptoms.length} de {metrics?.totalCheckins ?? 0} check-ins com GLP-1
              </RNText>
            </ReportSection>
          )}

          <ReportSection icon="scale-outline" title="Evolução do peso">
            <View style={styles.pesoBoxesRow}>
              <View style={styles.pesoBox}>
                <RNText style={styles.pesoBoxLabel}>Peso inicial</RNText>
                <RNText style={styles.pesoBoxValue}>{pesoInicial != null ? `${pesoInicial} kg` : '—'}</RNText>
              </View>
              <View style={styles.pesoBox}>
                <RNText style={styles.pesoBoxLabel}>Peso atual</RNText>
                <RNText style={styles.pesoBoxValue}>{pesoAtual != null ? `${pesoAtual} kg` : '—'}</RNText>
              </View>
            </View>
            {variacao != null && (
              <RNText
                style={[
                  styles.variacaoText,
                  variacao < 0 && styles.variacaoSage,
                  variacao > 0 && styles.variacaoTerracotta,
                ]}
              >
                {variacao < 0
                  ? `▼ ${Math.abs(variacao)} kg no período`
                  : variacao > 0
                    ? `▲ ${variacao} kg no período`
                    : 'Peso estável no período'}
              </RNText>
            )}
            {hasChartData && (
              <LineChart
                data={{
                  labels: chartLabels,
                  datasets: [{ data: chartValues }],
                }}
                width={chartWidth}
                height={160}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines={false}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                fromZero={false}
                yAxisSuffix=" kg"
              />
            )}
          </ReportSection>

          <ReportSection icon="checkbox-outline" title="Hábitos no período">
            <RNText style={styles.habitosIntro}>
              <RNText style={styles.habitosIntroBold}>{metrics?.totalCheckins ?? 0} check-ins realizados</RNText>
              <RNText style={styles.habitosIntroReg}> em {diasNoMes} dias</RNText>
            </RNText>
            <View style={styles.habitosGrid}>
              <View style={styles.habitosCell}>
                <Ionicons name="barbell-outline" size={18} color={colors.sageDark} />
                <RNText style={styles.habitosNum}>{metrics?.treinos ?? 0}</RNText>
                <RNText style={styles.habitosCellLabel}>treinos</RNText>
              </View>
              <View style={styles.habitosCell}>
                <Ionicons name="water-outline" size={18} color={colors.sageDark} />
                <RNText style={styles.habitosNum}>{metrics?.agua ?? 0}</RNText>
                <RNText style={styles.habitosCellLabel}>dias com água</RNText>
              </View>
              <View style={styles.habitosCell}>
                <Ionicons name="moon-outline" size={18} color={colors.sageDark} />
                <RNText style={styles.habitosNum}>{metrics?.sono ?? 0}</RNText>
                <RNText style={styles.habitosCellLabel}>noites bem dormidas</RNText>
              </View>
              <View style={styles.habitosCell}>
                <Ionicons name="restaurant-outline" size={18} color={colors.sageDark} />
                <RNText style={styles.habitosNum}>{metrics?.alimentacao ?? 0}</RNText>
                <RNText style={styles.habitosCellLabel}>dias na alimentação</RNText>
              </View>
            </View>
            {metrics?.contextos && Object.keys(metrics.contextos).length > 0 && (
              <View style={styles.insightCard}>
                <RNText style={styles.insightLabel}>Contextos alimentares</RNText>
                {Object.entries(metrics.contextos).map(([ctx, count]) => (
                  <RNText key={ctx} style={styles.insightLine}>
                    {ctx}: {count}x
                  </RNText>
                ))}
              </View>
            )}
          </ReportSection>

          <ReportSection icon="document-text-outline" title="Observações">
            <View style={styles.observacoesBox}>
              <RNText style={styles.observacoesText}>{observacoesText}</RNText>
            </View>
          </ReportSection>

          <View style={styles.divider} />
          <View style={styles.footerRow}>
            <RNText style={styles.footerText}>Gerado pelo UpWell em {formatDateBRT(hoje)}</RNText>
            <RNText style={styles.footerText}>upwell.app</RNText>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.btnFechar}>
          <RNText style={styles.btnFecharText}>Fechar</RNText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShare}
          style={styles.btnShareWrap}
          disabled={generating}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradients.gradientSage}
            style={[StyleSheet.absoluteFill, styles.btnShareGradient]}
          />
          <View style={styles.btnShareContent}>
            {generating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="share-outline" size={18} color="#FFFFFF" />
            )}
            <RNText style={styles.btnShareText}>{generating ? 'Gerando...' : 'Compartilhar'}</RNText>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerBack: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  headerShare: { width: 40, alignItems: 'flex-end' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginVertical: 16,
    ...shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderSub: { fontSize: 13, color: '#6B6B6B' },
  divider: { height: 1, backgroundColor: '#E8EDE8', marginVertical: 12 },
  disclaimerBanner: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#F0D4C8',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  disclaimerIcon: { marginRight: 8 },
  disclaimerText: { flex: 1, fontSize: 12, color: '#C4846A' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  label: { fontSize: 13, color: '#6B6B6B' },
  value: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  subsectionLabel: { fontSize: 13, color: '#6B6B6B', fontWeight: '400', marginBottom: 8 },
  subsectionLabelWithTop: { fontSize: 13, color: '#6B6B6B', fontWeight: '400', marginTop: 16, marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipTerracotta: {
    backgroundColor: '#F0D4C8',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  chipTerracottaText: { fontSize: 13, color: '#C4846A' },
  timeline: { marginTop: 8 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.sageDark,
    marginTop: 6,
    marginRight: 12,
  },
  timelineLine: {
    position: 'absolute',
    left: 3,
    top: 16,
    bottom: -8,
    width: 2,
    backgroundColor: colors.sageLight,
  },
  timelineContent: { flex: 1 },
  timelineDate: { fontSize: 13, color: '#6B6B6B' },
  timelineDetail: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  timelineObs: { fontSize: 13, fontStyle: 'italic', color: '#6B6B6B', marginTop: 2 },
  hint: { fontSize: 12, color: '#6B6B6B', marginTop: 8 },
  pesoBoxesRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  pesoBox: {
    flex: 1,
    backgroundColor: '#F5F8F5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  pesoBoxLabel: { fontSize: 13, color: '#6B6B6B' },
  pesoBoxValue: { fontSize: 20, fontWeight: '700', color: colors.sageDark },
  variacaoText: { fontSize: 15, fontWeight: '700' },
  variacaoSage: { color: colors.sageDark },
  variacaoTerracotta: { color: colors.terracotta },
  chart: { marginTop: 12, borderRadius: 8 },
  habitosIntro: { marginBottom: 16 },
  habitosIntroBold: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  habitosIntroReg: { fontSize: 14, color: '#6B6B6B' },
  habitosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  habitosCell: {
    width: '47%',
    backgroundColor: '#F5F8F5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  habitosNum: { fontSize: 22, fontWeight: '800', color: colors.sageDark },
  habitosCellLabel: { fontSize: 12, color: '#6B6B6B', marginTop: 4 },
  insightCard: {
    backgroundColor: '#EBF3EB',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  insightLabel: { fontSize: 13, fontWeight: '600', color: colors.sageDark },
  insightLine: { fontSize: 13, color: '#1A1A1A', marginTop: 4 },
  observacoesBox: {
    backgroundColor: '#F5F8F5',
    borderRadius: 12,
    padding: 14,
  },
  observacoesText: { fontSize: 13, color: '#1A1A1A' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  footerText: { fontSize: 11, color: '#BDBDBD' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8EDE8',
    flexDirection: 'row',
    gap: 12,
  },
  btnFechar: {
    width: 100,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.sageDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFecharText: { fontSize: 16, fontWeight: '600', color: colors.sageDark },
  btnShareWrap: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnShareGradient: { borderRadius: 12 },
  btnShareContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  btnShareText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
