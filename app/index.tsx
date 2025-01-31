import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import Login from './login';

export default function Index() {
  const { user } = useAuth();

  // If user is authenticated, redirect to the main app
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  // Show login screen if not authenticated
  return <Login />;
} 