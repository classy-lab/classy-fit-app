import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Classy Gym</Text>
      <View>
        <View><Text>Gym</Text></View>
        <View><Text>Classes</Text></View>
        <View><Text>Training</Text></View>
      </View>
      <Text style={styles.subTitle}>Helping gyms and workouts be productive for everyone</Text>
      <Button style={styles.registerBtn} title="Register" onPress={() => Alert.alert("You clicked on the Register button.")} />
      <Button style={styles.loginBtn} title="Login" onPress={() => Alert.alert("You clicked on Login button.")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
