// screens/DashboardScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';
import { useApi } from '../../services/api';
import { useRouter } from 'expo-router';

// ─── PREMIUM MINIMAL PALETTE ─────────────────────────────────
const C = {
  primary: '#2E7D6E',     // Deep Teal
  primaryDark: '#1B4D44',
  gold: '#F5A623',
  red: '#E11D48',
  success: '#059669',     // Emerald 600
  bg: '#F8FAFA',          // Ultra-light cool gray
  surface: '#FFFFFF',
  text: '#0F172A',        // Slate 900
  subtext: '#64748B',     // Slate 500
  border: '#E2E8F0',      // Slate 200
  glass: '#F1F5F9',       // Slate 100 for tabs
};

const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

// ─── ANIMATED NUMBER COMPONENT ──────────────────────────────
const AnimatedAmount = ({ value, style }: { value: number; style?: any }) => {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0;
    const steps = 20;
    const inc = value / steps;
    const timer = setInterval(() => {
      start += inc;
      if (start >= value) { setDisplayed(value); clearInterval(timer); }
      else setDisplayed(start);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return <Text style={style}>{fmt(displayed)}</Text>;
};

// ─── QUICK ACTION CHIP ──────────────────────────────────────
const QuickChip = ({ icon, label, onPress, color = C.primary }: any) => (
  <TouchableOpacity style={styles.chip} onPress={() => { Haptics.selectionAsync(); onPress(); }} activeOpacity={0.7}>
    <View style={[styles.chipIconWrap, { backgroundColor: `${color}12` }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.chipLabel}>{label}</Text>
  </TouchableOpacity>
);

type ListTab = 'History' | 'Recurring' | 'Goals';

// ─── MAIN SCREEN ─────────────────────────────────────────────
export default function DashboardScreen() {
  const api = useApi();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ListTab>('History');

  // Data States
  const [userName, setUserName] = useState('Shivam'); // Default fallback
  const [analytics, setAnalytics] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [recurring, setRecurring] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);

  const load = useCallback(async (isRefresh = false) => {
    try {
      // Fetch everything concurrently to make it super fast
      const [profileRes, dashRes, txRes, recRes, goalRes] = await Promise.all([
        api.getProfile().catch(() => null),
        api.getDashboard().catch(() => null),
        api.getTransactions().catch(() => []),
        api.getRecurringConfigs?.().catch(() => []) || [],
        api.getGoals?.().catch(() => []) || []
      ]);

      if (profileRes?.user?.name || profileRes?.name) {
        setUserName(profileRes.user?.name || profileRes.name);
      }
      
      if (dashRes?.data) setAnalytics(dashRes.data);
      setTransactions(txRes || []);
      setRecurring(recRes || []);
      setGoals(goalRes || []);
    } catch (e) {
      console.error('Dashboard load failed:', e);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const a = analytics ?? { stats: { totalIncome: 0, totalExpense: 0 }, alerts: [] };
  const redAlerts = (a.alerts || []).filter((x: any) => x.severity === 'red').length;
  const spentPct = a.stats.totalIncome > 0 ? (a.stats.totalExpense / a.stats.totalIncome) * 100 : 0;
  const isOverBudget = spentPct > 100;

  // Render the selected list item
  const renderListItem = (item: any, index: number) => {
    let content;

    if (activeTab === 'Goals') {
      content = (
        <View style={styles.recordCard}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(142, 68, 173, 0.1)' }]}>
            <MaterialCommunityIcons name="star-shooting" size={22} color="#8E44AD" />
          </View>
          <View style={styles.recordContent}>
            <Text style={styles.recordTitle}>{item.name}</Text>
            <Text style={styles.recordSubtext}>Target: {fmt(parseFloat(item.targetAmount))}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.recordAmount}>{fmt(parseFloat(item.currentAmount || item.savedAmount || 0))}</Text>
            <Text style={styles.miniLabel}>SAVED</Text>
          </View>
        </View>
      );
    } else if (activeTab === 'Recurring') {
      content = (
        <View style={styles.recordCard}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(24, 153, 214, 0.1)' }]}>
            <MaterialCommunityIcons name="calendar-sync" size={22} color="#1899D6" />
          </View>
          <View style={styles.recordContent}>
            <Text style={styles.recordTitle}>{item.name || item.categoryName || 'Subscription'}</Text>
            <Text style={styles.recordSubtext}>Next: {item.nextDate || item.nextBillingDate}</Text>
          </View>
          <Text style={styles.recordAmount}>{fmt(parseFloat(item.amount))}</Text>
        </View>
      );
    } else {
      // History Tab
      const isIncome = item.type === 'income';
      content = (
        <View style={styles.recordCard}>
          <View style={styles.iconBox}>
            <Ionicons name={item.categoryIcon as any || 'receipt-outline'} size={20} color={C.text} />
          </View>
          <View style={styles.recordContent}>
            <Text style={styles.recordTitle}>{item.categoryName || 'Transaction'}</Text>
            <Text style={styles.recordSubtext}>{item.date}</Text>
          </View>
          <Text style={[styles.recordAmount, { color: isIncome ? C.success : C.text }]}>
            {isIncome ? '+' : ''}{fmt(parseFloat(item.amount))}
          </Text>
        </View>
      );
    }

    return (
      <MotiView key={item.id || index} from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 300, delay: index * 50 }}>
        {content}
      </MotiView>
    );
  };

  const currentListData = activeTab === 'History' ? transactions : activeTab === 'Recurring' ? recurring : goals;

  // Format the date to look like "Monday, 29 March"
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={C.primary} />}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {userName} 👋</Text>
            <Text style={styles.month}>{todayFormatted}</Text>
          </View>
          
          <TouchableOpacity style={styles.alertBadge} onPress={() => alert('Alerts screen coming soon!')} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={24} color={C.text} />
            {redAlerts > 0 && (
              <View style={styles.alertBadgeDot}>
                <Text style={styles.alertBadgeNum}>{redAlerts}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── HERO: MONTHLY OVERVIEW ── */}
        <MotiView from={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 20 }} style={styles.heroCard}>
          <Text style={styles.heroLabel}>Spent this month</Text>
          <AnimatedAmount value={a.stats.totalExpense} style={styles.heroAmount} />
          
          <View style={styles.heroProgressBarContainer}>
            <View style={[styles.heroProgressBar, { width: `${Math.min(spentPct, 100)}%`, backgroundColor: isOverBudget ? C.red : C.primary }]} />
          </View>
          
          <View style={styles.heroFooter}>
            <Text style={styles.heroSubtext}>of {fmt(a.stats.totalIncome)} income</Text>
            <Text style={[styles.heroSubtext, { color: isOverBudget ? C.red : C.subtext, fontWeight: '600' }]}>
              {spentPct.toFixed(0)}%
            </Text>
          </View>
        </MotiView>

        {/* ── NAVIGATION CHIPS ── */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 100 }} style={styles.chipsRow}>
          <QuickChip icon="robot-outline" label="Ask Duo" onPress={() => router.push('/coach')} color={C.primary} />
          <QuickChip icon="chart-donut" label="Charts" onPress={() => router.push('/charts')} color={C.gold} />
        </MotiView>

        {/* ── LIST SECTION (History, Recurring, Goals) ── */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 200 }}>
          <Text style={styles.sectionTitle}>Your Records</Text>
          
          <View style={styles.navToggle}>
            {(['History', 'Recurring', 'Goals'] as ListTab[]).map((tab) => (
              <TouchableOpacity 
                key={tab} 
                activeOpacity={0.7}
                style={[styles.navBtn, activeTab === tab && styles.navBtnActive]}
                onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
              >
                <Text style={[styles.navText, activeTab === tab && styles.navTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Render the Lists (Sliced to top 10 so it doesn't get infinitely long on the dashboard) */}
          <View style={styles.listContainer}>
            {currentListData.length > 0 ? (
              currentListData.slice(0, 10).map((item, index) => renderListItem(item, index))
            ) : (
              <View style={styles.emptyState}>
                <Feather name="inbox" size={32} color={C.border} style={{ marginBottom: 10 }} />
                <Text style={styles.emptyText}>No {activeTab.toLowerCase()} found.</Text>
              </View>
            )}
          </View>
        </MotiView>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 24 },
  greeting: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  month: { fontSize: 14, color: C.subtext, fontWeight: '600', marginTop: 4 },
  
  alertBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  alertBadgeDot: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: C.red, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.bg
  },
  alertBadgeNum: { fontSize: 10, fontWeight: '800', color: 'white' },

  // Hero Card
  heroCard: { 
    backgroundColor: C.surface, borderRadius: 24, padding: 24, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2,
    borderWidth: 1, borderColor: C.border
  },
  heroLabel: { fontSize: 13, fontWeight: '700', color: C.subtext, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  heroAmount: { fontSize: 48, fontWeight: '800', color: C.text, letterSpacing: -1.5, marginBottom: 20 },
  heroProgressBarContainer: { height: 8, backgroundColor: C.bg, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  heroProgressBar: { height: '100%', borderRadius: 4 },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  heroSubtext: { fontSize: 13, color: C.subtext, fontWeight: '500' },

  // Quick Nav Chips
  chipsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  chip: { flex: 1, alignItems: 'center', gap: 8, backgroundColor: C.surface, paddingVertical: 16, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  chipIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { fontSize: 13, fontWeight: '700', color: C.text },

  // List Section
  sectionTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 16 },
  
  // Segmented Control
  navToggle: { flexDirection: 'row', backgroundColor: C.glass, borderRadius: 16, padding: 4, marginBottom: 16 },
  navBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  navBtnActive: { backgroundColor: C.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  navText: { fontSize: 13, fontWeight: '600', color: C.subtext },
  navTextActive: { color: C.text, fontWeight: '700' },

  // List Items
  listContainer: { marginTop: 8 },
  recordCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, 
    padding: 16, borderRadius: 20, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6, elevation: 1,
    borderWidth: 1, borderColor: C.border
  },
  iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: C.glass },
  recordContent: { flex: 1 },
  recordTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 4 },
  recordSubtext: { fontSize: 13, color: C.subtext, fontWeight: '500' },
  recordAmount: { fontSize: 16, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  miniLabel: { fontSize: 10, color: C.subtext, fontWeight: '700', letterSpacing: 0.5, marginTop: 4 },

  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center', opacity: 0.8 },
  emptyText: { fontSize: 14, color: C.subtext, fontWeight: '600' }
});