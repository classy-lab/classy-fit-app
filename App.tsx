import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Alert, Image } from 'react-native';
import Logo from './src/assets/images/vector-img.png'

export default function App() {
  const vectorImg = require('./src/assets/images/vector-img.png')

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Classy Gym</Text>
      <View>
        <Text>Gym</Text>
        <Text>Classes</Text>
        <Text>Training</Text>
      </View>
      <Text style={styles.subTitle}>Helping gyms and workouts be productive for everyone</Text>
      <Button style={styles.registerBtn} title="Register" onPress={() => Alert.alert("You clicked on the Register button.")} />
      <Button style={styles.loginBtn} title="Login" onPress={() => Alert.alert("You clicked on Login button.")} />
      <Image style={styles.image} source={vectorImg} />
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
