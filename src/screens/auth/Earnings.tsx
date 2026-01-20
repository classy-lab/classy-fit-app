import { StyleSheet, Text, View, ImageBackground } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import { s } from 'react-native-size-matters'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import ClassyGymTabNavigator from '../ClassyGymTabNavigator'

const Earnings = () => {
  const navigation = useNavigation()
  const [fontsLoaded] = useFonts({
    "Montserrat": require("../../assets/fonts/montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("../../assets/fonts/montserrat/Montserrat-Bold.ttf")
  })

  return (
    <ImageBackground
      source={require('../../assets/images/blueGreyBg.png')}
      style={styles.container}
    >
      <SafeAreaView class={styles.content}>
        <View style={styles.navs}>
          <Feather name="arrow-left" color={AppColors.white} size={36} onPress={() => { navigation.goBack() }} />
          <View style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
            <View style={styles.circle}>
              <MaterialIcons name="logout" color={AppColors.blue} size={18} onPress={() => { navigation.navigate('SignoutScreen') }} />
            </View>
          </View>
        </View>
        <View style={styles.heading}>
          <Text style={styles.headingTitle}>Earnings</Text>
          <Text style={styles.headingSubTitle}>September 2025</Text>
          <View style={styles.calendarControls}>
            <Text style={styles.calendarControlText}>{'<'} Previous</Text>
            <Text style={styles.calendarControlText}>Full Year</Text>
            <Text style={styles.calendarControlText}>Next {'>'}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.bodyText}>
            V-fitness Center & Gym in Koheda has a wide range of products and / or services to cater to the varied requirements of their customers. The staff at this establishment are courteous and prompt at providing any assistance. They readily answer any queries or questions that you may have. This establishment is functional from 05:30 - 21:00.
          </Text>
        </View>

      </SafeAreaView>
      {/* <ClassyGymTabNavigator /> */}
    </ImageBackground>
  )
}

export default Earnings

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 24,
    paddingRight: 24,
  },
  content: {
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  heading: {
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
    // borderWidth: 1, borderColor: 'red',
  },
  headingTitle: {
    color: AppColors.white,
    fontSize: 32,
    marginTop: 16,
  },
  headingSubTitle: {
    marginTop: 6,
    fontSize: 16,
    color: AppColors.white,
  },
  calendarControls: {
    marginTop: 16,
    flexDirection: 'row',
    // flex: 1,
    flexGrow: 1,
    justifyContent: 'space-between',
    // borderWidth: 1, borderColor: 'red',
    width: '100%'
  },
  calendarControlText: {
    color: AppColors.primary,
    fontSize: 16,
    // flex: 1
  },
  body: {
    // borderWidth: 1, bordeerColor: 'red',
    flex: 1,
  },
  bodyText: {
    fontSize: 16,
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
    color: AppColors.white,
    fontSize: 14
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3
  },
})
