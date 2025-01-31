import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { habitService } from '../../services/habitService';
import { Habit, HabitType, TimeFrame } from '../../types/habit';
import { router, useFocusEffect } from 'expo-router';
import AddHabitModal from '../../components/AddHabitModal';
import { FontAwesome } from '@expo/vector-icons';
import CountInput from '../../components/CountInput';

const calculateProjectedProgress = (counts: Record<string, number>, yearlyGoal: number): number => {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const dayOfYear = Math.ceil((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const daysInYear = 365;
  
  const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const projectedTotal = Math.round((totalCount / dayOfYear) * daysInYear);
  return (projectedTotal / yearlyGoal) * 100;
};

export default function HomeScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isCountModalVisible, setIsCountModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [])
  );

  const loadHabits = async () => {
    try {
      setIsLoading(true);
      const loadedHabits = await habitService.getAllHabits();
      setHabits(loadedHabits);
    } catch (error) {
      console.error('Error loading habits:', error);
      Alert.alert('Error', 'Failed to load habits');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHabit = async (data: {
    name: string;
    type: HabitType;
    goal?: number;
    timeFrame?: TimeFrame;
  }) => {
    try {
      setIsLoading(true);
      await habitService.createHabit(
        data.name,
        data.type,
        data.goal,
        data.timeFrame
      );
      await loadHabits();
      setIsAddModalVisible(false);
    } catch (error) {
      console.error('Error adding habit:', error);
      Alert.alert('Error', 'Failed to add habit');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHabitCompletion = async (habit: Habit) => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      if (habit.type === 'yesno') {
        await habitService.toggleHabitCompletion(habit.id, today);
      } else {
        // For count-type habits, we'll navigate to the detail screen
        router.push(`/habit/${habit.id}`);
      }
      
      await loadHabits();
    } catch (error) {
      console.error('Error toggling habit:', error);
      Alert.alert('Error', 'Failed to update habit');
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressText = (habit: Habit) => {
    if (habit.type === 'yesno') {
      return `🔥 ${habit.currentStreak} days`;
    }
    return '';  // Return empty string for count-type habits
  };

  const handleHabitPress = (habit: Habit) => {
    if (habit.type === 'yesno') {
      toggleHabitCompletion(habit);
    } else {
      setSelectedHabit(habit);
      setIsCountModalVisible(true);
    }
  };

  const handleUpdateCount = async (count: number) => {
    if (!selectedHabit) return;

    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      await habitService.updateCount(selectedHabit.id, today, count);
      await loadHabits();
    } catch (error) {
      console.error('Error updating count:', error);
      Alert.alert('Error', 'Failed to update count');
    } finally {
      setIsLoading(false);
      setIsCountModalVisible(false);
      setSelectedHabit(null);
    }
  };

  const calculateProgress = (habit: Habit): number => {
    if (!habit.goal || !habit.timeFrame) return 0;
    return habitService.calculateProgress(habit.counts || {}, habit.goal, habit.timeFrame);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Tempo</Text>
      
      {isLoading && <Text style={styles.loadingText}>Loading...</Text>}
      
      <ScrollView style={styles.habitList}>
        <View style={styles.heroContainer}>
          <Image 
            source={require('../../assets/images/melody-line.png')} 
            style={styles.heroImage}
            resizeMode="contain"
          />
          <Text style={styles.caption}>The end of a melody is not its point.</Text>
        </View>

        {habits.map((habit) => (
          <TouchableOpacity
            key={habit.id}
            style={styles.habitItem}
            onPress={() => handleHabitPress(habit)}
          >
            <View style={styles.habitInfo}>
              <TouchableOpacity 
                onPress={() => router.push(`/habit/${habit.id}`)}
                style={styles.habitNameButton}
              >
                <View style={styles.habitNameContainer}>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  {habit.type === 'count' && (
                    <Text style={[
                      styles.trackingStatus,
                      { color: calculateProjectedProgress(habit.counts || {}, habit.yearlyGoal || 100000) >= 100 ? '#4CD964' : '#FF3B30' }
                    ]}>
                      {calculateProjectedProgress(habit.counts || {}, habit.yearlyGoal || 100000) >= 100 ? 'ON TRACK' : 'OFF TRACK'}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              {habit.type === 'yesno' && (
                <Text style={styles.streakText}>{getProgressText(habit)}</Text>
              )}
            </View>
            {habit.type === 'yesno' ? (
              <View style={[
                styles.checkbox,
                habit.completedDates.includes(new Date().toISOString().split('T')[0]) && styles.checked
              ]} />
            ) : (
              <View style={styles.countContainer}>
                <Text style={styles.countText}>
                  {habit.counts[new Date().toISOString().split('T')[0]] || 0}
                </Text>
                <FontAwesome name="pencil" size={16} color="#007AFF" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsAddModalVisible(true)}
        disabled={isLoading}
      >
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>

      <AddHabitModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSubmit={handleAddHabit}
        onHabitAdded={loadHabits}
      />

      {selectedHabit && (
        <CountInput
          visible={isCountModalVisible}
          onClose={() => {
            setIsCountModalVisible(false);
            setSelectedHabit(null);
          }}
          onSubmit={handleUpdateCount}
          currentCount={selectedHabit.counts[new Date().toISOString().split('T')[0]] || 0}
          habitName={selectedHabit.name}
          goal={selectedHabit.goal}
        />
      )}
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
  habitList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 10,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#007AFF',
  },
  habitNameButton: {
    alignSelf: 'flex-start',
  },
  streakText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  checked: {
    backgroundColor: '#007AFF',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  floatingButtonText: {
    fontSize: 30,
    color: '#fff',
  },
  loadingText: {
    textAlign: 'center',
    padding: 10,
    color: '#666',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  heroContainer: {
    marginBottom: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroImage: {
    width: '100%',
    height: 120,
    marginBottom: 10,
  },
  caption: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
  },
  habitNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trackingStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
