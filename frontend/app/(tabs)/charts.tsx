// screens/ChartsScreen.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApi } from '../../services/api';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── PALETTE ────────────────────────────────────────────────
const C = {
  teal: '#1C8F81',
  tealDeep: '#0D6B60',
  gold: '#F5A623',
  goldFaint: 'rgba(245,166,35,0.14)',
  red: '#E03E52',
  green: '#17A97A',
  purple: '#7C3AED',
  bg: '#F5F8F7',
  surface: '#FFFFFF',
  ink: '#0D1F1C',
  ink60: 'rgba(13,31,28,0.60)',
  ink30: 'rgba(13,31,28,0.30)',
  ink10: 'rgba(13,31,28,0.08)',
  ink05: 'rgba(13,31,28,0.04)',
};

const CAT_COLORS = [C.teal, C.gold, C.red, C.purple, '#F97316', '#0EA5E9', '#EC4899', '#84CC16'];

const fmt = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000  ? `₹${(n / 1000).toFixed(1)}K`
  : `₹${(n || 0).toFixed(0)}`;

// ─── TYPES ──────────────────────────────────────────────────
interface MonthPoint { month: string; expense: number; income: number; savings: number }
interface CategoryItem { categoryName: string; total: number; percentOfExpense: number }
interface BehaviorData {
  disciplineScore: number;
  impulseBuyingScore: number;
  emotionalSpendingScore: number;
  weekendOverspendRatio: number;
  lateNightSpendPercent: number;
}
interface GoalItem { name: string; targetAmount: number; currentAmount: number }

type ChartTab = 'Trends' | 'Categories' | 'Behavior' | 'Goals';
const TABS: ChartTab[] = ['Trends', 'Categories', 'Behavior', 'Goals'];

// ─── HELPER COMPONENTS ──────────────────────────────────────

const EmptyData = ({ message, icon = "bar-chart-2" }: { message: string, icon?: any }) => (
  <View style={styles.emptyState}>
    <Feather name={icon} size={32} color={C.ink30} style={{ marginBottom: 12 }} />
    <Text style={styles.emptyStateText}>{message}</Text>
  </View>
);

const StatPill = ({ label, value, color = C.teal }: { label: string; value: string; color?: string }) => (
  <View style={[styles.statPill, { backgroundColor: `${color}12` }]}>
    <Text style={[styles.statPillVal, { color }]}>{value}</Text>
    <Text style={styles.statPillLabel}>{label}</Text>
  </View>
);

// ─── CHARTS ─────────────────────────────────────────────────
const BarChart = ({ data, maxVal, barColor = C.teal, barWidth = 28, height = 160, showValues = true }: any) => {
  const anims = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!data.length) return;
    Animated.stagger(60, anims.map((anim: any) => Animated.spring(anim, { toValue: 1, useNativeDriver: false, stiffness: 120, damping: 14 }))).start();
  }, [data]);

  if (!data || data.length === 0) return <EmptyData message="No chart data available" />;

  return (
    <View style={{ height: height + 48 }}>
      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
        <View key={pct} style={{ position: 'absolute', left: 0, right: 0, top: height * (1 - pct), height: 1, backgroundColor: pct === 0 ? C.ink10 : 'rgba(13,31,28,0.04)' }} />
      ))}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 6 }}>
        {data.map((item: any, i: number) => {
          const pct = maxVal > 0 ? item.value / maxVal : 0;
          const barH = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(4, height * pct)] });
          return (
            <View key={item.label} style={{ alignItems: 'center', flex: 1 }}>
              {showValues && <Text style={styles.barTopVal} numberOfLines={1}>{item.value > 0 ? fmt(item.value) : ''}</Text>}
              <Animated.View style={{ width: barWidth, height: barH, borderRadius: 8, backgroundColor: barColor, overflow: 'hidden' }}>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 8 }} />
              </Animated.View>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
        {data.map((item: any) => <Text key={item.label} style={[styles.barLabel, { flex: 1 }]} numberOfLines={1}>{item.label}</Text>)}
      </View>
    </View>
  );
};

const GroupedBarChart = ({ data, height = 160 }: { data: MonthPoint[]; height?: number }) => {
  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1);
  const anims = useRef(data.map(() => ({ inc: new Animated.Value(0), exp: new Animated.Value(0) }))).current;

  useEffect(() => {
    if (!data.length) return;
    const all = anims.flatMap((a, i) => [
      Animated.spring(a.inc, { toValue: 1, useNativeDriver: false, stiffness: 120, damping: 14, delay: i * 50 }),
      Animated.spring(a.exp, { toValue: 1, useNativeDriver: false, stiffness: 120, damping: 14, delay: i * 50 + 30 }),
    ]);
    Animated.parallel(all).start();
  }, [data]);

  if (!data || data.length === 0) return <EmptyData message="Not enough history" />;

  return (
    <View>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
        {data.map((item, i) => {
          const incH = anims[i].inc.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(4, height * (item.income / maxVal))] });
          const expH = anims[i].exp.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(4, height * (item.expense / maxVal))] });
          return (
            <View key={item.month} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height }}>
                <Animated.View style={{ width: 12, height: incH, borderRadius: 4, backgroundColor: C.green }} />
                <Animated.View style={{ width: 12, height: expH, borderRadius: 4, backgroundColor: C.red }} />
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
        {data.map(item => <Text key={item.month} style={[styles.barLabel, { flex: 1, textAlign: 'center' }]}>{item.month}</Text>)}
      </View>
    </View>
  );
};

const CategoryStackedBars = ({ items }: { items: CategoryItem[] }) => {
  const anims = useRef(items.slice(0, 6).map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (!items.length) return;
    Animated.stagger(80, anims.map(a => Animated.spring(a, { toValue: 1, useNativeDriver: false, stiffness: 110, damping: 13 }))).start();
  }, [items]);

  if (!items || items.length === 0) return <EmptyData message="No categories logged" icon="pie-chart" />;

  return (
    <View style={styles.catBarsWrap}>
      {items.slice(0, 6).map((item, i) => {
        const fillW = anims[i].interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.min(item.percentOfExpense, 100)}%`] });
        return (
          <MotiView key={item.categoryName} from={{ opacity: 0, translateX: -8 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing', duration: 360, delay: i * 70 }} style={styles.catBarItem}>
            <View style={styles.catBarHeader}>
              <View style={styles.catBarNameRow}>
                <View style={[styles.catBarDot, { backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }]} />
                <Text style={styles.catBarName}>{item.categoryName}</Text>
              </View>
              <View style={styles.catBarRight}>
                <Text style={styles.catBarPct}>{(item.percentOfExpense || 0).toFixed(0)}%</Text>
                <Text style={styles.catBarAmt}>{fmt(item.total)}</Text>
              </View>
            </View>
            <View style={styles.catBarTrack}>
              <Animated.View style={[styles.catBarFill, { width: fillW, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }]} />
            </View>
          </MotiView>
        );
      })}
    </View>
  );
};

const BehaviorBar = ({ label, score, maxScore = 100, color, index }: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(anim, { toValue: 1, useNativeDriver: false, stiffness: 100, damping: 14, delay: index * 90 }).start(); }, []);
  const fillW = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${((score || 0) / maxScore) * 100}%`] });
  const textColor = score > 70 ? C.red : score > 40 ? C.gold : C.green;
  
  return (
    <View style={styles.behavBarItem}>
      <View style={styles.behavBarTop}>
        <Text style={styles.behavBarLabel}>{label}</Text>
        <Text style={[styles.behavBarScore, { color: textColor }]}>{(score || 0).toFixed(0)}<Text style={styles.behavBarMax}>/{maxScore}</Text></Text>
      </View>
      <View style={styles.behavBarTrack}>
        <Animated.View style={[styles.behavBarFill, { width: fillW, backgroundColor: color }]} />
      </View>
    </View>
  );
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────
export default function ChartsScreen() {
  const api = useApi();
  const [tab, setTab] = useState<ChartTab>('Trends');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Real Data States
  const [monthlyData, setMonthlyData] = useState<MonthPoint[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [behavior, setBehavior] = useState<BehaviorData | null>(null);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      const [dashData, goalsData] = await Promise.all([
        api.getDashboard(),
        api.getGoals?.() || Promise.resolve([]),
      ]);

      const d = dashData?.data;
      if (d) {
        setAnalytics(d);
        setCategories(d.categoryBreakdown || []);
        setBehavior(d.behavior || null);
        setMonthlyData(d.trends || []); // Maps to actual trends if backend returns it
      }

      if (goalsData && Array.isArray(goalsData)) {
        setGoals(
          goalsData.map((g: any) => ({
            name: g.name,
            targetAmount: parseFloat(g.targetAmount) || 0,
            currentAmount: parseFloat(g.currentAmount || g.savedAmount || '0'),
          }))
        );
      }
    } catch (e) {
      console.error('Charts load failed:', e);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={C.teal} />
        <Text style={styles.loaderText}>Crunching numbers…</Text>
      </View>
    );
  }

  // Live Stats Calculations
  const totalExpenseThisMonth = analytics?.stats?.totalExpense ?? 0;
  const totalIncomeThisMonth = analytics?.stats?.totalIncome ?? 0;
  const savingsThisMonth = totalIncomeThisMonth - totalExpenseThisMonth;
  const avgSavings = monthlyData.length 
    ? monthlyData.reduce((s, m) => s + m.savings, 0) / monthlyData.length 
    : savingsThisMonth;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Analytics</Text>
        <Text style={styles.screenSub}>Your financial health</Text>
      </View>

      {/* TAB BAR */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t} style={[styles.tabItem, tab === t && styles.tabItemActive]}
            onPress={() => { Haptics.selectionAsync(); setTab(t); }} activeOpacity={0.75}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={C.teal} />}
      >
        {/* ══════════════ TRENDS TAB ══════════════ */}
       {/* ══════════════ TRENDS TAB ══════════════ */}
        {tab === 'Trends' && (
          <>
            {/* Real Summary pills */}
            <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 360 }} style={styles.pillRow}>
              <StatPill label="Expense" value={fmt(totalExpenseThisMonth)} color={C.red} />
              <StatPill label="Income" value={fmt(totalIncomeThisMonth)} color={C.teal} />
              <StatPill label="Saved" value={fmt(savingsThisMonth)} color={savingsThisMonth >= 0 ? C.green : C.red} />
            </MotiView>

            {monthlyData && monthlyData.length > 0 ? (
              <>
                {/* Standard Monthly Expense Bar Chart */}
                <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay: 80 }} style={styles.card}>
                  <Text style={styles.cardTitle}>Expense Trends</Text>
                  <BarChart
                    data={monthlyData.map(m => ({ label: m.month, value: m.expense }))}
                    maxVal={Math.max(...monthlyData.map(m => m.expense), 1)}
                    barColor={C.red}
                    height={140}
                  />
                </MotiView>

                {/* Income vs Expense Grouped Bars */}
                <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay: 140 }} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Income vs Expense</Text>
                    <View style={styles.legend}>
                      <View style={[styles.legendDot, { backgroundColor: C.green }]} /><Text style={styles.legendText}>Income</Text>
                      <View style={[styles.legendDot, { backgroundColor: C.red, marginLeft: 10 }]} /><Text style={styles.legendText}>Expense</Text>
                    </View>
                  </View>
                  <GroupedBarChart data={monthlyData} height={140} />
                </MotiView>
              </>
            ) : (
              <EmptyData message="Not enough historical data to show trends yet." icon="bar-chart-2" />
            )}

            {/* Daily / Weekly averages (Only shows if dailyAverages exist) */}
            {analytics?.dailyAverages && (
              <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay: 200 }} style={styles.card}>
                <Text style={styles.cardTitle}>Spending Averages</Text>
                <View style={styles.avgGrid}>
                  <View style={[styles.avgItem, { borderColor: `${C.red}20`, backgroundColor: `${C.red}08` }]}>
                    <Text style={[styles.avgVal, { color: C.red }]}>{fmt(analytics.dailyAverages.daily)}</Text>
                    <Text style={styles.avgLabel}>Daily avg</Text>
                  </View>
                  <View style={[styles.avgItem, { borderColor: `${C.gold}20`, backgroundColor: `${C.gold}08` }]}>
                    <Text style={[styles.avgVal, { color: C.gold }]}>{fmt(analytics.dailyAverages.weekly)}</Text>
                    <Text style={styles.avgLabel}>Weekly avg</Text>
                  </View>
               {analytics?.prediction?.projectedMonthlyExpense !== undefined && (
                    <View style={[styles.avgItem, { borderColor: `${C.purple}20`, backgroundColor: `${C.purple}08` }]}>
                      <Text style={[styles.avgVal, { color: C.purple }]}>{fmt(analytics.prediction.projectedMonthlyExpense)}</Text>
                      <Text style={styles.avgLabel}>Monthly proj</Text>
                    </View>
                  )}
                </View>
              </MotiView>
            )}
          </>
        )}
        
        {/* ══════════════ CATEGORIES TAB ══════════════ */}
        {tab === 'Categories' && (
          <>
            {categories.length > 0 ? (
              <>
                <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 360 }} style={styles.pillRow}>
                  <StatPill label="Top category" value={categories[0]?.categoryName ?? '-'} color={C.teal} />
                  <StatPill label="Its share" value={`${categories[0]?.percentOfExpense?.toFixed(0) ?? 0}%`} color={C.gold} />
                  <StatPill label="Active Cats" value={`${categories.length}`} color={C.purple} />
                </MotiView>

                <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay: 80 }} style={styles.card}>
                  <Text style={styles.cardTitle}>Spending by Category</Text>
                  <CategoryStackedBars items={categories} />
                </MotiView>

                <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay: 160 }} style={styles.card}>
                  <Text style={styles.cardTitle}>Spending Composition</Text>
                  <View style={styles.compositionBar}>
                    {categories.slice(0, 6).map((item, i) => (
                      <View key={item.categoryName} style={{ flex: item.percentOfExpense, backgroundColor: CAT_COLORS[i % CAT_COLORS.length], height: 20 }} />
                    ))}
                  </View>
                  <View style={styles.legendWrap}>
                    {categories.slice(0, 6).map((item, i) => (
                      <View key={item.categoryName} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }]} />
                        <Text style={styles.legendName} numberOfLines={1}>{item.categoryName}</Text>
                        <Text style={styles.legendPct}>{(item.percentOfExpense || 0).toFixed(0)}%</Text>
                        <Text style={styles.legendAmt}>{fmt(item.total)}</Text>
                      </View>
                    ))}
                  </View>
                </MotiView>
              </>
            ) : (
              <EmptyData message="No categories logged this month" icon="pie-chart" />
            )}
          </>
        )}

        {/* ══════════════ BEHAVIOR TAB ══════════════ */}
        {tab === 'Behavior' && (
          <>
            {behavior ? (
              <>
                <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 20 }}>
                  <LinearGradient
                    colors={
                      (behavior.disciplineScore || 0) >= 80 ? [C.tealDeep, C.teal]
                      : (behavior.disciplineScore || 0) >= 60 ? ['#B45309', C.gold]
                      : ['#9F1239', C.red]
                    }
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.disciplineHero}
                  >
                    <Text style={styles.disciplineScore}>{behavior.disciplineScore || 0}</Text>
                    <Text style={styles.disciplineMax}>/100</Text>
                    <Text style={styles.disciplineLabel}>Discipline Score</Text>
                    <Text style={styles.disciplineSublabel}>
                      {(behavior.disciplineScore || 0) >= 80 ? '🏆 Excellent — keep it up!'
                      : (behavior.disciplineScore || 0) >= 60 ? '💪 Good — room to improve'
                      : '⚠️ Needs attention — let\'s work on this'}
                    </Text>
                  </LinearGradient>
                </MotiView>

                <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay: 100 }} style={styles.card}>
                  <Text style={styles.cardTitle}>Behavior Scores <Text style={styles.cardSub2}>(lower = better)</Text></Text>
                  <BehaviorBar label="Impulse Buying" score={behavior.impulseBuyingScore} color={C.red} index={0} />
                  <BehaviorBar label="Emotional Spending" score={behavior.emotionalSpendingScore} color={C.gold} index={1} />
                </MotiView>
              </>
            ) : (
              <EmptyData message="Not enough behavior data yet" icon="activity" />
            )}

            {/* Peak spending times (If Available) */}
            {analytics?.peakSpendingTimes && analytics.peakSpendingTimes.length > 0 && (
              <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay: 240 }} style={styles.card}>
                <Text style={styles.cardTitle}>Peak Spending Times</Text>
                <BarChart
                  data={analytics.peakSpendingTimes.map((p: any) => ({ label: p.timeOfDay, value: p.total }))}
                  maxVal={Math.max(...analytics.peakSpendingTimes.map((p: any) => p.total))}
                  barColor={C.purple} height={120}
                />
              </MotiView>
            )}
          </>
        )}

        {/* ══════════════ GOALS TAB ══════════════ */}
        {tab === 'Goals' && (
          <>
            {goals.length > 0 ? (
              <>
                <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 360 }} style={styles.pillRow}>
                  <StatPill label="Active goals" value={`${goals.length}`} color={C.teal} />
                  <StatPill label="Total target" value={fmt(goals.reduce((s, g) => s + g.targetAmount, 0))} color={C.gold} />
                  <StatPill label="Total saved" value={fmt(goals.reduce((s, g) => s + g.currentAmount, 0))} color={C.green} />
                </MotiView>

                {goals.map((g, i) => {
                  const pct = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
                  return (
                    <MotiView key={g.name} from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 360, delay: i * 100 }} style={styles.goalCard}>
                      <View style={styles.goalCardTop}>
                        <View style={[styles.goalIcon, { backgroundColor: CAT_COLORS[i % CAT_COLORS.length] + '22' }]}>
                          <MaterialCommunityIcons name="star-shooting" size={20} color={CAT_COLORS[i % CAT_COLORS.length]} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.goalName}>{g.name}</Text>
                          <Text style={styles.goalSub}>Target: {fmt(g.targetAmount)}</Text>
                        </View>
                        <Text style={styles.goalPct}>{pct.toFixed(0)}%</Text>
                      </View>
                      <View style={styles.goalTrack}>
                        <View style={[styles.goalFill, { width: `${pct}%`, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }]} />
                      </View>
                      <View style={styles.goalBottom}>
                        <Text style={styles.goalSaved}>Saved: {fmt(g.currentAmount)}</Text>
                      </View>
                    </MotiView>
                  );
                })}
              </>
            ) : (
              <EmptyData message="No active goals. Add some in the Records tab!" icon="target" />
            )}
          </>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 18, paddingBottom: 30 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  loaderText: { marginTop: 14, fontSize: 14, color: C.ink60, fontWeight: '500' },

  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 40, opacity: 0.7 },
  emptyStateText: { color: C.ink60, fontWeight: '600', fontSize: 14 },

  screenHeader: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  screenTitle: { fontSize: 26, fontWeight: '800', color: C.ink, letterSpacing: -0.5 },
  screenSub: { fontSize: 13, color: C.ink60, fontWeight: '500', marginTop: 2 },

  tabBar: {
    flexDirection: 'row', marginHorizontal: 18, marginBottom: 16,
    backgroundColor: C.surface, borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: C.ink10,
  },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabItemActive: { backgroundColor: C.teal },
  tabText: { fontSize: 12, fontWeight: '700', color: C.ink60 },
  tabTextActive: { color: 'white' },

  card: {
    backgroundColor: C.surface, borderRadius: 20, padding: 18, marginBottom: 14,
    shadowColor: C.ink, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 10,
    elevation: 2, borderWidth: 1, borderColor: C.ink05,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: C.ink, marginBottom: 14 },
  cardSub: { fontSize: 11, color: C.ink60, fontWeight: '500' },
  cardSub2: { fontSize: 10, color: C.ink30, fontWeight: '500' },

  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statPill: { flex: 1, padding: 12, borderRadius: 14, alignItems: 'center' },
  statPillVal: { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  statPillLabel: { fontSize: 10, color: C.ink60, fontWeight: '600', marginTop: 3 },

  legend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { fontSize: 11, color: C.ink60, fontWeight: '600' },
  legendWrap: { gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendName: { flex: 1, fontSize: 13, color: C.ink, fontWeight: '600' },
  legendPct: { fontSize: 12, color: C.ink60, fontWeight: '700', width: 36, textAlign: 'right' },
  legendAmt: { fontSize: 12, color: C.ink60, fontWeight: '600', width: 54, textAlign: 'right' },

  barTopVal: { fontSize: 9, color: C.ink60, fontWeight: '700', marginBottom: 2, textAlign: 'center' },
  barLabel: { fontSize: 10, color: C.ink30, fontWeight: '600', textAlign: 'center' },

  catBarsWrap: { gap: 14 },
  catBarItem: {},
  catBarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catBarNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  catBarDot: { width: 8, height: 8, borderRadius: 4 },
  catBarName: { fontSize: 13, fontWeight: '700', color: C.ink, flex: 1 },
  catBarRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  catBarPct: { fontSize: 12, fontWeight: '800', color: C.ink60 },
  catBarAmt: { fontSize: 12, fontWeight: '700', color: C.ink60, minWidth: 52, textAlign: 'right' },
  catBarTrack: { height: 7, backgroundColor: C.ink10, borderRadius: 999, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 999 },

  compositionBar: { flexDirection: 'row', height: 20, borderRadius: 10, overflow: 'hidden', marginBottom: 16 },

  behavBarItem: { marginBottom: 16 },
  behavBarTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  behavBarLabel: { fontSize: 13, fontWeight: '700', color: C.ink },
  behavBarScore: { fontSize: 14, fontWeight: '800' },
  behavBarMax: { fontSize: 11, color: C.ink30, fontWeight: '500' },
  behavBarTrack: { height: 8, backgroundColor: C.ink10, borderRadius: 999, overflow: 'hidden' },
  behavBarFill: { height: '100%', borderRadius: 999 },

  disciplineHero: { borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 14 },
  disciplineScore: { fontSize: 64, fontWeight: '800', color: 'white', letterSpacing: -2 },
  disciplineMax: { fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: -8, marginBottom: 4 },
  disciplineLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '700', letterSpacing: 1 },
  disciplineSublabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginTop: 8, textAlign: 'center' },

  avgGrid: { flexDirection: 'row', gap: 10 },
  avgItem: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  avgVal: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  avgLabel: { fontSize: 10, color: C.ink60, fontWeight: '600', marginTop: 4, textAlign: 'center' },

  goalCard: {
    backgroundColor: C.surface, borderRadius: 18, padding: 16, marginBottom: 12,
    shadowColor: C.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8,
    elevation: 1, borderWidth: 1, borderColor: C.ink05,
  },
  goalCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  goalIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  goalName: { fontSize: 15, fontWeight: '800', color: C.ink },
  goalSub: { fontSize: 12, color: C.ink60, fontWeight: '500', marginTop: 2 },
  goalPct: { fontSize: 18, fontWeight: '800', color: C.teal },
  goalTrack: { height: 8, backgroundColor: C.ink10, borderRadius: 999, overflow: 'hidden', marginBottom: 8 },
  goalFill: { height: '100%', borderRadius: 999 },
  goalBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  goalSaved: { fontSize: 12, color: C.ink60, fontWeight: '600' },
  goalRemain: { fontSize: 12, color: C.teal, fontWeight: '700' },
});