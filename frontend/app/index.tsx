// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View } from 'react-native';

export default function Index() {
  const { isAuthenticated, isAuthLoaded } = useAuth();

  // Safety check: wait until we know the token status before redirecting
  if (!isAuthLoaded) return <View />; 

  // Direct traffic perfectly based on the global state!
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/records" />;
  } else {
    return <Redirect href="/sign-in" />;
  }
}