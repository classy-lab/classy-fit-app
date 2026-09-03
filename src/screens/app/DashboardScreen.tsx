// @ts-nocheck
import { useContext } from "react";
import { UserContext } from '../../context/UserContext'
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppColors } from '../../styles/colors'
import { s } from 'react-native-size-matters'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import SignOut from "../../components/utils/SignOut";
import Feather from "@expo/vector-icons/Feather";

const windowWidth = Dimensions.get('window').width

const DashboardScreen = ({ navigation, route }) => {
  const { user, setUser } = useContext(UserContext);

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <View style={styles.greetingContainer}>
            <Text style={styles.welcomeText}>Welcome back, {user?.given_name}!</Text>
            <Text style={styles.gymNameText}>{user?.gym_name}</Text>
          </View>
          <SignOut />
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Manage your gym operations</Text>
          </View>
          <View style={styles.body}>
            <View style={{ alignItems: 'center', }}>
              <TouchableOpacity style={styles.primaryCard} onPress={() => navigation.navigate('GymScreen')}>
                <View style={styles.primaryCardLeft}>
                  <MaterialCommunityIcons name="weight-lifter" size={32} color={AppColors.white} />
                  <View style={styles.primaryCardTextContainer}>
                    <Text style={styles.primaryCardTitle}>Gym</Text>
                    <Text style={styles.primaryCardSubtitle}>Manage equipment</Text>
                  </View>
                </View>
                <Feather style={styles.arrow} name="arrow-right" size={24} color={AppColors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryCard, styles.secondaryCard]} onPress={() => { navigation.navigate('EarningsScreen') }}>
                <View style={styles.primaryCardLeft}>
                  <MaterialCommunityIcons name="chart-line" size={32} color={AppColors.white} />
                  <View style={styles.primaryCardTextContainer}>
                    <Text style={styles.primaryCardTitle}>Earnings</Text>
                    <Text style={styles.primaryCardSubtitle}>View your revenue</Text>
                  </View>
                </View>
                <Feather style={styles.arrow} name="arrow-right" size={24} color={AppColors.white} />
              </TouchableOpacity>

            </View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Management</Text>
            </View>
            <View style={styles.greySquares}>
              <TouchableOpacity style={styles.greySquare} onPress={() => navigation.navigate('StaffScreen')}>
                <View style={styles.whiteSquare}>
                  <FontAwesome5 name="user-friends" size={28} color={AppColors.blue} />
                </View>
                <Text style={styles.squareLabel}>Staff</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.greySquare} onPress={() => navigation.navigate('MembersScreen')}>
                <View style={styles.whiteSquare}>
                  <FontAwesome5 name="users" size={28} color={AppColors.blue} />
                </View>
                <Text style={styles.squareLabel}>Members</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.greySquare} onPress={() => navigation.navigate('ContractorsScreen')}>
                <View style={styles.whiteSquare}>
                  <FontAwesome5 name="user-tie" size={28} color={AppColors.blue} />
                </View>
                <Text style={styles.squareLabel}>Contractors</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.greySquare} onPress={() => navigation.navigate('ProductsScreen')
              }>
                <View style={styles.whiteSquare}>
                  <MaterialCommunityIcons name="package-variant" size={28} color={AppColors.blue} />
                </View>
                <Text style={styles.squareLabel}>Products</Text>
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
    flex: 1,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 24,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  greetingContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  welcomeText: {
    color: AppColors.blue,
    fontSize: 16,
    fontFamily: 'Montserrat',
  },
  gymNameText: {
    color: AppColors.primary,
    fontSize: 13,
    marginTop: 4,
    fontFamily: 'Montserrat',
  },
  headingContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
    marginTop: 8,
    alignItems: 'center',
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 32,
    marginTop: 20,
  },
  subtitle: {
    color: AppColors.grey3,
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Montserrat',
  },
  scrollView: {
    height: '100%',
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 8,
  },

  primaryCard: {
    backgroundColor: AppColors.blue,
    borderRadius: 24,
    width: windowWidth - 48,
    minHeight: 120,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: AppColors.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  secondaryCard: {
    backgroundColor: AppColors.blue,
  },
  primaryCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  primaryCardTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  primaryCardTitle: {
    color: AppColors.white,
    fontSize: 24,
    fontFamily: 'Montserrat',
  },
  arrow: {
    position: 'absolute',
    right: 26,
    bottom: 16,
  },
  primaryCardSubtitle: {
    color: AppColors.white,
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Montserrat',
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    color: AppColors.blue,
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  greySquares: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: 16,
    columnGap: 12,
    width: '100%',
    paddingBottom: 96
  },
  greySquare: {
    backgroundColor: AppColors.grey,
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    // flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteSquare: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  squareLabel: {
    color: AppColors.blue,
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  squareSubtitle: {
    color: AppColors.grey3,
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Montserrat',
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutText: {
    marginRight: 4,
    color: AppColors.blue,
    fontSize: 14,
    fontFamily: 'Montserrat',
  },

})
