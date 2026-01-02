import { StyleSheet, Text, View, Button, Alert, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font'
import HomeScreen from './src/components/HomeScreen';

export default function App() {
  const vectorImg = require('./src/assets/images/vector-img.png')
  const { height, width } = useWindowDimensions();
  const [fontLoaded] = useFonts({
    "Montserrat-Regular": require("./src/assets/fonts/montserrat/Montserrat-Regular.ttf"),
    'Montserrat-Medium': require('./src/assets/fonts/montserrat/Montserrat-Medium.ttf')
  })

  return (
    <SafeAreaView style={styles.container}>
      <HomeScreen />
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    width: "100%",
    borderWidth: 1,
  },
});
