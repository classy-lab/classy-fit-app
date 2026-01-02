import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native'

const LoginScreen = () => {
  const navigation = useNavigation()
  return (
    <SafeAreaView style={styles.container}>
      <Text>LoginScreen</Text>
      <TouchableOpacity onPress={() => { navigation.goBack() }}><Text>Go Back</Text></TouchableOpacity>
    </SafeAreaView>
  )
}

export default LoginScreen

const styles = StyleSheet.create({})