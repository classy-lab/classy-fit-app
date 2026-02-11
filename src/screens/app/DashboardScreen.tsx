import { StyleSheet, Text, View, Dimensions, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import { s } from 'react-native-size-matters'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import Ionicons from '@expo/vector-icons/Ionicons'
import { createStackNavigator } from '@react-navigation/stack'

const windowWidth = Dimensions.get('window').width

const DashboardScreen = () => {
  const navigation = useNavigation()
  const [fontsLoaded] = useFonts({
    "Montserrat": require("../../assets/fonts/montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("../../assets/fonts/montserrat/Montserrat-Bold.ttf")
  })

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <View style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
            <View style={styles.circle}>
              <MaterialIcons name="logout" color={AppColors.white} size={18} onPress={() => { navigation.navigate('SignoutScreen') }} />
            </View>
          </View>
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Dashboard</Text>
          </View>
          <View style={styles.body}>
            <View style={{ alignItems: 'center', }}>
              <TouchableOpacity style={styles.blueRectangle} activeOpacity={0.7} onPress={() => { navigation.navigate('Earnings') }}>
                <Text style={styles.earningsText}>Earnings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.blueRectangle} activeOpacity={0.7}>
                <Text style={styles.earningsText}>Gym</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.greySquares}>
              <TouchableOpacity style={styles.greySquare}>
                <View style={styles.whiteSquare}>
                  <FontAwesome5 name="user-friends" size={24} color={AppColors.blue} />
                </View>
                <Text>Staff</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.greySquare}>
                <View style={styles.whiteSquare}>
                  <FontAwesome5 name="users" size={24} color={AppColors.blue} />
                </View>
                <Text>Members</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.greySquare}>
                <View style={styles.whiteSquare}>
                  <Ionicons name="bag-handle" size={24} color={AppColors.blue} />
                </View>
                <Text>Products</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.greySquare}>
                <View style={styles.whiteSquare}>
                  <FontAwesome5 name="user-alt" size={24} color={AppColors.blue} />
                </View>
                <Text>Contractors</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

    </>
  )
}

export default DashboardScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingLeft: 24,
    paddingRight: 24,
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 32,
    marginTop: 20,
  },
  scrollView: {
    height: '100%',
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 8,
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
  },
  blueRectangle: {
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
    width: '100%',
    paddingBottom: 96
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
})
