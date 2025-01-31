import { collection, addDoc, getDocs, query, where, updateDoc, doc, Timestamp, getDoc, DocumentData, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Habit, HabitType, TimeFrame } from '../types/habit';
import { v4 as uuidv4 } from 'uuid';

const HABITS_COLLECTION = 'habits';

export const habitService = {
  async createHabit(
    name: string,
    type: HabitType,
    goal?: number,
    timeFrame?: TimeFrame,
    weeklyFrequency: number = 5
  ): Promise<void> {
    try {
      const newHabit: Habit = {
        id: uuidv4(),
        name,
        type,
        createdAt: new Date(),
        currentStreak: 0,
        completedDates: [],
        counts: {},
        weeklyFrequency,
        ...(type === 'count' && {
          goal,
          timeFrame,
          yearlyGoal: 100000
        })
      };
      
      const habitRef = doc(db, HABITS_COLLECTION, newHabit.id);
      await setDoc(habitRef, {
        ...newHabit,
        createdAt: Timestamp.fromDate(newHabit.createdAt),
      });
    } catch (error) {
      console.error('Error creating habit:', error);
      throw error;
    }
  },

  async getAllHabits(): Promise<Habit[]> {
    try {
      const querySnapshot = await getDocs(collection(db, HABITS_COLLECTION));
      const habits = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          counts: data.counts || {},
          type: data.type || 'yesno',
          goal: data.type === 'count' ? (data.goal || data.yearlyGoal || 0) : undefined,
          timeFrame: data.type === 'count' ? (data.timeFrame || 'year') : undefined,
        } as Habit;
      });
      return habits;
    } catch (error) {
      console.error('Error fetching habits:', error);
      throw error;
    }
  },

  async toggleHabitCompletion(habitId: string, date: string): Promise<void> {
    try {
      const habitRef = doc(db, HABITS_COLLECTION, habitId);
      const habitDoc = await getDoc(habitRef);

      if (!habitDoc.exists()) {
        throw new Error('Habit not found');
      }

      const habitData = habitDoc.data() as DocumentData;
      const completedDates = new Set(habitData.completedDates || []);
      
      if (completedDates.has(date)) {
        completedDates.delete(date);
      } else {
        completedDates.add(date);
      }

      // Calculate streak
      const sortedDates = [...completedDates].sort();
      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
        streak = 1;
        let checkDate = new Date(sortedDates[sortedDates.length - 1] as string);
        checkDate.setDate(checkDate.getDate() - 1);

        while (sortedDates.includes(checkDate.toISOString().split('T')[0])) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }

      await updateDoc(habitRef, {
        completedDates: Array.from(completedDates),
        currentStreak: streak,
      });
    } catch (error) {
      console.error('Error in toggleHabitCompletion:', error);
      throw error;
    }
  },

  async updateCount(habitId: string, date: string, count: number): Promise<void> {
    try {
      const habitRef = doc(db, HABITS_COLLECTION, habitId);
      const habitDoc = await getDoc(habitRef);

      if (!habitDoc.exists()) {
        throw new Error('Habit not found');
      }

      const habitData = habitDoc.data() as DocumentData;
      const counts = { ...(habitData.counts || {}) };
      counts[date] = count;

      // If count is greater than 0, mark the date as completed
      const completedDates = new Set(habitData.completedDates || []);
      if (count > 0) {
        completedDates.add(date);
      } else {
        completedDates.delete(date);
      }

      await updateDoc(habitRef, {
        counts,
        completedDates: Array.from(completedDates),
      });
    } catch (error) {
      console.error('Error updating count:', error);
      throw error;
    }
  },

  async updateHabitName(habitId: string, newName: string): Promise<void> {
    try {
      console.log('Updating habit name:', { habitId, newName });
      const habitRef = doc(db, HABITS_COLLECTION, habitId);
      await updateDoc(habitRef, { name: newName });
      console.log('Habit name updated successfully');
    } catch (error) {
      console.error('Error updating habit name:', error);
      throw error;
    }
  },

  async deleteHabit(habitId: string): Promise<void> {
    console.log('deleteHabit called with ID:', habitId);
    try {
      const habitRef = doc(db, HABITS_COLLECTION, habitId);
      console.log('Created reference to document:', habitId);
      
      await deleteDoc(habitRef);
      console.log('Document successfully deleted:', habitId);
    } catch (error) {
      console.error('Error in deleteHabit:', error);
      throw error;
    }
  },

  async getHabitStats(habitId: string): Promise<{
    totalCompletions: number;
    averagePerWeek: number;
    currentStreak: number;
    longestStreak: number;
  }> {
    try {
      const habitRef = doc(db, HABITS_COLLECTION, habitId);
      const habitDoc = await getDoc(habitRef);
      
      if (!habitDoc.exists()) {
        throw new Error('Habit not found');
      }

      const habit = habitDoc.data() as DocumentData;
      const completedDates = habit.completedDates || [];
      const createdAt = habit.createdAt.toDate();
      
      // Calculate weeks since creation
      const now = new Date();
      const weeksSinceCreation = Math.max(1, Math.ceil((now.getTime() - createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000)));
      
      // Calculate longest streak
      let longestStreak = 0;
      let currentStreak = 0;
      const sortedDates = [...completedDates].sort();
      
      for (let i = 0; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        const nextDate = i < sortedDates.length - 1 ? new Date(sortedDates[i + 1]) : null;
        
        if (nextDate && (nextDate.getTime() - currentDate.getTime()) === 86400000) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak + 1);
          currentStreak = 0;
        }
      }

      return {
        totalCompletions: completedDates.length,
        averagePerWeek: Number((completedDates.length / weeksSinceCreation).toFixed(1)),
        currentStreak: habit.currentStreak || 0,
        longestStreak,
      };
    } catch (error) {
      console.error('Error getting habit stats:', error);
      throw error;
    }
  },

  async updateHabitGoals(
    habitId: string,
    updates: { 
      goal?: number; 
      timeFrame?: TimeFrame;
      weeklyFrequency?: number;
    }
  ): Promise<void> {
    try {
      const habitRef = doc(db, HABITS_COLLECTION, habitId);
      const updateData: Record<string, any> = {};
      
      // Only include defined values in the update
      if (updates.goal !== undefined) updateData.goal = updates.goal;
      if (updates.timeFrame !== undefined) updateData.timeFrame = updates.timeFrame;
      if (updates.weeklyFrequency !== undefined) updateData.weeklyFrequency = updates.weeklyFrequency;
      
      await updateDoc(habitRef, updateData);
    } catch (error) {
      console.error('Error updating habit goals:', error);
      throw error;
    }
  },

  calculateProgress: (counts: Record<string, number>, goal: number, timeFrame: TimeFrame): number => {
    const today = new Date();
    let totalCount = 0;
    let periodStart: Date;

    switch (timeFrame) {
      case 'day':
        periodStart = new Date(today.setHours(0, 0, 0, 0));
        break;
      case 'week':
        periodStart = new Date(today.setDate(today.getDate() - today.getDay()));
        break;
      case 'month':
        periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'year':
        periodStart = new Date(today.getFullYear(), 0, 1);
        break;
    }

    for (const [date, count] of Object.entries(counts)) {
      const countDate = new Date(date);
      if (countDate >= periodStart && countDate <= today) {
        totalCount += count;
      }
    }

    return (totalCount / goal) * 100;
  },
}; 