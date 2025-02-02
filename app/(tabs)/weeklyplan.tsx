import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { habitService } from '../../services/habitService';
import { Habit, WeekDay } from '../../types/habit';
import Checkbox from 'expo-checkbox'; // Install with `expo install expo-checkbox`
import { useFocusEffect } from 'expo-router';

const WEEK_DAYS: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WeeklyPlanScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadHabits = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedHabits = await habitService.getAllHabits();
      // Only show yes/no type habits for weekly planning
      setHabits(loadedHabits.filter(habit => habit.type === 'yesno'));
      console.log('Weekly plan habits loaded:', loadedHabits.filter(habit => habit.type === 'yesno').length);
    } catch (error) {
      console.error('Error loading habits:', error);
      Alert.alert('Error', 'Failed to load habits.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('Weekly plan screen focused, loading habits...');
      loadHabits();
    }, [loadHabits])
  );

  const toggleDay = async (habit: Habit, day: WeekDay) => {
    if (!habit.scheduledDays) habit.scheduledDays = [];
    let updatedDays: WeekDay[];

    if (habit.scheduledDays.includes(day)) {
      updatedDays = habit.scheduledDays.filter(d => d !== day);
    } else {
      updatedDays = [...habit.scheduledDays, day];
    }

    try {
      await habitService.setScheduledDays(habit.id, updatedDays);
      setHabits(prevHabits => prevHabits.map(h => h.id === habit.id ? { ...h, scheduledDays: updatedDays } : h));
    } catch (error) {
      Alert.alert('Error', 'Failed to update scheduled days.');
    }
  };

  const checkAllocation = (habit: Habit): boolean => {
    if (!habit.weeklyFrequency || !habit.scheduledDays) return true;
    return habit.scheduledDays.length >= habit.weeklyFrequency;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Planning</Text>
      <Text style={styles.subtitle}>Schedule your weekly habits</Text>
      
      {isLoading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : habits.length === 0 ? (
        <Text style={styles.emptyText}>No weekly habits to plan. Add some habits from the home screen!</Text>
      ) : (
        <ScrollView>
          {habits.map(habit => (
            <View key={habit.id} style={styles.habitItem}>
              <View style={styles.habitHeader}>
                <Text style={styles.habitName}>{habit.name}</Text>
                <Text style={styles.habitGoal}>Goal: {habit.weeklyFrequency}x per week</Text>
              </View>
              
              <View style={styles.daysContainer}>
                {WEEK_DAYS.map(day => (
                  <View key={day} style={styles.dayItem}>
                    <Checkbox
                      value={habit.scheduledDays?.includes(day) || false}
                      onValueChange={() => toggleDay(habit, day)}
                      style={styles.checkbox}
                    />
                    <Text style={styles.dayLabel}>{day.substring(0, 3)}</Text>
                  </View>
                ))}
              </View>
              
              {!checkAllocation(habit) ? (
                <Text style={styles.warningText}>
                  ⚠️ Schedule {habit.weeklyFrequency! - (habit.scheduledDays?.length || 0)} more days to meet your weekly goal
                </Text>
              ) : (
                <Text style={styles.successText}>
                  ✓ Weekly goal planned
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  habitItem: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  habitHeader: {
    marginBottom: 16,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  habitGoal: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  dayItem: {
    alignItems: 'center',
  },
  checkbox: {
    marginBottom: 4,
  },
  dayLabel: {
    fontSize: 12,
    color: '#333',
  },
  warningText: {
    marginTop: 12,
    color: '#FF3B30',
    fontSize: 14,
  },
  successText: {
    marginTop: 12,
    color: '#34C759',
    fontSize: 14,
  },
});
