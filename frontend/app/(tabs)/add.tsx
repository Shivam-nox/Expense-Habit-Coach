// frontend/screens/AddTransactionScreen.tsx
import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  Modal, TextInput, KeyboardAvoidingView, Platform, 
  Alert, ScrollView, ActivityIndicator, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useApi } from '../../services/api'; 

import WishlistModal from '../../components/WishlistModal';
import RecurringPaymentModal from '../../components/RecurringPaymentModal';

const { width } = Dimensions.get('window');

type TabType = 'Expense' | 'Income';
type IntentType = 'need' | 'want';
type PaymentMode = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';

interface CategoryItem {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// --- Premium Palette ---
const COLORS = {
  primary: '#2E7D6E',     // Teal Green
  primaryDark: '#1B4D44', // Deep Teal for gradients
  secondary: '#A7D7C5',   // Soft Mint
  background: '#F8FAFA',  // Premium Off-white
  accent: '#FFC857',      // Warm Gold
  text: '#1F2933',        // Dark Text
  textMuted: '#627D98',   // Cool Grey for muted
  white: '#FFFFFF',
  border: '#E4E7EB'
};

const PAYMENT_MODES: { label: string; value: PaymentMode; icon: any }[] = [
  { label: 'Cash', value: 'cash', icon: 'cash-outline' },
  { label: 'UPI', value: 'upi', icon: 'phone-portrait-outline' },
  { label: 'Card', value: 'card', icon: 'card-outline' },
  { label: 'Bank', value: 'bank_transfer', icon: 'business-outline' },
];

export default function AddTransactionScreen() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState<TabType>('Expense');
  
  const [isTxModalVisible, setTxModalVisible] = useState(false); 
  const [isGoalModalVisible, setGoalModalVisible] = useState(false);
  const [isRegularPayModalVisible, setRegularPayModalVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [intent, setIntent] = useState<IntentType>('want'); 
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');

  // --- CATEGORIES ---
  
  
   const expenseCategories: CategoryItem[] = [
    { id: '1', name: 'Shopping', icon: 'cart-outline' },
    { id: '2', name: 'Food', icon: 'fast-food-outline' },
    { id: '3', name: 'Phone', icon: 'phone-portrait-outline' },
    { id: '4', name: 'Entertainment', icon: 'musical-notes-outline' },
    { id: '5', name: 'Education', icon: 'school-outline' },
    { id: '6', name: 'Beauty', icon: 'sparkles-outline' },
    { id: '7', name: 'Sports', icon: 'fitness-outline' },
    { id: '8', name: 'Social', icon: 'people-outline' },
    { id: '9', name: 'Transportation', icon: 'bus-outline' },
    { id: '10', name: 'Clothing', icon: 'shirt-outline' },
    { id: '11', name: 'Car', icon: 'car-outline' },
    { id: '12', name: 'Alcohol', icon: 'wine-outline' },
    { id: '13', name: 'Cigarettes', icon: 'flame-outline' },
    { id: '14', name: 'Electronics', icon: 'tv-outline' },
    { id: '15', name: 'Travel', icon: 'airplane-outline' },
    { id: '16', name: 'Health', icon: 'medkit-outline' },
    { id: '17', name: 'Pets', icon: 'paw-outline' },
    { id: '18', name: 'Repairs', icon: 'construct-outline' },
    { id: '19', name: 'Housing', icon: 'home-outline' },
    { id: '20', name: 'Home', icon: 'bed-outline' },
    { id: '21', name: 'Gifts', icon: 'gift-outline' },
    { id: '22', name: 'Donations', icon: 'heart-outline' },
    { id: '23', name: 'Lottery', icon: 'ticket-outline' },
    { id: '24', name: 'Snacks', icon: 'cafe-outline' },
    { id: '25', name: 'Kids', icon: 'happy-outline' },
    { id: '26', name: 'Vegetables', icon: 'leaf-outline' },
    { id: '27', name: 'Fruits', icon: 'nutrition-outline' },
    { id: '99', name: 'Settings', icon: 'settings-outline' },
  ];
  
  const incomeCategories: CategoryItem[] = [
    { id: '28', name: 'Salary', icon: 'card-outline' },
    { id: '29', name: 'Investments', icon: 'trending-up-outline' },
    { id: '30', name: 'Part-Time', icon: 'time-outline' },
    { id: '31', name: 'Bonus', icon: 'gift-outline' },
    { id: '32', name: 'Others', icon: 'grid-outline' },
    { id: '199', name: 'Settings', icon: 'settings-outline' },
  ];
  

  const handleCategoryPress = (category: CategoryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (category.name === 'Settings') return; 
    setSelectedCategory(category);
    setIntent('want'); 
    setTxModalVisible(true);
  };

  const handleTransactionSave = async () => {
    if (!amount || isNaN(Number(amount))) {
      return Alert.alert("Wait a sec", "Please enter a valid amount.");
    }

    const payload = {
      amount: parseFloat(amount),
      type: activeTab.toLowerCase(), 
      categoryId: selectedCategory?.id, 
      categoryName: selectedCategory?.name,
      paymentMode: paymentMode,
      intent: activeTab === 'Expense' ? intent : undefined, 
      note: note,
      date: new Date().toISOString().split('T')[0], 
    };

    setIsLoading(true);

    try {
      const savedTx = await api.addTransaction(payload);
      if (savedTx) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setTxModalVisible(false);
          setAmount('');
          setNote('');
        }, 1200);
      } else {
        Alert.alert("Error", "Could not save transaction.");
      }
    } catch (error) {
      console.error("Transaction Save Error:", error);
      Alert.alert("Save Failed", "There was a problem saving. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

const renderGridItem = ({ item, index }: { item: CategoryItem, index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 15 }} 
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ 
        type: 'timing',
        duration: 400,
        delay: index * 30
      }}
      style={styles.gridItemContainer}
    >
      <TouchableOpacity 
        style={styles.gridItem} 
        onPress={() => handleCategoryPress(item)} 
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F0F4F4']}
          style={styles.iconBox}
        >
          <Ionicons name={item.icon} size={24} color={COLORS.primary} />
        </LinearGradient>
        <Text style={styles.gridLabel} numberOfLines={1}>{item.name}</Text>
      </TouchableOpacity>
    </MotiView>
  );

  return (
   <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Animated Header */}
      <View style={styles.headerRow}>
        <MotiView from={{ opacity: 0, translateX: -20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing', duration: 500 }}>
           <Text style={styles.greetingTitle}>Track</Text>
           <Text style={styles.greetingSubtitle}>Where's it going?</Text>
        </MotiView>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setRegularPayModalVisible(true)}>
            <Feather name="calendar" size={18} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setGoalModalVisible(true)}>
            <Feather name="target" size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Premium Segmented Control */}
      <View style={styles.tabWrapper}>
        <View style={styles.tabBackground}>
          {(['Expense', 'Income'] as TabType[]).map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.activeTab]} 
              onPress={() => { 
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); 
                setActiveTab(tab); 
              }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Grid Content */}
      <View style={styles.content}>
        <FlatList 
          data={activeTab === 'Expense' ? expenseCategories : incomeCategories} 
          renderItem={renderGridItem} 
          keyExtractor={item => item.id} 
          numColumns={4} 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.gridContainer} 
          columnWrapperStyle={styles.rowWrapper} 
        />
      </View>

      {/* Modern Bottom Sheet Modal */}
      <Modal visible={isTxModalVisible} animationType="slide" transparent={true} onRequestClose={() => setTxModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
            <View style={styles.modalContent}>
              
              <View style={styles.modalDragIndicator} />

              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <LinearGradient colors={['#FFFFFF', '#F0F4F4']} style={styles.modalHeaderIcon}>
                    <Ionicons name={selectedCategory?.icon as any} size={22} color={COLORS.primary} />
                  </LinearGradient>
                  <Text style={styles.modalTitle}>{selectedCategory?.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setTxModalVisible(false)} disabled={isLoading || showSuccess} style={styles.closeBtn}>
                  <Feather name="x" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput 
                  style={styles.amountInput} 
                  placeholder="0" 
                  placeholderTextColor={COLORS.secondary} 
                  keyboardType="numeric" 
                  value={amount} 
                  onChangeText={setAmount} 
                  autoFocus 
                />
              </View>

              <Text style={styles.sectionLabel}>Payment Mode</Text>
              <View style={styles.chipContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {PAYMENT_MODES.map(mode => (
                    <TouchableOpacity 
                      key={mode.value} 
                      style={[styles.chip, paymentMode === mode.value && styles.chipActive]}
                      onPress={() => { Haptics.selectionAsync(); setPaymentMode(mode.value); }}
                    >
                      <Ionicons 
                        name={mode.icon} 
                        size={16} 
                        color={paymentMode === mode.value ? COLORS.primary : COLORS.textMuted} 
                        style={{marginRight: 6}}
                      />
                      <Text style={[styles.chipText, paymentMode === mode.value && styles.chipTextActive]}>
                        {mode.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {activeTab === 'Expense' && (
                <>
                  <Text style={styles.sectionLabel}>Classification</Text>
                  <View style={styles.toggleContainer}>
                    <TouchableOpacity 
                      style={[styles.toggleBtn, intent === 'need' && styles.toggleNeedActive]} 
                      onPress={() => { Haptics.selectionAsync(); setIntent('need'); }}
                    >
                      <Text style={[styles.toggleText, intent === 'need' && styles.toggleNeedTextActive]}>Need</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.toggleBtn, intent === 'want' && styles.toggleWantActive]} 
                      onPress={() => { Haptics.selectionAsync(); setIntent('want'); }}
                    >
                      <Text style={[styles.toggleText, intent === 'want' && styles.toggleWantTextActive]}>Want</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <View style={styles.inputBox}>
                <Feather name="edit-2" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput} 
                  placeholder="Add a note..." 
                  placeholderTextColor={COLORS.textMuted} 
                  value={note} 
                  onChangeText={setNote} 
                />
              </View>

              {/* Premium Gradient Button */}
              <TouchableOpacity onPress={handleTransactionSave} disabled={isLoading || showSuccess} activeOpacity={0.8} style={{marginTop: 10}}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Save Transaction</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Loading / Success State */}
              {(isLoading || showSuccess) && (
                <View style={styles.loadingOverlay}>
                  {isLoading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} />
                  ) : (
                    <MotiView from={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={styles.successBadge}>
                      <Ionicons name="checkmark-circle" size={64} color={COLORS.primary} />
                      <Text style={styles.successText}>Transaction logged</Text>
                    </MotiView>
                  )}
                </View>
              )}

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <WishlistModal visible={isGoalModalVisible} onClose={() => setGoalModalVisible(false)} />
      <RecurringPaymentModal visible={isRegularPayModalVisible} onClose={() => setRegularPayModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  
  // Header
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 24, 
    paddingTop: 10, 
    marginBottom: 20 
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5
  },
  greetingSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12
  },
  headerIconBtn: { 
    padding: 12, 
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },

  // Premium Segmented Tabs
  tabWrapper: { 
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 24
  },
  tabBackground: { 
    flexDirection: 'row', 
    backgroundColor: '#EAECEF', 
    padding: 4, 
    borderRadius: 20, 
    width: '100%' 
  },
  tab: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center', 
    borderRadius: 16 
  },
  activeTab: { 
    backgroundColor: COLORS.white, 
    shadowColor: COLORS.primary, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 4 
  },
  tabText: { 
    color: COLORS.textMuted, 
    fontWeight: '600', 
    fontSize: 14 
  },
  activeTabText: { 
    color: COLORS.text, 
    fontWeight: '800' 
  },

  // Grid Categories
  content: { 
    flex: 1 
  },
  gridContainer: { 
    paddingBottom: 50, 
    paddingHorizontal: 16 
  },
  rowWrapper: { 
    justifyContent: 'space-between' 
  },
  gridItemContainer: { 
    width: '23%', 
    marginBottom: 24 
  },
  gridItem: { 
    alignItems: 'center' 
  },
  iconBox: { 
    width: width * 0.16, 
    height: width * 0.16, 
    borderRadius: 22, 
    backgroundColor: COLORS.white, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3
  },
  gridLabel: { 
    color: COLORS.text, 
    fontSize: 11, 
    textAlign: 'center', 
    fontWeight: '600',
    opacity: 0.8
  },

  // Modal Structure
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    backgroundColor: 'rgba(15, 23, 30, 0.4)' 
  }, 
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: COLORS.white, 
    paddingHorizontal: 24, 
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20
  }, 
  modalDragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#D9DFE5',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20
  },
  
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 32 
  },
  modalTitleContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  modalHeaderIcon: { 
    padding: 12, 
    borderRadius: 16, 
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#F0F4F4',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  modalTitle: { 
    color: COLORS.text, 
    fontSize: 20, 
    fontWeight: '800' 
  },
  closeBtn: {
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 20
  },

  // Input
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 40 
  },
  currencySymbol: { 
    fontSize: 48, 
    color: COLORS.primary, 
    marginRight: 8, 
    fontWeight: '600' 
  },
  amountInput: { 
    fontSize: 64, 
    color: COLORS.text, 
    fontWeight: '800', 
    minWidth: 80, 
    textAlign: 'center',
    letterSpacing: -2
  },
  
  sectionLabel: { 
    color: COLORS.textMuted, 
    fontSize: 12, 
    fontWeight: '700', 
    marginBottom: 12, 
    textTransform: 'uppercase', 
    letterSpacing: 1.2 
  },

  // Chips & Toggles
  chipContainer: { 
    marginBottom: 28 
  },
  chip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.background, 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: COLORS.border
  },
  chipActive: { 
    backgroundColor: 'rgba(46, 125, 110, 0.08)', 
    borderColor: COLORS.primary 
  },
  chipText: { 
    color: COLORS.textMuted, 
    fontSize: 14, 
    fontWeight: '600' 
  },
  chipTextActive: { 
    color: COLORS.primary, 
    fontWeight: '800' 
  },

  toggleContainer: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 28 
  },
  toggleBtn: { 
    flex: 1, 
    paddingVertical: 16, 
    alignItems: 'center', 
    borderRadius: 16, 
    backgroundColor: COLORS.background, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  
  // Custom Toggles for Need/Want
  toggleNeedActive: {
    backgroundColor: 'rgba(46, 125, 110, 0.08)', 
    borderColor: COLORS.primary
  },
  toggleNeedTextActive: {
    color: COLORS.primary,
    fontWeight: '800'
  },
  toggleWantActive: {
    backgroundColor: 'rgba(255, 200, 87, 0.12)', 
    borderColor: COLORS.accent
  },
  toggleWantTextActive: {
    color: '#C68B1C', 
    fontWeight: '800'
  },

  // General Toggles
  toggleBtnActive: { 
    backgroundColor: 'rgba(46, 125, 110, 0.08)', 
    borderColor: COLORS.primary 
  }, 
  toggleText: { 
    color: COLORS.textMuted, 
    fontSize: 14, 
    fontWeight: '600' 
  },
  toggleTextActive: { 
    color: COLORS.primary, 
    fontWeight: '800' 
  }, 

  // Text Inputs
  inputBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.background, 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    height: 60, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: COLORS.border
  },
  inputIcon: { 
    marginRight: 12 
  },
  textInput: { 
    flex: 1, 
    color: COLORS.text, 
    fontSize: 16, 
    height: '100%',
    fontWeight: '500'
  },

  // Primary Button
  primaryButton: { 
    height: 60, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6
  },
  primaryButtonText: { 
    color: COLORS.white, 
    fontSize: 18, 
    fontWeight: '800',
    letterSpacing: 0.5
  },

  // Loading / Success
  loadingOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 10, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32 
  },
  successBadge: { 
    alignItems: 'center' 
  },
  successText: { 
    color: COLORS.text, 
    fontSize: 20, 
    fontWeight: '800', 
    marginTop: 16 
  }
});