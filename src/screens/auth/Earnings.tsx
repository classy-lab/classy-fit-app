import { StyleSheet, Text, View, Dimensions, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import Feather from '@expo/vector-icons/Feather'
import { s } from 'react-native-size-matters'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import ClassyGymTabNavigator from '../ClassyGymTabNavigator'
import EarningsBarGraph from '../../assets/svg/EarningsBarGraph'
import Entypo from '@expo/vector-icons/Entypo';

const windowWidth = Dimensions.get('window').width

const Earnings = () => {
  const navigation = useNavigation()
  const [fontsLoaded] = useFonts({
    "Montserrat": require("../../assets/fonts/montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("../../assets/fonts/montserrat/Montserrat-Bold.ttf")
  })

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
          <View style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
            <View style={styles.circle}>
              <MaterialIcons name="logout" color={AppColors.white} size={18} onPress={() => { navigation.navigate('SignoutScreen') }} />
            </View>
          </View>
        </View>
        <ScrollView>

          <View style={styles.body}>
            <View style={styles.heading}>
              <Text style={styles.headingTitle}>Earnings</Text>
              <Text style={styles.headingSubTitle}>September 2025</Text>
              <View style={styles.calendarControls}>
                <Text style={styles.calendarControlText}>{'<'} Previous</Text>
                <Text style={styles.calendarControlText}>Full Year</Text>
                <Text style={styles.calendarControlText}>Next {'>'}</Text>
              </View>
            </View>

            <View style={styles.content}>
              <View style={styles.squareCard}>
                <View style={styles.squareCardHeadingContainer}>
                  <View style={styles.squareCardHeading}>
                    <Text style={styles.SquareCardHeadingTitle}>October</Text>
                    <Text style={styles.SquareCardHeadingSubTitle}>7 Day Business Earnings Graph</Text>
                  </View>
                  <View style={styles.SquareCardSettingsIcon}>
                    <Entypo name="sound-mix" size={24} color={AppColors.grey3} />
                  </View>
                </View>
                <View style={styles.barGraph}>
                  <EarningsBarGraph />
                </View>
              </View>
              <View style={styles.cards}>
                <View style={styles.square}>
                  <Text>Square</Text>
                </View>
                <View style={styles.square}>
                  <Text>Square</Text>
                </View>
                <View style={styles.square}>
                  <Text>Square</Text>
                </View>
                <View style={styles.square}>
                  <Text>Square</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
        <ClassyGymTabNavigator style={styles.tabNavigator} />
      </SafeAreaView>
    </>
  )
}

export default Earnings

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.grey,
    flex: 1,
    // borderWidth: 1, borderColor: 'red'
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 24,
    width: '100%',
  },
  headingContainer: {
    width: 375,
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 32,
    marginTop: 20,
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: s(14),
    fontFamily: "Montserrat",
    lineHeight: 24,
    color: AppColors.primary,
  },
  imageContainer: {
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
  },
  buleRectangle: {
    backgroundColor: AppColors.blue,
    borderRadius: 24,
    width: windowWidth - 64,
    height: 128,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 20,
    // borderWidth: 1, borderRadius: 'red',
  },
  earningsText: {
    color: AppColors.white,
    fontSize: 24
  },
  greySquares: {
    // borderWidth: 1, borderRadius: 'red',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-aroud',
    rowGap: 16,
    columnGap: 16,
    width: '100%'
  },
  greySquare: {
    backgroundColor: AppColors.grey,
    width: s(144),
    height: s(144),
    borderRadius: s(24),
    justifyContent: 'center',
    alignItems: 'center'
  },
  whiteSquare: {
    backgroundColor: AppColors.white,
    borderRadius: s(16),
    width: s(60),
    height: s(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: s(8)
  },
  heading: {
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
    // borderWidth: 1, borderColor: 'red',
  },
  headingTitle: {
    color: AppColors.blue,
    fontSize: 32,
    marginTop: 16,
  },
  headingSubTitle: {
    marginTop: 6,
    fontSize: 16,
    color: AppColors.blue,
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
    fontWeight: 'bold'
  },
  squareCard: {
    width: '100%',
    backgroundColor: AppColors.white,
    borderRadius: 24,
    height: 320,
    marginTop: 24,
    paddingTop: 32,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 12,
    marginBottom: 20
  },
  squareCardHeadingContainer: {
    flexDirection: 'row',
    // borderWidth: 1, borderColor: 'red',
    justifyContent: 'space-between',
    alignItems: 'baseline'
  },
  squareCardHeading: {},
  SquareCardHeadingText: {},
  SquareCardHeadingTitle: {
    color: AppColors.primary,
    fontSize: 24,
    fontFamily: 'Montserrat-Bold'
  },
  SquareCardHeadingSubTitle: {
    color: AppColors.grey2,
    fontSize: 12
  },
  settings: {
    color: AppColors.primary
  },
  barGraph: {
    width: '100%',
    height: 200,
    flex: 1,
    marginTop: 20,
    borderRadius: 16,
    alignItems: 'center'
  },
  cards: {
    flex: 1,
    marginBottom: 20,
    // borderWidth: 1, bordeerColor: 'red',
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    columnGap: 12,
    justifyContent: 'center',
    // alignItems: 'center',
    // height: '100%',
    // width: '100%'
  },
  square: {
    width: 160,
    borderRadius: 24,
    backgroundColor: AppColors.white,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
