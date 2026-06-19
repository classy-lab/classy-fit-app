import { StyleSheet, Text, View, Dimensions, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppColors } from '../../styles/colors'
import { s } from 'react-native-size-matters'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Feather from '@expo/vector-icons/Feather'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import GymScreenScrollViewOne from './GymScreenScrollViewOne'
import GymScreenScrollViewTwo from './GymScreenScrollViewTwo'
import GymScreenScrollViewThree from './GymScreenScrollViewThree'


const windowWidth = Dimensions.get('window').width

const GymScreen = ({ navigation, route }) => {

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
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Gym</Text>
            <PinkLeafSvg style={styles.pinkLeaf} />
          </View>
          <View style={styles.body}>
            <View style={styles.section}>
              <GymScreenScrollViewOne />
            </View>
            <View style={styles.section}>
              <GymScreenScrollViewTwo />
            </View>
            <View style={styles.section}>
              <GymScreenScrollViewThree />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

export default GymScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
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
    paddingBottom: 88
  },
  section: {
    flexDirection: 'column',
    marginBottom: 32
  },
  bodyText: {
    fontSize: 14,
    fontFamily: "Montserrat",
    lineHeight: 24,
    color: AppColors.primary,
  },
  imageContainer: {
    marginBottom: 8
  },
  signOut: {
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
  pinkLeaf: {
    position: 'absolute',
    // zIndex: -1,
    // top: 0,
    right: 88
  }
})
