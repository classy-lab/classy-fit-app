import { StyleSheet, Text, View, Image, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import WorkoutSvg from '../../components/svg/WorkoutSvg'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import { s, vs } from 'react-native-size-matters'

const About = () => {
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
          <Text style={styles.title}>About</Text>
          <PinkLeafSvg style={styles.pinkLeaf} />
        </View>
        <View style={styles.body}>
          <Text style={styles.bodyText}>
            V-fitness Center & Gym in Koheda has a wide range of products and / or services to cater to the varied requirements of their customers. The staff at this establishment are courteous and prompt at providing any assistance. {'\n\n'}They readily answer any queries or questions that you may have. This establishment is functional from 05:30 - 21:00.
          </Text>
        </View>
        <View style={styles.imageContainer}>
          <WorkoutSvg />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default About

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    // justifyContent: 'flex-end',
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
    position: 'relative',
    zIndex: -1,
    top: -68,
    right: -40
  },
  body: {
    flex: 1,
  },
  bodyText: {
    fontSize: s(16),
    fontFamily: "Montserrat",
    lineHeight: s(24),
    color: AppColors.primary,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 8,
  }
})
