import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

type Props = { icon?: string; title: string; hint?: string };

export default function EmptyState({ icon = '🔎', title, hint }: Props) {
  return (
    <View style={styles.box}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: { fontSize: 34, marginBottom: 8 },
  title: { color: Colors.textSecondary, fontWeight: '700' },
  hint: { color: Colors.textSecondary, marginTop: 6 },
});






















