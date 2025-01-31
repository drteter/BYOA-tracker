import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { habitService } from '../../services/habitService';
import { Habit } from '../../types/habit';
import { FontAwesome } from '@expo/vector-icons';
import CountInput from '../../components/CountInput';
import HabitDashboard from '../../components/HabitDashboard';
import ProgressTracker from '../../components/ProgressTracker';
import { Calendar } from 'react-native-calendars';

type HabitStats = {
  totalCompletions: number;
  averagePerWeek: number;
  currentStreak: number;
  longestStreak: number;
};

export default function HabitDetails() {
  const { id } = useLocalSearchParams();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [stats, setStats] = useState<HabitStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isCountModalVisible, setIsCountModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    loadHabitData();
  }, [id]);

  const loadHabitData = async () => {
    if (!id || typeof id !== 'string') return;

    try {
      setIsLoading(true);
      const habits = await habitService.getAllHabits();
      const habit = habits.find(h => h.id === id);
      
      if (!habit) {
        Alert.alert('Error', 'Habit not found');
        router.back();
        return;
      }

      setHabit(habit);
      const habitStats = await habitService.getHabitStats(id);
      setStats(habitStats);
    } catch (error) {
      console.error('Error loading habit details:', error);
      Alert.alert('Error', 'Failed to load habit details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCount = async (count: number) => {
    if (!habit || !selectedDate) return;
    
    try {
      setIsLoading(true);
      await habitService.updateCount(habit.id, selectedDate, count);
      await loadHabitData();
    } catch (error) {
      console.error('Error updating count:', error);
      Alert.alert('Error', 'Failed to update count');
    } finally {
      setIsLoading(false);
      setIsCountModalVisible(false);
      setSelectedDate(null);
    }
  };

  const handleDayPress = (dateString: string) => {
    if (!habit) return;

    if (habit.type === 'count') {
      setSelectedDate(dateString);
      setIsCountModalVisible(true);
    } else {
      habitService.toggleHabitCompletion(habit.id, dateString)
        .then(loadHabitData)
        .catch(error => {
          console.error('Error toggling habit:', error);
          Alert.alert('Error', 'Failed to update habit');
        });
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const changeMonth = (increment: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + increment);
    setSelectedMonth(newDate);
  };

  const renderCalendar = () => {
    if (!habit) return null;

    const daysInMonth = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
      0
    ).getDate();
    
    const firstDayOfMonth = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth(),
      1
    ).getDay();
    
    const days = [];

    // Add empty spaces for the first week
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.calendarDay}>
          <View style={styles.dayContainer}>
            <Text style={styles.dayText}></Text>
          </View>
        </View>
      );
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
      const dateString = date.toISOString().split('T')[0];
      const isCompleted = habit.type === 'count' 
        ? (habit.counts[dateString] || 0) > 0 
        : habit.completedDates.includes(dateString);

      days.push(
        <TouchableOpacity
          key={day}
          style={styles.calendarDay}
          onPress={() => handleDayPress(dateString)}
        >
          <View 
            style={[
              styles.dayContainer,
              isCompleted && styles.completedDay,
            ]} 
          >
            <Text style={[
              styles.dayText,
              isCompleted && styles.completedDayText
            ]}>
              {day}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Add empty spaces to complete the last week if needed
    const totalDays = firstDayOfMonth + daysInMonth;
    const remainingDays = 7 - (totalDays % 7);
    if (remainingDays < 7) {
      for (let i = 0; i < remainingDays; i++) {
        days.push(
          <View key={`empty-end-${i}`} style={styles.calendarDay}>
            <View style={styles.dayContainer}>
              <Text style={styles.dayText}></Text>
            </View>
          </View>
        );
      }
    }

    // Group days into rows of 7 for better layout
    const rows = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(
        <View key={i} style={styles.calendarRow}>
          {days.slice(i, i + 7)}
        </View>
      );
    }

    return rows;
  };

  const calculateWeeklyStats = () => {
    if (!habit) return { thisWeek: 0, timesPerWeek: 0, progress: 0 };

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    if (habit.type === 'yesno') {
      const completionsThisWeek = habit.completedDates.filter(date => {
        const completionDate = new Date(date);
        return completionDate >= startOfWeek && completionDate <= today;
      }).length;

      // Calculate progress based on weekly frequency goal
      const weeklyGoal = habit.weeklyFrequency || 7; // Default to 7 if no goal set
      const progress = Math.min(100, (completionsThisWeek / weeklyGoal) * 100);

      return {
        thisWeek: completionsThisWeek,
        timesPerWeek: completionsThisWeek,
        progress,
      };
    }

    // Get start of year
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const weeksSinceStartOfYear = Math.max(1, 
      Math.ceil((today.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000))
    );

    if (habit.type === 'count') {
      // Calculate total count for count-type habits
      const totalCount = Object.values(habit.counts).reduce((sum, count) => sum + count, 0);
      
      // Calculate this week's count
      const thisWeekCount = Object.entries(habit.counts)
        .filter(([date]) => {
          const countDate = new Date(date);
          return countDate >= startOfWeek && countDate <= today;
        })
        .reduce((sum, [_, count]) => sum + count, 0);

      // Calculate times per week (number of days with nonzero counts this year / weeks since start of year)
      const daysWithCountsThisYear = Object.entries(habit.counts)
        .filter(([date, count]) => {
          const countDate = new Date(date);
          return count > 0 && countDate >= startOfYear && countDate <= today;
        }).length;

      const timesPerWeek = Number((daysWithCountsThisYear / weeksSinceStartOfYear).toFixed(1));

      // Calculate progress based on total count and goal
      let progress = 0;
      if (habit.goal) {
        progress = Math.min(100, (totalCount / habit.goal) * 100);
      }

      return {
        thisWeek: thisWeekCount,
        timesPerWeek,
        progress,
      };
    } else {
      // For yes/no habits, keep existing logic
      const completionsThisWeek = habit.completedDates.filter(date => {
        const completionDate = new Date(date);
        return completionDate >= startOfWeek && completionDate <= today;
      }).length;

      // Calculate times per week for yes/no habits since start of year
      const completionsThisYear = habit.completedDates.filter(date => {
        const completionDate = new Date(date);
        return completionDate >= startOfYear && completionDate <= today;
      }).length;

      const timesPerWeek = Number((completionsThisYear / weeksSinceStartOfYear).toFixed(1));

      return {
        thisWeek: completionsThisWeek,
        timesPerWeek,
        progress: (completionsThisWeek / 7) * 100,
      };
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setIsCountModalVisible(true);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        {habit && (
          <HabitDashboard
            name={habit.name}
            createdAt={habit.createdAt}
            {...calculateWeeklyStats()}
          />
        )}

        <View style={styles.calendarContainer}>
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <FontAwesome name="chevron-left" size={20} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <FontAwesome name="chevron-right" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.calendar}>
            <View style={styles.weekDays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>
            {renderCalendar()}
          </View>
        </View>

        {habit && habit.type === 'count' && (
          <ProgressTracker
            totalCount={Object.values(habit.counts || {}).reduce((sum, count) => sum + count, 0)}
            yearlyGoal={habit.goal || 0}
            startDate={new Date(habit.createdAt)}
            counts={habit.counts || {}}
          />
        )}
      </ScrollView>

      {habit && habit.type === 'count' && selectedDate && (
        <CountInput
          visible={isCountModalVisible}
          onClose={() => {
            setIsCountModalVisible(false);
            setSelectedDate(null);
          }}
          onSubmit={handleUpdateCount}
          currentCount={selectedDate ? (habit.counts[selectedDate] || 0) : 0}
          habitName={habit.name}
          goal={habit.goal}
          date={new Date(selectedDate)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 0,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#f8f8f8',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  calendarContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  calendar: {
    padding: 15,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  calendarDay: {
    alignItems: 'center',
    width: 32,
  },
  dayContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  completedDay: {
    backgroundColor: '#007AFF',
  },
  dayText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  completedDayText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  countText: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 