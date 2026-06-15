import { useContext } from "react";
import { UserContext } from '../../context/UserContext'
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppColors } from '../../styles/colors'
import { s } from 'react-native-size-matters'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import Ionicons from '@expo/vector-icons/Ionicons'
import SignOut from "../../components/utils/SignOut";
import Feather from "@expo/vector-icons/Feather";

const windowWidth = Dimensions.get('window').width

const DashboardScreen = ({ navigation, route }) => {
  const { user, setUser } = useContext(UserContext);

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Text style={styles.welcomeText}>Hi {user?.given_name}</Text>
          <SignOut />
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Dashboard</Text>
          </View>
          <View style={styles.body}>
            <View style={{ alignItems: 'center', }}>
              <TouchableOpacity style={styles.blueRectangle} onPress={() => { navigation.navigate('EarningsScreen') }}>
                <Text style={styles.earningsText}>Statements</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.blueRectangle} onPress={() => navigation.navigate('GymTab', { screen: 'GymScreen' })}>
                <Text style={styles.earningsText}>Gym</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.greySquares}>
              <TouchableOpacity style={styles.greySquare} onPress={() => navigation.navigate('StaffScreen')}>
                <View style={styles.whiteSquare}>
                  <FontAwesome5 name="user-friends" size={24} color={AppColors.blue} />
                </View>
                <Text>Staff</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.greySquare} onPress={() => navigation.navigate('MembersScreen')}>
                <View style={styles.whiteSquare}>
                  <FontAwesome5 name="users" size={24} color={AppColors.blue} />
                </View>
                <Text>Members</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.greySquare} onPress={() => navigation.navigate('ProductsTab', { screen: 'ProductsScreen' })
              }>
                <View style={styles.whiteSquare}>
                  <Ionicons name="bag-handle" size={24} color={AppColors.blue} />
                </View>
                <Text>Products</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.greySquare} onPress={() => navigation.navigate('ContractorsScreen')}>
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
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 24,
    alignItems: 'center'
  },
  welcomeText: { color: AppColors.blue, fontSize: 14 },
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
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutText: {
    marginRight: 4,
    color: AppColors.blue,
    fontSize: 14
  },

})
