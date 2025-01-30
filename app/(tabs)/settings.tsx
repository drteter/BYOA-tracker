import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { habitService } from '../../services/habitService';
import { Habit } from '../../types/habit';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function SettingsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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

  const deleteHabit = async (habitId: string) => {
    try {
      console.log('Attempting to delete habit with ID:', habitId);
      setIsLoading(true);
      await habitService.deleteHabit(habitId);
      console.log('Habit deleted, reloading habits...');
      await loadHabits();
    } catch (error) {
      console.error('Error deleting habit:', error);
      Alert.alert('Error', 'Failed to delete habit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Habits</Text>
      
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
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
    fontSize: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  deleteButton: {
    // Add any necessary styles for the delete button
  },
}); 