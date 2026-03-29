// app/sign-up.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { MotiView } from 'moti'; // Imported Moti
import { useApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const COLORS = {
  primary: '#2E7D6E',     // Teal Green
  background: '#F4F7F6',  // Background
  text: '#1F2933',        // Dark Text
  textMuted: '#6B7280',   // Gray Text
  white: '#FFFFFF',
  border: 'rgba(31, 41, 51, 0.08)',
  borderFocus: '#2E7D6E'
};

export default function SignUpScreen() {
  const api = useApi();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const onSignUpPress = async () => {
    if (!name || !emailAddress || !password) {
      Alert.alert('Missing Info', 'Please fill out all fields.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.register(name, emailAddress, password);
      if (data && data.token) {
        await login(data.token);
      }
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.accentBar} />

        <MotiView 
          from={{ opacity: 0, translateY: 30 }} 
          animate={{ opacity: 1, translateY: 0 }} 
          transition={{ type: 'timing', duration: 700 }}
          style={styles.container}
        >
          {/* Brand */}
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoIcon}>₹</Text>
            </View>
            <Text style={styles.brandName}>Spendly</Text>
          </View>

          <Text style={styles.headline}>Create account</Text>
          <Text style={styles.subheadline}>Join thousands taking control of their finances.</Text>

          {/* Step indicator */}
          <View style={styles.stepRow}>
            <View style={styles.stepDot} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, styles.stepDotInactive]} />
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, styles.stepDotInactive]} />
          </View>
          <Text style={styles.stepLabel}>Step 1 of 1 · Basic info</Text>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                value={name}
                placeholder="e.g. Aryan Sharma"
                placeholderTextColor={COLORS.textMuted}
                onChangeText={setName}
                style={[styles.input, focusedField === 'name' && styles.inputFocused]}
                editable={!loading}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                value={emailAddress}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textMuted}
                onChangeText={setEmailAddress}
                style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                keyboardType="email-address"
                editable={!loading}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                placeholder="Min. 8 characters"
                placeholderTextColor={COLORS.textMuted}
                onChangeText={setPassword}
                style={[styles.input, focusedField === 'password' && styles.inputFocused]}
                secureTextEntry
                editable={!loading}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Terms notice */}
          <Text style={styles.termsText}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink}>Terms</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onSignUpPress}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/sign-in" asChild>
              <TouchableOpacity disabled={loading}>
                <Text style={styles.link}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </MotiView>

        <View style={styles.securityBadge}>
          <Text style={styles.securityText}>🔒 256-bit encrypted · Your data stays private</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  accentBar: {
    height: 4, backgroundColor: COLORS.primary, width: 40,
    alignSelf: 'center', borderRadius: 2, marginTop: 50, marginBottom: 40,
  },
  container: { paddingHorizontal: 28 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  logoBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
  },
  logoIcon: { fontSize: 20, color: COLORS.white, fontWeight: '800' },
  brandName: { fontSize: 22, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5 },
  headline: { fontSize: 32, fontWeight: '800', color: COLORS.text, marginBottom: 8, letterSpacing: -0.5 },
  subheadline: { fontSize: 16, color: COLORS.textMuted, marginBottom: 20, lineHeight: 22 },
  
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  stepDotInactive: { backgroundColor: '#E5E7EB' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 6, borderRadius: 1 },
  stepLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  form: { gap: 20, marginBottom: 16 },
  fieldWrap: { gap: 8 },
  label: {
    fontSize: 12, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, padding: 16, fontSize: 16, color: COLORS.text,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1
  },
  inputFocused: { borderColor: COLORS.borderFocus, shadowOpacity: 0.05 },
  termsText: { color: COLORS.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 24, textAlign: 'center' },
  termsLink: { color: COLORS.primary, fontWeight: '700' },
  button: {
    backgroundColor: COLORS.text, // Dark button for premium feel
    paddingVertical: 18, borderRadius: 14,
    alignItems: 'center',
    shadowColor: COLORS.text, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 14, elevation: 6,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 28, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: COLORS.textMuted, fontSize: 15 },
  link: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
  securityBadge: { alignItems: 'center', paddingVertical: 32, marginTop: 8 },
  securityText: { color: '#9CA3AF', fontSize: 13, fontWeight: '500' },
});