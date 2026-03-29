import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, RefreshControl, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useApi } from '../../services/api';

const C = {
  primary: '#2E7D6E', primaryDark: '#1B4D44',
  gold: '#D4AF37', goldDark: '#B8942A', goldLight: '#FBF5E6',
  bg: '#F8FAFA', surface: '#FFFFFF', text: '#0F172A',
  subtext: '#64748B', border: '#E2E8F0', success: '#059669', danger: '#E11D48',
};

const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

export default function ReportsScreen() {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // 1. Fetch data from backend
  const handleGenerateReport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);
    try {
      // Assuming you added getReportData to api.ts
      const res = await api.getReportData?.() || { data: null };
      if (res.data) {
        setReportData(res.data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      Alert.alert("Error", "Could not generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Generate PDF and Share
  const handleExportPDF = async () => {
    if (!reportData) return Alert.alert("Generate First", "Please generate a report before exporting.");
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { monthlyReport: m, budgetReport: b } = reportData;

    // The HTML Template for the PDF
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-scale; color: #0F172A; padding: 40px; }
            h1 { color: #2E7D6E; border-bottom: 2px solid #E2E8F0; padding-bottom: 10px; }
            h2 { color: #D4AF37; margin-top: 30px; }
            .grid { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .box { background: #F8FAFA; padding: 15px; border-radius: 8px; width: 22%; text-align: center; border: 1px solid #E2E8F0; }
            .box span { display: block; font-size: 12px; color: #64748B; text-transform: uppercase; margin-bottom: 5px; }
            .box strong { font-size: 20px; color: #2E7D6E; }
            .alert { background: #FBF5E6; padding: 15px; border-left: 4px solid #D4AF37; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E2E8F0; }
            th { background-color: #2E7D6E; color: white; }
            .over { color: #E11D48; font-weight: bold; }
            .under { color: #059669; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Financial Wrap-up: ${reportData.month}</h1>
          
          <h2>1. Monthly Overview</h2>
          <div class="grid">
            <div class="box"><span>Income</span><strong>${fmt(m.income)}</strong></div>
            <div class="box"><span>Expenses</span><strong>${fmt(m.expenses)}</strong></div>
            <div class="box"><span>Savings</span><strong>${fmt(m.savings)}</strong></div>
            <div class="box"><span>Rate</span><strong>${m.savingsRate}%</strong></div>
          </div>
          
          <div class="alert">
            <strong>Reality Check:</strong><br/>
            <ul>
              ${m.realityCheck.map((msg: string) => `<li>${msg}</li>`).join('')}
            </ul>
          </div>

          <h2>2. Budget Control</h2>
          <p>Overall Budget Utilization: <strong>${b.overallUtilization}%</strong></p>
          <p>Top Problem Area: <strong class="over">${b.topProblemArea}</strong></p>
          
          <table>
            <tr>
              <th>Category</th>
              <th>Budget Limit</th>
              <th>Actual Spent</th>
              <th>Difference</th>
            </tr>
            ${b.categories.map((cat: any) => `
              <tr>
                <td>${cat.name}</td>
                <td>${fmt(cat.limit)}</td>
                <td>${fmt(cat.spent)}</td>
                <td class="${cat.status}">${cat.status === 'over' ? '+' : ''}${fmt(cat.diff)} ${cat.status === 'over' ? '❌' : '✅'}</td>
              </tr>
            `).join('')}
          </table>

          <div style="margin-top: 20px;">
            <strong>Budget Insights:</strong>
            <ul>
              ${b.insights.map((msg: string) => `<li>${msg}</li>`).join('')}
            </ul>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert("Error", "Could not export PDF.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <TouchableOpacity style={[styles.exportBtn, !reportData && {opacity: 0.5}]} onPress={handleExportPDF} disabled={!reportData}>
          <Feather name="download" size={16} color={C.primary} />
          <Text style={styles.exportText}>Export PDF</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* ── GENERATION BANNER ── */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}>
          <LinearGradient colors={['#DFBE61', C.gold, C.goldDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.premiumBanner}>
            <MaterialCommunityIcons name="file-chart-outline" size={28} color="white" style={{ marginBottom: 8 }} />
            <Text style={styles.bannerTitle}>Monthly & Budget Reports</Text>
            <Text style={styles.bannerSub}>Generate a clean, powerful PDF of your financial reality check and budget discipline.</Text>
            
            <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateReport} disabled={isGenerating}>
              {isGenerating ? <ActivityIndicator size="small" color={C.goldDark} /> : (
                <><Text style={styles.generateBtnText}>Generate Data</Text><Feather name="arrow-right" size={16} color={C.goldDark} /></>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </MotiView>

        {/* ── PREVIEW LIST ── */}
        {reportData ? (
          <MotiView from={{ opacity: 0, translateY: 15 }} animate={{ opacity: 1, translateY: 0 }} style={styles.reportCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}><Feather name="check-circle" size={20} color={C.success} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportDate}>{reportData.month} Ready</Text>
                <Text style={styles.reportId}>Contains: Monthly Overview + Budgets</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.cardStats}>
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>Savings Rate</Text>
                <Text style={styles.statValue}>{reportData.monthlyReport.savingsRate}%</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>Budget Used</Text>
                <Text style={[styles.statValue, {color: reportData.budgetReport.overallUtilization > 100 ? C.danger : C.text}]}>
                  {reportData.budgetReport.overallUtilization}%
                </Text>
              </View>
            </View>
          </MotiView>
        ) : (
          <View style={styles.emptyState}>
            <Feather name="file-text" size={32} color={C.subtext} style={{marginBottom: 10}}/>
            <Text style={styles.emptyText}>Tap generate above to compile your data.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: C.border },
  exportText: { fontSize: 13, fontWeight: '700', color: C.primary },
  premiumBanner: { borderRadius: 24, padding: 24, marginBottom: 24 },
  bannerTitle: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 6 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '500', lineHeight: 20, marginBottom: 20 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.surface, paddingVertical: 14, borderRadius: 16 },
  generateBtnText: { color: C.goldDark, fontSize: 15, fontWeight: '800' },
  reportCard: { backgroundColor: C.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(5, 150, 105, 0.1)', alignItems: 'center', justifyContent: 'center' },
  reportDate: { fontSize: 16, fontWeight: '800', color: C.text },
  reportId: { fontSize: 12, color: C.subtext, fontWeight: '500', marginTop: 2 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 16 },
  cardStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statBlock: { flex: 1 },
  statLabel: { fontSize: 11, color: C.subtext, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800', color: C.text },
  emptyState: { padding: 40, alignItems: 'center', marginTop: 20 },
  emptyText: { fontSize: 14, color: C.subtext, fontWeight: '500' }
});