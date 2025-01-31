export type HabitType = 'yesno' | 'count';
export type TimeFrame = 'day' | 'week' | 'month' | 'year';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  goal?: number;
  timeFrame?: TimeFrame;
  weeklyFrequency?: number; // New field for yes/no habits
  yearlyGoal: number; // Required field for count-type habits
  createdAt: Date;
  currentStreak: number;
  completedDates: string[]; // ISO date strings
  // For count-type habits, store the count for each date
  counts: Record<string, number>;
}

export interface HabitCompletion {
  habitId: string;
  date: string; // ISO date string
  completed: boolean;
} 