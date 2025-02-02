import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { habitService } from '../../services/habitService';
import { Habit, HabitType, TimeFrame, WeekDay } from '../../types/habit';
import { router, useFocusEffect } from 'expo-router';
import AddHabitModal from '../../components/AddHabitModal';
import { FontAwesome } from '@expo/vector-icons';
import CountInput from '../../components/CountInput';
import HabitDashboard from '../../components/HabitDashboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { getDay } from 'date-fns';

const WEEK_DAYS: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isCountModalVisible, setIsCountModalVisible] = useState(false);

  console.log('Current user:', user?.uid); // Debug log for user

  const loadHabits = useCallback(async () => {
    console.log('LoadHabits called, user:', user?.uid);
    if (!user) {
      console.log('No user found, skipping habit load');
      return;
    }

    try {
      setIsLoading(true);
      const loadedHabits = await habitService.getAllHabits();
      console.log('Habits loaded:', loadedHabits.length);
      
      // Debug log for completion dates
      loadedHabits.forEach(habit => {
        console.log(`Habit "${habit.name}" completion dates:`, habit.completedDates);
      });
      
      setHabits(loadedHabits);
    } catch (error) {
      console.error('Error loading habits:', error);
      Alert.alert('Error', 'Failed to load habits');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, user:', user?.uid); // Debug log for focus effect
      if (user) {
        loadHabits();
      }
    }, [loadHabits, user])
  );

  const handleAddHabit = async (data: {
    name: string;
    type: HabitType;
    goal?: number;
    timeFrame?: TimeFrame;
    weeklyFrequency?: number;
  }) => {
    if (!user) return;

    try {
      setIsLoading(true);
      await habitService.createHabit(
        data.name,
        data.type,
        data.goal,
        data.timeFrame,
        data.weeklyFrequency
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
    if (isLoading || !user) return;

    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      if (habit.type === 'yesno') {
        await habitService.toggleHabitCompletion(habit.id, today);
      } else {
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
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const completionsThisWeek = habit.completedDates.filter(date => {
        const completionDate = new Date(date);
        return completionDate >= startOfWeek && completionDate <= today;
      }).length;

      const weeklyGoal = habit.weeklyFrequency || 1;
      return `${completionsThisWeek}/${weeklyGoal}x this week`;
    }
    return '';
  };

  const handleHabitPress = (habit: Habit) => {
    router.push(`/habit/${habit.id}`);
  };

  const handleHabitAction = (habit: Habit) => {
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
    if (!habit.goal) return 0;
    
    const today = new Date();
    const counts = habit.counts || {};
    let totalCount = 0;
    
    // Calculate total count for all time
    for (const count of Object.values(counts)) {
      totalCount += count;
    }
    
    // Calculate progress based on yearly goal
    return Math.min((totalCount / habit.goal) * 100, 100);
  };

  const isHabitCompletedToday = (habit: Habit): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return habit.completedDates.includes(today);
  };

  const today = new Date();
  // Get current weekday (Monday = 0, Sunday = 6)
  const currentWeekDay: WeekDay = WEEK_DAYS[today.getDay() === 0 ? 6 : today.getDay() - 1];

  // Get habits for different sections
  const sortHabits = (habits: Habit[]) => {
    return [...habits].sort((a, b) => {
      const aCompleted = isHabitCompletedToday(a);
      const bCompleted = isHabitCompletedToday(b);
      if (aCompleted === bCompleted) return 0;
      return aCompleted ? 1 : -1; // Uncompleted habits come first
    });
  };

  const todaysHabits = sortHabits(habits.filter(habit => 
    !habit.isPaused &&
    habit.type === 'yesno' && 
    habit.scheduledDays?.includes(currentWeekDay)
  ));

  const weeklyHabits = sortHabits(habits.filter(habit => 
    !habit.isPaused && 
    habit.type === 'yesno'
  ));
  
  const annualHabits = sortHabits(habits.filter(habit => 
    !habit.isPaused && 
    habit.type === 'count'
  ));

  console.log('Current week day:', currentWeekDay);
  console.log('Today\'s habits:', todaysHabits.map(h => h.name));
  console.log('Weekly habits:', weeklyHabits.map(h => h.name));
  console.log('Annual habits:', annualHabits.map(h => h.name));

  const renderHabitItem = (habit: Habit, showCheckbox: boolean = true) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    // Adjust to get Monday as start of week
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6, others to 0-5
    startOfWeek.setDate(today.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Convert start of week to date string for comparison
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    console.log('Counting completions for habit:', habit.name);
    console.log('Start of week (normalized):', startOfWeekStr);
    console.log('Today (normalized):', todayStr);
    console.log('All completion dates:', habit.completedDates);

    const completionsThisWeek = habit.completedDates.filter(date => {
      // Compare just the date strings (YYYY-MM-DD format)
      const isInWeek = date >= startOfWeekStr && date <= todayStr;
      console.log('Checking date:', date, 'isInWeek:', isInWeek, 
        'startOfWeek:', startOfWeekStr, 'today:', todayStr);
      return isInWeek;
    }).length;

    console.log('Total completions this week:', completionsThisWeek);
    
    const isGoalAchieved = habit.type === 'yesno' 
      ? completionsThisWeek >= (habit.weeklyFrequency ?? 5)
      : calculateProgress(habit) >= 100;

    return (
      <LinearGradient
        key={habit.id}
        colors={isGoalAchieved 
          ? ['#DAA520', '#B8860B', '#8B6914'] 
          : ['#f8f8f8', '#f8f8f8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.habitItem}
      >
        <View style={styles.habitInfo}>
          <View style={styles.habitTitleRow}>
            <TouchableOpacity 
              style={styles.habitNameButton}
              onPress={() => handleHabitPress(habit)}
            >
              <Text style={[
                styles.habitName,
                isGoalAchieved && { color: '#FFFFFF' }
              ]}>
                {habit.name}
              </Text>
            </TouchableOpacity>
            {isGoalAchieved && (
              <FontAwesome 
                name="check-circle" 
                size={20} 
                color="#FFFFFF" 
                style={styles.checkmark}
              />
            )}
          </View>
          <View style={styles.rightSection}>
            <Text style={[
              styles.streakText,
              isGoalAchieved && { color: '#FFFFFF' }
            ]}>
              {habit.type === 'yesno' 
                ? `${completionsThisWeek}/${habit.weeklyFrequency ?? 5}x this week`
                : `${Math.round(calculateProgress(habit))}% complete`
              }
            </Text>
            {showCheckbox && habit.type === 'yesno' && (
              <TouchableOpacity
                onPress={() => handleHabitAction(habit)}
                style={styles.checkbox}
              >
                <FontAwesome 
                  name={isHabitCompletedToday(habit) ? "check" : "circle-o"}
                  size={24} 
                  color={isGoalAchieved ? "#FFFFFF" : (isHabitCompletedToday(habit) ? "#34C759" : "#000000")}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    );
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

        {/* Today's Goals Section */}
        <Text style={styles.sectionTitle}>Today's Goals</Text>
        {todaysHabits.length === 0 ? (
          <Text style={styles.emptyText}>No goals scheduled for today</Text>
        ) : (
          todaysHabits.map(habit => renderHabitItem(habit))
        )}

        {/* Weekly Goals Section */}
        <Text style={styles.sectionTitle}>Goals for the Week</Text>
        {weeklyHabits.length === 0 ? (
          <Text style={styles.emptyText}>No weekly goals set</Text>
        ) : (
          weeklyHabits.map(habit => renderHabitItem(habit))
        )}

        {/* Annual Goals Section */}
        <Text style={styles.sectionTitle}>Annual Goals</Text>
        {annualHabits.length === 0 ? (
          <Text style={styles.emptyText}>No annual goals set</Text>
        ) : (
          annualHabits.map(habit => renderHabitItem(habit, false))
        )}
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
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  habitInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
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
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 'auto',
  },
  checkbox: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  habitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  checkmark: {
    marginLeft: 4,
  },
  progressArea: {
    flex: 1,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  allocationContainer: {
    marginTop: 8,
  },
  allocationText: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#ddd',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 12,
    paddingHorizontal: 20,
  },
});
