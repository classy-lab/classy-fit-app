import { StyleSheet, Text, View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import VectorImageSvg from '../../components/svg/VectorImageSvg'
import { s, vs } from 'react-native-size-matters'
import PhoneSvg from '../../components/svg/PhoneSvg'
import PinkShape from '../../components/svg/PinkShape.tsx'

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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headingContainer}>
          <Text style={styles.title}>Contact Us</Text>
          <PinkShape style={styles.pinkShape} />
        </View>
        <View style={styles.body}>
          <Text style={styles.boldText}>
            V-Fitness Center & Gym{"\n"}
          </Text>
          <Text style={styles.bodyText}>
            Varakala Nivas Super Market{"\n"}
            Sree ramnjanagar colony,{"\n"}
            Hyderabad, Munganoor{"\n"}
            Telangana 501505{"\n"}
          </Text>
          <Text style={styles.boldText}>
            Call Anytime{"\n\n"}
            +91  095536 27654
          </Text>
          <View>
            <PhoneSvg style={styles.phoneSvg} />
          </View>
        </View>
      </ScrollView>
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
    paddingLeft: 24,
    paddingRight: 24,
  },
  scrollView: {
    flex: 1,
    // borderWidth: 1, borderColor: 'red',
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
  pinkShape: {
    position: 'relative',
    zIndex: -1,
    top: -104,
    right: -80
  },
  body: {
    // borderWidth: 1, borderColor: 'red',
  },
  imageContainer: {
    marginTop: 32,
    alignItems: 'center',
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
  phoneSvg: {
    alignSelf: 'center',
    marginTop: 40,
  }
})
