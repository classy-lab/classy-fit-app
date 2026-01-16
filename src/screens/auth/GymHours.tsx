import { StyleSheet, Text, View, Image, Dimensions, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import WorkoutSvg from '../../components/svg/WorkoutSvg'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import { s, vs } from 'react-native-size-matters'

const windowWidth = Dimensions.get('window').width

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
      <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
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
          <Text style={styles.callText}>
            Call Anytime{"\n\n"}
            +91  095536 27654
          </Text>
        </View>
        <View style={styles.imageContainer}>
          <WorkoutSvg />
        </View>
      </ScrollView>
    </SafeAreaView >
  )
}

export default GymHours

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    // justifyContent: 'flex-end',
    borderWidth: 1, bordeerColor: 'red',
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
    // flex: 1,
  },
  bodyText: {
    fontFamily: "Montserrat",
    lineHeight: 24,
    color: AppColors.primary,
  },
  imageContainer: {
    marginBottom: 8,
    alignSelf: 'center',
    // borderWidth: 1, bordeerColor: 'red',
  },
  columnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: windowWidth - 64
  },
  column: {
    // flexDirection: 'column',
    // borderWidth: 1, borderColor: 'red',
  },
  columnText: {
    fontSize: s(16),
    lineHeight: s(32),
  },
  addressText: {
    color: AppColors.primary,
    fontSize: s(16),
    lineHeight: s(32),
    marginTop: s(32),
    alignSelf: 'center',
    textAlign: 'center',
    // borderWidth: 1, borderColor: 'red',
  },
  callText: {
    fontWeight: 'bold',
    fontSize: s(16),
    lineHeight: s(16),
    alignSelf: 'center',
    textAlign: 'center',
    marginTop: s(32),
  }
})
