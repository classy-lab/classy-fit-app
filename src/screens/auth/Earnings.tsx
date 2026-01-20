import { StyleSheet, Text, View, ImageBackground } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import { s } from 'react-native-size-matters'

const Earnings = () => {
  const navigation = useNavigation()
  const [fontsLoaded] = useFonts({
    "Montserrat": require("../../assets/fonts/montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("../../assets/fonts/montserrat/Montserrat-Bold.ttf")
  })

  return (
    <ImageBackground
      source={require('../../assets/images/blueGreyBg.png')}
      style={styles.bgImage}
    >
      <View style={styles.navs}>
        <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
      </View>
      <View style={styles.headingContainer}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.bodyText}>
          September 2025
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.bodyText}>
          V-fitness Center & Gym in Koheda has a wide range of products and / or services to cater to the varied requirements of their customers. The staff at this establishment are courteous and prompt at providing any assistance. They readily answer any queries or questions that you may have. This establishment is functional from 05:30 - 21:00.
        </Text>
      </View>
    </ImageBackground>
  )
}

export default Earnings

const styles = StyleSheet.create({
  container: {
    // backgroundColor: AppColors.white,
    // flex: 1,
    // // justifyContent: 'flex-end',
    // alignItems: 'center',
    // width: "100%",
    // paddingLeft: 24,
    // paddingRight: 24,
  },
  bgImage: {
    flex: 1,
    // justifyContent: 'center',
    // height: '100%'
  },
  navs: {
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    // width: '100%',
  },
  headingContainer: {
    width: 375,
    alignItems: 'center'
  },
  title: {
    color: AppColors.white,
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
    fontSize: s(16),
    fontFamily: "Montserrat",
    lineHeight: s(24),
    color: AppColors.primary,
  },
  imageContainer: {
    marginBottom: 8
    // borderWidth: 1, bordeerColor: 'red',
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
})
