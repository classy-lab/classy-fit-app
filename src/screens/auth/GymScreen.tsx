import { StyleSheet, Text, View, Dimensions, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import { s } from 'react-native-size-matters'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Feather from '@expo/vector-icons/Feather'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import BuildingSvg from '../../components/svg/BuildingSvg'
import ClassesSvg from '../../components/svg/ClassesSvg'
import PersonalTrainingSvg from '../../components/svg/PersonalTrainingSvg'
import TabNavigator from '../TabNavigator'
import Elliptical from '../../assets/svg/Elliptical'
import Dumbbell from '../../assets/svg/Dumbbell'
import MemberNotification from '../../assets/svg/MemberNotification'
import Treadmill from '../../assets/svg/Treadmill'

const windowWidth = Dimensions.get('window').width

const GymScreen = () => {
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
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Gym</Text>
            <PinkLeafSvg style={styles.pinkLeaf} />
          </View>
          <View style={styles.body}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gym</Text>
              <ScrollView
                style={styles.greySquares}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
              >
                <View style={styles.greySquareContainer}>
                  <TouchableOpacity style={styles.greySquare}>
                    <View style={styles.whiteSquare}>
                      <BuildingSvg />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.cardText}>Building</Text>
                </View>
                <View style={styles.greySquareContainer}>
                  <TouchableOpacity style={styles.greySquare}>
                    <View style={styles.whiteSquare}>
                      <ClassesSvg />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.cardText}>Classes</Text>
                </View>
                <View style={styles.greySquareContainer}>
                  <TouchableOpacity style={styles.greySquare}>
                    <View style={styles.whiteSquare}>
                      <PersonalTrainingSvg />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.cardText}>Personal {'\n'}Training</Text>
                </View>
              </ScrollView>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Equipment</Text>
              <ScrollView
                style={styles.greySquares}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
              >
                <View style={styles.greySquareContainer}>
                  <TouchableOpacity style={styles.greySquare}>
                    <View style={styles.whiteSquare}>
                      <Elliptical />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.cardText}>Elliptical</Text>
                </View>
                <View style={styles.greySquareContainer}>
                  <TouchableOpacity style={styles.greySquare}>
                    <View style={styles.whiteSquare}>
                      <Treadmill />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.cardText}>Treadmill</Text>
                </View>
                <View style={styles.greySquareContainer}>
                  <TouchableOpacity style={styles.greySquare}>
                    <View style={styles.whiteSquare}>
                      <Dumbbell />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.cardText}>Dumbbells</Text>
                </View>
                <View style={styles.greySquareContainer}>
                  <TouchableOpacity style={styles.greySquare}>
                    <View style={styles.whiteSquare}>
                      <Dumbbell />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.cardText}>Smith {'\n'} Machine</Text>
                </View>
              </ScrollView>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Messaging</Text>
              <ScrollView
                style={styles.greySquares}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
              >
                <View style={styles.greySquareContainer}>
                  <TouchableOpacity style={styles.greySquare}>
                    <View style={styles.whiteSquare}>
                      <MemberNotification />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.cardText}>Member{'\n'}Notifications</Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </ScrollView>
        <TabNavigator />
      </SafeAreaView>
    </>
  )
}

export default GymScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    // flex: 1,
    // alignItems: 'center',
    // width: "100%",
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
    // flex: 1,
    // borderWidth: 1, borderColor: 'red',
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 88
  },
  section: {
    flexDirection: 'column',
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 24,
    marginBottom: 16,
    width: '100%'
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
    // flexDirection: 'row',
    // flexWrap: 'wrap',
    // justifyContent: 'flex-start',
    columnGap: 8,
    rowGap: 16
  },
  greySquareContainer: {
    alignItems: 'center',
    // borderWidth: 1, borderRadius: 'red',
  },
  greySquare: {
    backgroundColor: AppColors.grey,
    width: s(96),
    height: s(96),
    borderRadius: s(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
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
  pinkLeaf: {
    position: 'relative',
    zIndex: -1,
    top: -68,
    right: -40
  },
  cardText: {
    textAlign: 'center',
    // borderWidth: 1, borderColor: 'red',
    marginTop: 8
  }
})
