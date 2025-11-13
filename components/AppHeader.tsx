import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';
import Logo from './Logo';
import { 
  getResponsivePadding, 
  getResponsiveFontSize, 
  getResponsiveGap,
  isSmallScreen 
} from '../utils/responsive';

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
    paddingVertical: getResponsivePadding(14),
    paddingHorizontal: getResponsivePadding(20),
    borderRadius: 14,
    marginBottom: getResponsiveGap(16),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: getResponsiveGap(8),
  },
  title: { 
    color: Colors.card, 
    fontSize: getResponsiveFontSize(isSmallScreen ? 18 : 20), 
    fontWeight: '800', 
    textAlign: 'center',
    flexShrink: 1,
  },
  subtitle: { 
    color: Colors.card, 
    opacity: 0.9, 
    marginTop: 2, 
    textAlign: 'center',
    fontSize: getResponsiveFontSize(isSmallScreen ? 12 : 14),
  },
});













