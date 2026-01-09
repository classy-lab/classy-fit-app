import { StyleSheet, Text, View, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import VectorImageSvg from '../../components/svg/VectorImageSvg'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import { s, vs } from 'react-native-size-matters'

const Contact = () => {
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
        <Text style={styles.title}>Contact Us</Text>
        <PinkLeafSvg style={styles.pinkLeaf} />
      </View>
      <View style={styles.body}>
        <Text style={styles.boldText}>
          V-Fitness Center & Gym{"\n"}
        </Text>
        <Text style={styles.bodyText}>
          Varakala Nivas Super Market{"\n"}
          Sree ramnjanagar colony,{"\n"}
          Hyderabad, Munganoor{"\n"}
          Telangana 501505{"\n\n"}
        </Text>
        <Text style={styles.boldText}>
          Call Anytime{"\n\n"}
          +91  095536 27654
        </Text>
      </View>
      <View style={styles.imageContainer}>
        <VectorImageSvg />
      </View>
    </SafeAreaView >
  )
}

export default Contact

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
  imageContainer: {
    marginBottom: 8
    // borderWidth: 1, bordeerColor: 'red',
  },
  boldText: {
    fontWeight: 'bold',
    fontSize: s(16),
    textAlign: 'center'
  },
  bodyText: {
    fontFamily: "Montserrat",
    fontSize: s(16),
    lineHeight: 32,
    color: AppColors.primary,
    marginLeft: 24,
    marginRight: 24,
    textAlign: 'center'
  },
})
