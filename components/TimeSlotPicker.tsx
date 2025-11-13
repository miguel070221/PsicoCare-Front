import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface TimeSlotPickerProps {
  slots: string[]; // Array of time slots in 'HH:MM' format
  selectedSlot: string | null;
  onSlotSelect: (slot: string) => void;
  loading?: boolean;
  date?: string; // Selected date for context
}

export default function TimeSlotPicker({
  slots,
  selectedSlot,
  onSlotSelect,
  loading = false,
  date,
}: TimeSlotPickerProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando horários disponíveis...</Text>
        </View>
      </View>
    );
  }

  if (slots.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>
            {date ? `Nenhum horário disponível para ${date}` : 'Nenhum horário disponível'}
          </Text>
          <Text style={styles.emptyHint}>
            Selecione outra data para ver os horários disponíveis
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        <Ionicons name="time" size={18} color={Colors.tint} /> Horários Disponíveis
        {date && <Text style={styles.dateText}> para {date}</Text>}
      </Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slotsContainer}
        nestedScrollEnabled
      >
        {slots.map((slot) => {
          const isSelected = selectedSlot === slot;
          
          return (
            <TouchableOpacity
              key={slot}
              style={[
                styles.slot,
                isSelected && styles.slotSelected,
              ]}
              onPress={() => onSlotSelect(slot)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.slotText,
                  isSelected && styles.slotTextSelected,
                ]}
              >
                {slot}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.card} style={styles.checkIcon} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {selectedSlot && (
        <View style={styles.selectedInfo}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.tint} />
          <Text style={styles.selectedText}>
            Horário selecionado: <Text style={styles.selectedTime}>{selectedSlot}</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  slotsContainer: {
    paddingVertical: 8,
    gap: 8,
  },
  slot: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.cardAlt,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotSelected: {
    backgroundColor: Colors.tint,
    borderColor: Colors.tint,
  },
  slotText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  slotTextSelected: {
    color: Colors.card,
  },
  checkIcon: {
    marginTop: 4,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.cardAlt,
    borderRadius: 8,
    gap: 8,
  },
  selectedText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedTime: {
    fontWeight: '700',
    color: Colors.tint,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});











