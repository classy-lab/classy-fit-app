import { StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message'
import { NavigationContainer } from '@react-navigation/native'
import HomeScreen from './src/components/HomeScreen';

export default function App() {

  return (
    <>
      <NavigationContainer>
        <FlashMessage posigion={'top'} />
        <HomeScreen />
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({});
