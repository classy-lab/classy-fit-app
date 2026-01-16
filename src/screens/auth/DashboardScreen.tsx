import { StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import { s } from 'react-native-size-matters'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import Ionicons from '@expo/vector-icons/Ionicons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import GymHours from './GymHours'
import StartScreen from './StartScreen'
import About from './About'
import AntDesign from '@expo/vector-icons/AntDesign';

const windowWidth = Dimensions.get('window').width
const Tab = createBottomTabNavigator();

const screenOptionsStyle = {
  tabBarActiveTintColor: AppColors.blue,
  tabBarInactiveTintColor: AppColors.primary,
  tabBarLabelPosition: 'below-icon',
  tabBarStyle: {
    backgroundColor: AppColors.white,
    elevation: 0,     // for Android
    shadowOpacity: 0, // for iOS
    borderTopWidth: 0,// for iOS
  },
  tabBarLabelStyle: {
    fontSize: 14,
  }
}

const DashboardScreen = () => {
  const navigation = useNavigation()
  const [fontsLoaded] = useFonts({
    "Montserrat": require("../../assets/fonts/montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("../../assets/fonts/montserrat/Montserrat-Bold.ttf")
  })

  return (
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
      <View style={styles.headingContainer}>
        <Text style={styles.title}>Dashboard</Text>
      </View>
      <View style={styles.body}>
        <View style={{ alignItems: 'center', }}>
          <TouchableOpacity style={styles.buleRectangle} activeOpacity={0.7}>
            <Text style={styles.earningsText}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buleRectangle} activeOpacity={0.7}>
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
            <Text>Staff</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Tab.Navigator style={{ flexGrow: 1 }} screenOptions={screenOptionsStyle} >
        <Tab.Screen
          options={{
            title: "Dashboard",
            tabBarIcon: () => <AntDesign name="dashboard" size={24} color='black' />
          }}
          name="Dashboard"
          component={StartScreen}
        />
        <Tab.Screen
          options={{
            title: "GymHours",
            tabBarIcon: () => <FontAwesome5 name="dumbbell" size={24} color="black" />
          }}
          name="GymHours"
          component={GymHours}
        />
        <Tab.Screen
          options={{
            title: "Staff",
            tabBarIcon: () => <FontAwesome6 name="bolt-lightning" size={24} color="black" />
          }}
          name="Staff"
          component={About}
        />
        <Tab.Screen
          options={{
            title: "Products",
            tabBarIcon: () => <MaterialIcons name="settings" size={24} color='black' />
          }}
          name="Products"
          component={About}
        />
        <Tab.Screen
          options={{
            title: "Profile",
            tabBarIcon: () => <MaterialIcons name="settings" size={24} color='black' />
          }}
          name="Profile"
          component={About}
        />
      </Tab.Navigator>
    </SafeAreaView>
  )
}

export default DashboardScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
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
    marginBottom: 16,
    // flexGrow: 1
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
})
