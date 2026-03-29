// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useApi } from '../services/api';
import FinancialOnboarding from '../components/FinancialOnboarding';
import { AuthProvider, useAuth } from '../context/AuthContext'; 

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const api = useApi();
  
  const { isAuthenticated, isAuthLoaded } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const checkProfileStatus = useCallback(async () => {
    try {
      const profile = await api.getProfile();
      if (!profile) setShowOnboarding(true);
    } catch (e) {
      console.error("Profile check failed", e);
    }
  }, [api]);

  // 🛡️ BULLETPROOF NAVIGATION GUARD 🛡️
  useEffect(() => {
    if (!isAuthLoaded) return;

    // Check if the user is currently looking at the sign-in or sign-up screens
    const inAuthGroup = segments[0] === 'sign-in' || segments[0] === 'sign-up';

    if (isAuthenticated) {
      checkProfileStatus();
      // If they ARE logged in, but sitting on an auth screen, push them into the app
      if (inAuthGroup) {
        router.replace('/(tabs)/records'); 
      }
    } else {
      // If they are NOT logged in, and NOT already on an auth screen, force them to sign in!
      if (!inAuthGroup) {
        router.replace('/sign-in');
      }
    }
  }, [isAuthenticated, isAuthLoaded, segments, checkProfileStatus]); 

  const handleOnboardingComplete = async (data: any) => {
    try {
      await api.updateProfile(data);
      setShowOnboarding(false);
    } catch (e) {
      console.error("Failed to save profile", e);
    }
  };

  if (!isAuthLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack>
      <FinancialOnboarding visible={showOnboarding} onComplete={handleOnboardingComplete} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}