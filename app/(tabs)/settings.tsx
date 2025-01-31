import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { habitService } from '../../services/habitService';
import { Habit, HabitType, TimeFrame } from '../../types/habit';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import AddHabitModal from '../../components/AddHabitModal';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const loadHabits = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedHabits = await habitService.getAllHabits();
      setHabits(loadedHabits);
    } catch (error) {
      console.error('Error loading habits:', error);
      Alert.alert('Error', 'Failed to load habits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [loadHabits])
  );

  const startEditing = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setEditingName(habit.name);
  };

  const saveHabitName = async () => {
    if (!editingHabitId || !editingName.trim()) return;

    try {
      setIsLoading(true);
      await habitService.updateHabitName(editingHabitId, editingName.trim());
      setEditingHabitId(null);
      setEditingName('');
      await loadHabits();
    } catch (error) {
      console.error('Error updating habit:', error);
      Alert.alert('Error', 'Failed to update habit name. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditGoals = (habit: Habit) => {
    setSelectedHabit(habit);
    setIsEditModalVisible(true);
  };

  const handleUpdateHabit = async (data: {
    name: string;
    type: HabitType;
    goal?: number;
    timeFrame?: TimeFrame;
    weeklyFrequency?: number;
  }) => {
    if (!selectedHabit) return;

    try {
      setIsLoading(true);
      await habitService.updateHabitGoals(selectedHabit.id, {
        goal: data.goal,
        timeFrame: data.timeFrame,
        weeklyFrequency: data.weeklyFrequency
      });
      setIsEditModalVisible(false);
      setSelectedHabit(null);
      await loadHabits();
    } catch (error) {
      console.error('Error updating habit:', error);
      Alert.alert('Error', 'Failed to update habit');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteHabit = async (habitId: string) => {
    try {
      setIsLoading(true);
      await habitService.deleteHabit(habitId);
      await loadHabits();
    } catch (error) {
      console.error('Error deleting habit:', error);
      Alert.alert('Error', 'Failed to delete habit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        {user && (
          <Text style={styles.email}>{user.email}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manage Habits</Text>
        
        {isLoading && <Text style={styles.loadingText}>Loading...</Text>}
        
        <ScrollView style={styles.habitList}>
          {habits.map((habit) => (
            <View key={habit.id} style={styles.habitItem}>
              {editingHabitId === habit.id ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.input}
                    value={editingName}
                    onChangeText={setEditingName}
                    onSubmitEditing={saveHabitName}
                    autoFocus
                  />
                  <TouchableOpacity 
                    style={styles.iconButton} 
                    onPress={saveHabitName}
                  >
                    <FontAwesome name="check" size={20} color="#4CD964" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.iconButton}
                    onPress={() => setEditingHabitId(null)}
                  >
                    <FontAwesome name="times" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.habitContent}>
                  <TouchableOpacity 
                    style={styles.habitName}
                    onPress={() => router.push(`/habit/${habit.id}`)}
                  >
                    <Text style={styles.habitNameText}>{habit.name}</Text>
                  </TouchableOpacity>
                  <View style={styles.actions}>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => startEditing(habit)}
                    >
                      <FontAwesome name="pencil" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => handleEditGoals(habit)}
                    >
                      <FontAwesome name="sliders" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.iconButton, styles.deleteButton]}
                      onPress={() => deleteHabit(habit.id)}
                    >
                      <FontAwesome name="trash" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <FontAwesome name="sign-out" size={20} color="#fff" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {selectedHabit && (
        <AddHabitModal
          visible={isEditModalVisible}
          onClose={() => {
            setIsEditModalVisible(false);
            setSelectedHabit(null);
          }}
          onSubmit={handleUpdateHabit}
          initialValues={selectedHabit || undefined}
          isEditing={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    flex: 1,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  loadingText: {
    textAlign: 'center',
    padding: 10,
    color: '#666',
  },
  habitList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  habitItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  habitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  habitName: {
    flex: 1,
  },
  habitNameText: {
    fontSize: 18,
    color: '#007AFF',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    fontSize: 16,
  },
  deleteButton: {
    marginLeft: 16,
  },
  logoutButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
}); 