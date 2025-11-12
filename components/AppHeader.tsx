import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';
import Logo from './Logo';

type Props = { title: string; subtitle?: string; showLogo?: boolean };

export default function AppHeader({ title, subtitle, showLogo = false }: Props) {
  return (
    <View style={styles.header}>
      {showLogo && (
        <View style={styles.logoWrapper}>
          <Logo size="small" showText={true} />
        </View>
      )}
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
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { color: Colors.card, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: Colors.card, opacity: 0.9, marginTop: 2, textAlign: 'center' },
});













