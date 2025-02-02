import { Stack, SplashScreen, Redirect } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { getApps, initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from '../config/firebase';

// Add a check for web platform before initializing Firebase
if (Platform.OS === 'web') {
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig);
    initializeAuth(app, {
      // Use browser's local storage instead of AsyncStorage for web
      persistence: undefined
    });
  }
} else {
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig);
    initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { loading, user } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      {!user && <Redirect href="/" />}
      <Stack
        screenOptions={{
          headerShown: false,
          ...(Platform.OS === 'web' ? {
            animation: 'none',
          } : {}),
        }}
      >
        <Stack.Screen 
          name="index"
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="register"
          options={{
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="logout-success"
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="(tabs)"
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="habit/[id]"
          options={{
            gestureEnabled: true,
            animation: Platform.OS === 'web' ? 'none' : 'default',
          }}
        />
      </Stack>
    </>
  );
} 