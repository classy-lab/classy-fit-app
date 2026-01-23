import { StyleSheet, Text, View, Image, Dimensions, ScrollView, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import Jogging from '../../components/svg/Jogging'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'

const windowWidth = Dimensions.get('window').width

const GymHours = () => {
  const navigation = useNavigation()
  const [fontsLoaded] = useFonts({
    "Montserrat": require("../../assets/fonts/montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("../../assets/fonts/montserrat/Montserrat-Bold.ttf")
  })

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
          <Text style={styles.callText}>
            Call Anytime{"\n\n"}
            +91  095536 27654
          </Text>
        </View>
        <View style={styles.imageContainer}>
          <Jogging width="360" />
        </View>
      </ScrollView>
    </SafeAreaView >
  )
}

export default GymHours

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    // flex: 1,
    paddingLeft: 24,
    paddingRight: 24,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headingContainer: {
    alignItems: 'center'
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 32,
    marginTop: 60,
  },
  pinkLeaf: {
    position: 'absolute',
    zIndex: -1,
    top: 32,
    right: 40
  },
  body: {},
  bodyText: {
    fontFamily: "Montserrat",
    lineHeight: 24,
    color: AppColors.primary,
    // borderWidth: 1, borderColor: 'red',
  },
  imageContainer: {
    marginTop: 16,
    alignSelf: 'center',
  },
  columnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 40,
  },
  column: {},
  columnText: {
    fontSize: 16,
    lineHeight: 32,
  },
  callText: {
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 16,
    alignSelf: 'center',
    textAlign: 'center',
    marginTop: 32,
  }
})
