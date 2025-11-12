import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface CalendarPickerProps {
  selectedDate: string | null; // Format: 'DD-MM-YYYY'
  onDateSelect: (date: string) => void;
  availableDates?: Set<string>; // Dates with available slots
  minDate?: Date;
  maxDate?: Date;
}

const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function CalendarPicker({
  selectedDate,
  onDateSelect,
  availableDates = new Set(),
  minDate,
  maxDate,
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const formatDate = (date: Date): string => {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const getDaysInMonth = (year: number, month: number): Date[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    
    // Add days from previous month to fill the first week
    const startDay = firstDay.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(date);
    }
    
    // Add days of current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    
    // Add days from next month to fill the last week (42 days total)
    const remainingDays = 42 - days.length;
    for (let d = 1; d <= remainingDays; d++) {
      days.push(new Date(year, month + 1, d));
    }
    
    return days;
  };

  const isDateAvailable = (date: Date): boolean => {
    const dateStr = formatDate(date);
    return availableDates.has(dateStr);
  };

  const isDateSelectable = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    
    if (dateToCheck < today) return false;
    if (minDate && dateToCheck < minDate) return false;
    if (maxDate && dateToCheck > maxDate) return false;
    
    return isDateAvailable(date);
  };

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return formatDate(date) === selectedDate;
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const days = getDaysInMonth(currentYear, currentMonth);

  return (
    <View style={styles.container}>
      {/* Header with month/year and navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigateMonth('prev')}
          style={styles.navButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.monthYear}>
          {months[currentMonth]} {currentYear}
        </Text>
        
        <TouchableOpacity
          onPress={() => navigateMonth('next')}
          style={styles.navButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Days of week header */}
      <View style={styles.daysOfWeek}>
        {daysOfWeek.map((day, index) => (
          <View key={index} style={styles.dayOfWeek}>
            <Text style={styles.dayOfWeekText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {days.map((date, index) => {
          const selectable = isDateSelectable(date);
          const selected = isSelected(date);
          const today = isToday(date);
          const currentMonthDay = isCurrentMonth(date);
          const hasSlots = isDateAvailable(date);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.day,
                !currentMonthDay && styles.dayOtherMonth,
                selected && styles.daySelected,
                today && !selected && styles.dayToday,
                !selectable && styles.dayDisabled,
              ]}
              onPress={() => {
                if (selectable) {
                  onDateSelect(formatDate(date));
                }
              }}
              disabled={!selectable}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayText,
                  !currentMonthDay && styles.dayTextOtherMonth,
                  selected && styles.dayTextSelected,
                  today && !selected && styles.dayTextToday,
                  !selectable && styles.dayTextDisabled,
                ]}
              >
                {date.getDate()}
              </Text>
              {hasSlots && selectable && !selected && (
                <View style={styles.availableDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotAvailable]} />
          <Text style={styles.legendText}>Disponível</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotSelected]} />
          <Text style={styles.legendText}>Selecionado</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotToday]} />
          <Text style={styles.legendText}>Hoje</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.cardAlt,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  daysOfWeek: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayOfWeek: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayOfWeekText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 2,
    position: 'relative',
  },
  dayOtherMonth: {
    opacity: 0.3,
  },
  daySelected: {
    backgroundColor: Colors.tint,
  },
  dayToday: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 2,
    borderColor: Colors.tint,
  },
  dayDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  dayTextOtherMonth: {
    color: Colors.textSecondary,
  },
  dayTextSelected: {
    color: Colors.card,
    fontWeight: '700',
  },
  dayTextToday: {
    color: Colors.tint,
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: Colors.textSecondary,
  },
  availableDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.tint,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDotAvailable: {
    backgroundColor: Colors.tint,
  },
  legendDotSelected: {
    backgroundColor: Colors.tint,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendDotToday: {
    backgroundColor: Colors.tint,
    borderWidth: 2,
    borderColor: Colors.tint,
    width: 8,
    height: 8,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});









