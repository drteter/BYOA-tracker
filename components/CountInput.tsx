import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';

interface CountInputProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (count: number) => void;
  currentCount: number;
  habitName: string;
  goal?: number;
  date?: Date;
}

const screenWidth = Dimensions.get('window').width;

const formatDate = (dateString: string) => {
  // Create a date object in the local timezone
  const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
  const date = new Date(year, month - 1, day);  // month is 0-based in Date constructor
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[date.getDay()];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[date.getMonth()];
  const dayOfMonth = date.getDate();
  
  return `${dayName}, ${monthName} ${dayOfMonth}`;
};

export default function CountInput({
  visible,
  onClose,
  onSubmit,
  currentCount,
  habitName,
  goal,
  date,
}: CountInputProps) {
  const [count, setCount] = useState(currentCount.toFixed(1));

  const handleSubmit = () => {
    const numCount = parseFloat(count) || 0;
    // Round to 1 decimal place
    const roundedCount = Math.round(numCount * 10) / 10;
    onSubmit(roundedCount);
    setCount('0.0');
  };

  const handleCountChange = (text: string) => {
    // Allow only numbers and one decimal point
    if (/^\d*\.?\d*$/.test(text)) {
      // If there's a decimal point, limit to one decimal place
      if (text.includes('.')) {
        const [whole, decimal] = text.split('.');
        setCount(`${whole}.${decimal.slice(0, 1)}`);
      } else {
        setCount(text);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{habitName}</Text>
          {date && (
            <Text style={styles.date}>
              {formatDate(typeof date === 'string' ? date : date.toISOString())}
            </Text>
          )}
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={count}
            onChangeText={handleCountChange}
            autoFocus
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.submitButton]} 
              onPress={handleSubmit}
            >
              <Text style={[styles.buttonText, styles.submitButtonText]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.5, // Half screen width
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    width: '80%',
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#f2f2f7',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  submitButtonText: {
    color: '#fff',
  },
}); 