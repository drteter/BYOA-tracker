import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { HabitType, TimeFrame } from '../types/habit';

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: HabitType;
    goal?: number;
    yearlyGoal?: number;
    timeFrame?: TimeFrame;
  }) => void;
  initialValues?: {
    name?: string;
    type?: HabitType;
    goal?: number;
    yearlyGoal?: number;
    timeFrame?: TimeFrame;
  };
  isEditing?: boolean;
}

export default function AddHabitModal({ visible, onClose, onSubmit, initialValues, isEditing }: AddHabitModalProps) {
  const [name, setName] = useState(initialValues?.name || '');
  const [type, setType] = useState<HabitType>(initialValues?.type || 'yesno');
  const [goal, setGoal] = useState(initialValues?.goal?.toString() || '');
  const [yearlyGoal, setYearlyGoal] = useState(initialValues?.yearlyGoal?.toString() || '');
  const [timeFrame, setTimeFrame] = useState<TimeFrame | undefined>(initialValues?.timeFrame);

  useEffect(() => {
    if (visible) {
      setName(initialValues?.name || '');
      setType(initialValues?.type || 'yesno');
      setGoal(initialValues?.goal?.toString() || '');
      setYearlyGoal(initialValues?.yearlyGoal?.toString() || '');
      setTimeFrame(initialValues?.timeFrame);
    }
  }, [visible, initialValues]);

  const handleSubmit = () => {
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      type,
      ...(goal && { goal: parseInt(goal, 10) }),
      ...(yearlyGoal && { yearlyGoal: parseInt(yearlyGoal, 10) }),
      ...(timeFrame && { timeFrame }),
    });

    if (!isEditing) {
      setName('');
      setType('yesno');
      setGoal('');
      setYearlyGoal('');
      setTimeFrame(undefined);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.title}>{isEditing ? 'Edit Habit' : 'Add New Habit'}</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter habit name"
              autoFocus
            />

            <Text style={styles.label}>Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'yesno' && styles.selectedType]}
                onPress={() => setType('yesno')}
              >
                <Text style={[styles.typeText, type === 'yesno' && styles.selectedTypeText]}>
                  Yes/No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'count' && styles.selectedType]}
                onPress={() => setType('count')}
              >
                <Text style={[styles.typeText, type === 'count' && styles.selectedTypeText]}>
                  Count
                </Text>
              </TouchableOpacity>
            </View>

            {type === 'count' && (
              <>
                <Text style={styles.label}>Goal per Time Frame</Text>
                <TextInput
                  style={styles.input}
                  value={goal}
                  onChangeText={setGoal}
                  placeholder="Enter goal amount"
                  keyboardType="numeric"
                />

                <Text style={styles.label}>Yearly Goal</Text>
                <TextInput
                  style={styles.input}
                  value={yearlyGoal}
                  onChangeText={setYearlyGoal}
                  placeholder="Enter yearly goal"
                  keyboardType="numeric"
                />

                <Text style={styles.label}>Time Frame</Text>
                <View style={styles.timeFrameContainer}>
                  {(['day', 'week', 'month', 'year'] as TimeFrame[]).map((tf) => (
                    <TouchableOpacity
                      key={tf}
                      style={[styles.timeFrameButton, timeFrame === tf && styles.selectedTimeFrame]}
                      onPress={() => setTimeFrame(tf)}
                    >
                      <Text
                        style={[
                          styles.timeFrameText,
                          timeFrame === tf && styles.selectedTimeFrameText,
                        ]}
                      >
                        {tf.charAt(0).toUpperCase() + tf.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, !name.trim() && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={!name.trim()}
              >
                <Text style={styles.addButtonText}>{isEditing ? 'Save' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '50%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectedType: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeText: {
    fontSize: 16,
    color: '#333',
  },
  selectedTypeText: {
    color: '#fff',
  },
  timeFrameContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  timeFrameButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTimeFrame: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeFrameText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTimeFrameText: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    padding: 15,
    marginLeft: 10,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#B4B4B4',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 