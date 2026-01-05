import { StyleSheet, Text, View, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import Entypo from '@expo/vector-icons/Entypo'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import VectorImageSvg from '../../components/svg/VectorImageSvg'
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
        <Entypo name="chevron-small-left" color={AppColors.blue} size={40} onPress={() => { navigation.goBack() }} />
        <Ionicons color={AppColors.hamburgerIconColor} name="menu" size={40} onPress={() => navigation.openDrawer()} />
      </View>
      <View style={styles.headingContainer}>
        <Text style={styles.title}>Gym Hours</Text>
        <PinkLeafSvg style={styles.pinkLeaf} />
      </View>
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
      <Text style={styles.body}>
        Address:{"\n"}
        Varakala Nivas Super Market{"\n"}
        Sree ramnjanagar colony,{"\n"}
        Hyderabad, Munganoor{"\n"}
        Telangana 501505{"\n\n"}
      </Text>
      <Text style={styles.boldText}>
        Call Anytime{"\n\n"}
        +91  095536 27654
      </Text>
      <View style={styles.imageContainer}>
        <VectorImageSvg />
      </View>
    </SafeAreaView >
  )
}

export default GymHours

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    alignItems: 'center',
    width: "100%",
    padding: 8
  },
  columnContainer: {
    flexDirection: 'row',             // Aligns children horizontally
    justifyContent: 'space-between',  // Optional: distributes space between columns
    marginLeft: 8
  },
  column: {
    flex: 1,                          // Ensures each column takes equal width
    paddingHorizontal: 5              // Optional: adds spacing within columns
  },
  columnText: {
    lineHeight: 32
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
  boldText: {
    fontWeight: 'bold',
    textAlign: 'center'
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
    color: AppColors.primary,
    marginTop: 32,
    width: '100%',
    textAlign: 'center'
  },
  imageContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    marginBottom: 8
  }
})
