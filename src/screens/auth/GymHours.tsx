import { StyleSheet, Text, View, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import WorkoutSvg from '../../components/svg/WorkoutSvg'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'

const GymHours = () => {
  const navigation = useNavigation()
  const [fontsLoaded] = useFonts({
    "Montserrat": require("../../assets/fonts/montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("../../assets/fonts/montserrat/Montserrat-Bold.ttf")
  })

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
        <Ionicons color={AppColors.hamburgerIconColor} name="menu" size={40} onPress={() => navigation.openDrawer()} />
      </View>
      <View style={styles.headingContainer}>
        <Text style={styles.title}>Gym Hours</Text>
        <PinkLeafSvg style={styles.pinkLeaf} />
      </View>
      <View style={styles.body}>
        <View style={styles.columnContainer}>
          <View style={styles.column}>
            <Text style={styles.columnText}>Sunday</Text>
            <Text style={styles.columnText}>Monday</Text>
            <Text style={styles.columnText}>Tuesday</Text>
            <Text style={styles.columnText}>Wednesday</Text>
            <Text style={styles.columnText}>Thursday</Text>
            <Text style={styles.columnText}>Friday</Text>
            <Text style={styles.columnText}>Saturday</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.columnText}>6 AM to 10 AM</Text>
            <Text style={styles.columnText}>5.30 AM to 9 PM</Text>
            <Text style={styles.columnText}>5.30 AM to 9 PM</Text>
            <Text style={styles.columnText}>5.30 AM to 9 PM</Text>
            <Text style={styles.columnText}>5.30 AM to 9 PM</Text>
            <Text style={styles.columnText}>5.30 AM to 9 PM</Text>
            <Text style={styles.columnText}>5.30 AM to 9 PM</Text>
          </View>
        </View>
        <Text style={styles.addressText}>
          Address:{"\n"}
          Varakala Nivas Super Market{"\n"}
          Sree ramnjanagar colony,{"\n"}
          Hyderabad, Munganoor{"\n"}
          Telangana 501505{"\n\n"}
        </Text>
        <Text style={styles.callText}>
          Call Anytime{"\n\n"}
          +91  095536 27654
        </Text>
      </View>
      <View style={styles.imageContainer}>
        <WorkoutSvg />
      </View>
    </SafeAreaView >
  )
}

export default GymHours

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    // justifyContent: 'flex-end',
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
    marginTop: 60,
  },
  pinkLeaf: {
    position: 'relative',
    zIndex: -1,
    top: -68,
    right: -40
  },
  body: {
    // borderWidth: 1, bordeerColor: 'red',
    flex: 1,
  },
  bodyText: {
    fontFamily: "Montserrat",
    lineHeight: 24,
    color: AppColors.primary,
  },
  registerBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 140,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 14
  },
  loginBtn: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: AppColors.blue,
    borderRadius: 40,
    width: 140,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: {
    color: AppColors.blue,
    fontSize: 14
  },
  imageContainer: {
    marginBottom: 8
    // borderWidth: 1, bordeerColor: 'red',
  }
})
