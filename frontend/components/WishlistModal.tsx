import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Modal, KeyboardAvoidingView, Platform, Alert, ScrollView, ActivityIndicator, SafeAreaView
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti';
import { useApi } from '.././services/api'; // Make sure path is correct!

interface WishlistModalProps {
  visible: boolean;
  onClose: () => void;
}

// --- Synchronized Premium Palette ---
const COLORS = {
  primary: '#2E7D6E',     // Deep Teal
  primaryDark: '#1B4D44', // Darker Teal
  background: '#F8FAFA',  // Premium Off-white
  surface: '#FFFFFF',     // Pure White
  text: '#0F172A',        // Slate 900
  textMuted: '#64748B',   // Slate 500
  border: '#E2E8F0',      // Slate 200
  success: '#059669',     // Emerald Green
};

// ✅ FIXED: Helper component defined OUTSIDE the parent
const FormRow = ({ children, delay }: { children: React.ReactNode, delay: number }) => (
  <MotiView
    from={{ opacity: 0, translateY: 15 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 400, delay }}
  >
    {children}
  </MotiView>
);

export default function WishlistModal({ visible, onClose }: WishlistModalProps) {
  const api = useApi();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [isDateSelected, setIsDateSelected] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setIsDateSelected(true);
    }
  };

  const handleSave = async () => {
    if (!name || !targetAmount) {
      return Alert.alert("Wait a sec", "Please enter a name and target amount.");
    }
    
    setIsLoading(true);

    try {
      const savedGoal = await api.createGoal({
        name,
        targetAmount,
        desiredDate: isDateSelected ? date.toISOString().split('T')[0] : undefined, 
      });

      if (savedGoal) {
        setIsLoading(false);
        setIsSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setTimeout(() => {
          setIsSuccess(false);
          setName('');
          setTargetAmount('');
          setIsDateSelected(false);
          onClose();
        }, 1500);
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Error", "Failed to add to wishlist.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Goal</Text>
          <TouchableOpacity 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }} 
            style={styles.closeBtn} 
            disabled={isLoading || isSuccess}
          >
            <Feather name="x" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
            
            <FormRow delay={50}>
              <Text style={styles.label}>What are you saving for?</Text>
              <View style={styles.inputBox}>
                <Feather name="shopping-bag" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput} 
                  placeholder="e.g. PlayStation 5, Vacation" 
                  placeholderTextColor={COLORS.textMuted} 
                  value={name} 
                  onChangeText={setName} 
                />
              </View>
            </FormRow>

            <FormRow delay={150}>
              <Text style={styles.label}>Target Amount</Text>
              <View style={styles.inputBox}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput 
                  style={styles.textInput} 
                  placeholder="0.00" 
                  placeholderTextColor={COLORS.textMuted} 
                  keyboardType="numeric" 
                  value={targetAmount} 
                  onChangeText={setTargetAmount} 
                />
              </View>
            </FormRow>

            <FormRow delay={250}>
              <Text style={styles.label}>Target Date (Optional)</Text>
              <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowPicker(true)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="calendar" size={16} color={COLORS.textMuted} style={{ marginRight: 12 }} />
                  <Text style={[styles.dateText, !isDateSelected && { color: COLORS.textMuted }]}>
                    {isDateSelected ? date.toISOString().split('T')[0] : 'Pick a date'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={COLORS.border} />
              </TouchableOpacity>
            </FormRow>

            <FormRow delay={350}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleSave}
                disabled={isLoading || isSuccess}
                style={{ marginTop: 40 }}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[styles.primaryButton, (isLoading || isSuccess) && { opacity: 0.6 }]}
                >
                  <Text style={styles.primaryButtonText}>Add to Wishlist</Text>
                </LinearGradient>
              </TouchableOpacity>
            </FormRow>

            {showPicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
            
            <View style={{ height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Animated Overlay */}
        <AnimatePresence>
          {(isLoading || isSuccess) && (
            <MotiView 
              from={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              style={styles.overlay}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
              ) : (
                <MotiView 
                  from={{ scale: 0.8, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  transition={{ type: 'spring', damping: 15 }}
                  style={styles.successContainer}
                >
                  <View style={styles.heartCircle}>
                    <Ionicons name="heart" size={48} color={COLORS.surface} />
                  </View>
                  <Text style={styles.successTitle}>Goal Added</Text>
                  <Text style={styles.successSub}>We'll help you find ways to save for this.</Text>
                </MotiView>
              )}
            </MotiView>
          )}
        </AnimatePresence>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 32, 
    paddingBottom: 20, 
  },
  headerTitle: { 
    color: COLORS.text, 
    fontSize: 24, 
    fontWeight: '800',
    letterSpacing: -0.5
  },
  closeBtn: { 
    backgroundColor: COLORS.surface,
    padding: 10, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formScroll: { 
    paddingHorizontal: 24 
  },
  label: { 
    color: COLORS.textMuted, 
    fontSize: 12, 
    fontWeight: '700', 
    marginBottom: 10, 
    marginTop: 24, 
    textTransform: 'uppercase', 
    letterSpacing: 1.2 
  },
  inputBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.surface, 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    height: 56, 
    borderWidth: 1,
    borderColor: COLORS.border
  },
  inputIcon: { 
    marginRight: 12 
  },
  currencyPrefix: { 
    fontSize: 18, 
    color: COLORS.primary, 
    fontWeight: '700', 
    marginRight: 12 
  },
  textInput: { 
    flex: 1, 
    color: COLORS.text, 
    fontSize: 16, 
    height: '100%',
    fontWeight: '500'
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface, 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateText: { 
    color: COLORS.text, 
    fontSize: 16,
    fontWeight: '500' 
  },
  primaryButton: {
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4
  },
  primaryButtonText: { 
    color: COLORS.surface, 
    fontSize: 16, 
    fontWeight: '800',
    letterSpacing: 0.5 
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successContainer: { 
    alignItems: 'center', 
    padding: 30 
  },
  heartCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.success, // Switched to the Emerald success color
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8
  },
  successTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: COLORS.text, 
    letterSpacing: -0.5
  },
  successSub: { 
    fontSize: 15, 
    color: COLORS.textMuted, 
    textAlign: 'center', 
    marginTop: 10, 
    lineHeight: 22,
    fontWeight: '500'
  },
});