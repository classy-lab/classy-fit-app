import { StyleSheet, Text, View, Image, Dimensions, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import { s, vs } from 'react-native-size-matters'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const windowWidth = Dimensions.get('window').width
const DashboardScreen = () => {
  const navigation = useNavigation()
  const [fontsLoaded] = useFonts({
    "Montserrat": require("../../assets/fonts/montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("../../assets/fonts/montserrat/Montserrat-Bold.ttf")
  })

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
        <View style={styles.signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
          <View style={styles.circle}>
            <MaterialIcons name="logout" color={AppColors.white} size={18} />
          </View>
        </View>
      </View>
      <View style={styles.headingContainer}>
        <Text style={styles.title}>Dashboard</Text>
      </View>
      <View style={styles.body}>
        <TouchableOpacity
          style={styles.blueBox}
          activeOpacity={0.7}
        >
          <Text style={styles.earningsText}>Earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.blueBox}
          activeOpacity={0.7}
        >
          <Text style={styles.earningsText}>Gym</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView >
  )
}

export default DashboardScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    alignItems: 'center',
    width: "100%",
    paddingLeft: 24,
    paddingRight: 24,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  headingContainer: {
    width: 375,
    alignItems: 'center'
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 32,
    marginTop: 20,
  },
  body: {
    flex: 1,
  },
  bodyText: {
    fontSize: s(14),
    fontFamily: "Montserrat",
    lineHeight: 24,
    color: AppColors.primary,
  },
  imageContainer: {
    marginBottom: 8
  },
  signOut: {
    // borderWidth: 1, borderColor: 'red',
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutText: {
    marginRight: 4,
    color: AppColors.blue,
    fontSize: 14
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    backgroundColor: AppColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3
  },
  blueBox: {
    backgroundColor: AppColors.blue,
    borderRadius: 24,
    width: windowWidth - 64,
    height: 128,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 20
  },
  earningsText: {
    color: AppColors.white,
    fontSize: 24
  }
})
