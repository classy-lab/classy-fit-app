import { StyleSheet, Text, View, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import { s, vs } from 'react-native-size-matters'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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
      <Text style={styles.body}>

      </Text>
      <View style={styles.imageContainer}>
        {/* <WorkoutSvg /> */}
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
    padding: 8
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
    marginTop: 60,
  },
  pinkLeaf: {
    position: 'relative',
    zIndex: -1,
    top: -68,
    right: -40
  },
  body: {
    fontFamily: "Montserrat",
    lineHeight: 24,
    color: AppColors.blue,
    marginLeft: 24,
    marginRight: 24,
    fontSize: s(20)
  },
  imageContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
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
  }
})
