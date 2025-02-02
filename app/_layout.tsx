import { Stack, SplashScreen, Redirect } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, browserLocalPersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from '../config/firebase';

// Initialize Firebase only once
if (!getApps().length) {
  const app = initializeApp(firebaseConfig);
  if (Platform.OS === 'web') {
    const auth = getAuth(app);
    auth.setPersistence(browserLocalPersistence)
      .catch(error => {
        console.error("Auth persistence error:", error);
      });
  }
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Prepare the app
    async function prepare() {
      try {
        console.log('Preparing app...');
        // Add any initialization logic here
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('Preparation error:', e);
      } finally {
        console.log('App preparation complete');
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

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
          animation: Platform.OS === 'web' ? 'none' : 'default',
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