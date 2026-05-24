import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>ReDrobe</Text>
      <Text style={styles.placeholder}>Home screen coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
