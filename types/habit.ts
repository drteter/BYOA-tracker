export type HabitType = 'yesno' | 'count';
export type TimeFrame = 'day' | 'week' | 'month' | 'year';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  goal?: number;
  timeFrame?: TimeFrame;
  createdAt: Date;
  currentStreak: number;
  completedDates: string[]; // ISO date strings
  // For count-type habits, store the count for each date
  counts: { [date: string]: number };
  yearlyGoal?: number; // Optional yearly goal for count-type habits
}

export interface HabitCompletion {
  habitId: string;
  date: string; // ISO date string
  completed: boolean;
} 