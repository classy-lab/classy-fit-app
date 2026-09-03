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
            <Text style={styles.welcomeText}>Welcome back, {user?.given_name}! 👋</Text>
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
                  <MaterialCommunityIcons name="dumbbell" size={32} color={AppColors.white} />
                  <View style={styles.primaryCardTextContainer}>
                    <Text style={styles.primaryCardTitle}>Gym</Text>
                    <Text style={styles.primaryCardSubtitle}>Manage equipment</Text>
                  </View>
                </View>
                <Feather name="arrow-right" size={24} color={AppColors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryCard, styles.secondaryCard]} onPress={() => { navigation.navigate('EarningsScreen') }}>
                <View style={styles.primaryCardLeft}>
                  <MaterialCommunityIcons name="cash-multiple" size={32} color={AppColors.white} />
                  <View style={styles.primaryCardTextContainer}>
                    <Text style={styles.primaryCardTitle}>Earnings</Text>
                    <Text style={styles.primaryCardSubtitle}>View your revenue</Text>
                  </View>
                </View>
                <Feather name="arrow-right" size={24} color={AppColors.white} />
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
                <Text style={styles.squareSubtitle}>Manage team</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.greySquare} onPress={() => navigation.navigate('MembersScreen')}>
                <View style={styles.whiteSquare}>
                  <FontAwesome5 name="users" size={28} color={AppColors.blue} />
                </View>
                <Text style={styles.squareLabel}>Members</Text>
                <Text style={styles.squareSubtitle}>View members</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.greySquare} onPress={() => navigation.navigate('ContractorsScreen')}>
                <View style={styles.whiteSquare}>
                  <FontAwesome5 name="user-tie" size={28} color={AppColors.blue} />
                </View>
                <Text style={styles.squareLabel}>Contractors</Text>
                <Text style={styles.squareSubtitle}>Manage partners</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.greySquare} onPress={() => navigation.navigate('ProductsScreen')
              }>
                <View style={styles.whiteSquare}>
                  <MaterialCommunityIcons name="package-variant" size={28} color={AppColors.blue} />
                </View>
                <Text style={styles.squareLabel}>Products</Text>
                <Text style={styles.squareSubtitle}>Inventory</Text>
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
    backgroundColor: '#f8f9fa',
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
    fontWeight: '600',
  },
  gymNameText: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 4,
  },
  headingContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
    marginTop: 8,
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

  primaryCard: {
    backgroundColor: AppColors.blue,
    borderRadius: 24,
    width: windowWidth - 64,
    height: 128,
    justifyContent: 'center',
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
  statementsButton: {
    position: 'relative',
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
    fontSize: 20,
    fontWeight: '600',
  },
  primaryCardSubtitle: {
    color: AppColors.white,
    // fontSize: 12,
    // marginTop: 2,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    color: AppColors.blue,
    fontSize: 16,
    fontWeight: '600',
  },
  greySquares: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 16,
    columnGap: 12,
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
