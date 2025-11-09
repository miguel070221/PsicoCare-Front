import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

type Props = { title: string; subtitle?: string };

export default function AppHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.headerBlue,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: { color: Colors.card, fontSize: 20, fontWeight: '800' },
  subtitle: { color: Colors.card, opacity: 0.9, marginTop: 2 },
});










