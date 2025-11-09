import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import Colors from '../../constants/Colors';
import AppHeader from '../../components/AppHeader';

export default function Emergencias() {
  const ligar = () => {
    Linking.openURL('tel:188'); // CVV - apoio emocional
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <AppHeader title="Emergências" subtitle="Ajuda imediata e suporte" />
      <Text style={styles.title}>Emergência Psicológica</Text>
      <Text style={styles.description}>
        Se você está passando por uma crise ou precisa de ajuda imediata, entre em contato com um profissional ou ligue para o CVV (Centro de Valorização da Vida).
      </Text>

      <TouchableOpacity onPress={ligar} style={styles.button}>
        <Text style={styles.buttonText}>Ligar para 188</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
