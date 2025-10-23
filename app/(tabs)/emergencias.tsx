import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import Colors from '../../constants/Colors';

export default function Emergencias() {
  const ligar = () => {
    Linking.openURL('tel:188'); // CVV - apoio emocional
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTopTitle}>Emergências</Text>
      </View>
      <Text style={styles.title}>Emergência Psicológica</Text>
      <Text style={styles.description}>
        Se você está passando por uma crise ou precisa de ajuda imediata, entre em contato com um profissional ou ligue para o CVV (Centro de Valorização da Vida).
      </Text>

      <TouchableOpacity onPress={ligar} style={styles.button}>
        <Text style={styles.buttonText}>Ligar para 188</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    marginBottom: 20,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.destructive,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  headerTop: {
    backgroundColor: Colors.headerBlue,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    borderRadius: 6,
    marginBottom: 12,
  },
  headerTopTitle: {
    color: Colors.card,
    fontSize: 18,
    fontWeight: '700',
  },
});
