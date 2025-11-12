import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image, ImageSourcePropType } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Colors from '../constants/Colors';

type LogoProps = {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 360;

export default function Logo({ size = 'medium', showText = true }: LogoProps) {
  const sizes = {
    small: { width: 80, height: 60 },
    medium: { width: 140, height: 105 },
    large: { width: 200, height: 150 },
  };

  const currentSize = sizes[size];

  // Carrega a imagem do logo
  // A imagem está em: PsicoCare/assets/images/Logo.png
  // Caminho correto: de components/ para assets/ é ../assets/
  const logoImage = require('../assets/images/Logo.png') as ImageSourcePropType;

  return (
    <View style={styles.container}>
      {logoImage ? (
        // Se a imagem existe, usa ela
        <Image
          source={logoImage}
          style={[styles.logoImage, { 
            width: currentSize.width, 
            height: currentSize.height 
          }]}
          resizeMode="contain"
        />
      ) : (
        // Fallback: mostra o design CSS se a imagem não existir
        <View style={[styles.brainContainer, { width: currentSize.width, height: currentSize.height * 0.85 }]}>
          <View style={[styles.brainHemisphere, styles.brainLeft, { 
            width: currentSize.width * 0.4, 
            height: currentSize.height * 0.7,
            borderRadius: currentSize.width * 0.2 
          }]} />
          <View style={[styles.brainHemisphere, styles.brainRight, { 
            width: currentSize.width * 0.4, 
            height: currentSize.height * 0.7,
            borderRadius: currentSize.width * 0.2 
          }]} />
          <View style={[styles.brainCenter, { 
            width: currentSize.width * 0.3, 
            height: currentSize.height * 0.5,
            borderRadius: currentSize.width * 0.15 
          }]} />
        </View>
      )}
      
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.textPsico, { fontSize: size === 'small' ? 20 : size === 'medium' ? 28 : 36 }]}>Psico</Text>
          <Text style={[styles.textCare, { fontSize: size === 'small' ? 20 : size === 'medium' ? 28 : 36 }]}>Care</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    marginBottom: 12,
    resizeMode: 'contain',
  },
  brainContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brainHemisphere: {
    position: 'absolute',
    top: '15%',
  },
  brainLeft: {
    left: 0,
    backgroundColor: '#4FB0F0',
    opacity: 0.85,
  },
  brainRight: {
    right: 0,
    backgroundColor: '#6EC1FF',
    opacity: 0.85,
  },
  brainCenter: {
    position: 'absolute',
    backgroundColor: '#5FB0E6',
    zIndex: 1,
    opacity: 0.9,
  },
  brainDetail: {
    position: 'absolute',
    backgroundColor: '#87CEEB',
    opacity: 0.6,
    borderRadius: 4,
  },
  detail1: {
    width: 8,
    height: 20,
    left: '25%',
    top: '30%',
  },
  detail2: {
    width: 6,
    height: 15,
    right: '30%',
    top: '40%',
  },
  detail3: {
    width: 10,
    height: 12,
    left: '45%',
    bottom: '25%',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textPsico: {
    fontWeight: 'bold',
    color: '#0B2A4A',
  },
  textCare: {
    fontWeight: 'bold',
    color: '#6EC1FF',
  },
});

