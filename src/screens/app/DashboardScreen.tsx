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
  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner';
  const isTrainer = String(user?.role ?? '').trim().toLowerCase() === 'trainer';
  const isMember = String(user?.role ?? '').trim().toLowerCase() === 'member';

  const heroHeading = isOwner
    ? 'Run your gym from one place'
    : isTrainer
      ? 'Manage your sessions and clients'
      : isMember
        ? 'Your gym access, bookings, and membership in one place'
        : 'Welcome back to Classy Fit';

  const heroDescription = isOwner
    ? 'Jump into classes, personal training, members, and operations in a few taps.'
    : isTrainer
      ? 'See what’s coming up, manage your sessions, and stay on top of your day.'
      : isMember
        ? 'Book classes, check your membership, and keep your gym routine moving.'
        : 'Use the dashboard to get to the parts of Classy Fit you need most.';

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <View style={styles.greetingContainer}>
            <Text style={styles.welcomeText}>Welcome back, {user?.given_name}!</Text>
            <Text style={styles.gymNameText}>{user?.gym_name} ({user?.role ?? ''})</Text>
          </View>
          <SignOut />
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Overview</Text>
            {/* <Text style={styles.subtitle}>Manage your gym operations</Text> */}
          </View>
          <View style={styles.body}>
            <View style={styles.heroCard}>
              <View style={styles.heroCardTop}>
                <View style={styles.heroIconWrap}>
                  <Ionicons name="sparkles" size={22} color={AppColors.blue} />
                </View>
                <View style={styles.heroTextBlock}>
                  <Text style={styles.heroEyebrow}>Today&apos;s hub</Text>
                  <Text style={styles.heroTitleText}>{heroHeading}</Text>
                  <Text style={styles.heroDescription}>{heroDescription}</Text>
                </View>
              </View>

              <View style={styles.heroChips}>
                <View style={styles.heroChip}>
                  <Feather name="calendar" size={14} color={AppColors.blue} />
                  <Text style={styles.heroChipText}>Classes</Text>
                </View>
                <View style={styles.heroChip}>
                  <Feather name="users" size={14} color={AppColors.blue} />
                  <Text style={styles.heroChipText}>Members</Text>
                </View>
                <View style={styles.heroChip}>
                  <Feather name="activity" size={14} color={AppColors.blue} />
                  <Text style={styles.heroChipText}>Training</Text>
                </View>
              </View>
            </View>

            <View style={{ alignItems: 'center', }}>
              <TouchableOpacity style={styles.primaryCard} onPress={() => navigation.navigate('GymScreen')}>
                <View style={styles.primaryCardLeft}>
                  {/* <MaterialCommunityIcons name="weight-lifter" size={32} color={AppColors.white} /> */}
                  <MaterialCommunityIcons name="dumbbell" size={32} color={AppColors.white} />
                  <View style={styles.primaryCardTextContainer}>
                    <Text style={styles.primaryCardTitle}>Gym</Text>
                    <Text style={styles.primaryCardSubtitle}>Classes, personal training, memberships</Text>
                  </View>
                </View>
                <Feather style={styles.arrow} name="arrow-right" size={24} color={AppColors.white} />
              </TouchableOpacity>
              {isOwner ? (
                <TouchableOpacity style={[styles.primaryCard, styles.secondaryCard]} onPress={() => { navigation.navigate('AllEarnings') }}>
                  <View style={styles.primaryCardLeft}>
                    <MaterialCommunityIcons name="chart-line" size={32} color={AppColors.white} />
                    <View style={styles.primaryCardTextContainer}>
                      <Text style={styles.primaryCardTitle}>Earnings</Text>
                      <Text style={styles.primaryCardSubtitle}>View your revenue</Text>
                    </View>
                  </View>
                  <Feather style={styles.arrow} name="arrow-right" size={24} color={AppColors.white} />
                </TouchableOpacity>
              ) : null}

            </View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick actions</Text>
            </View>
            <View style={styles.greySquares}>
              <TouchableOpacity style={styles.greySquare} onPress={() => navigation.navigate('StaffScreen')}>
                <View style={styles.whiteSquare}>
                  <FontAwesome5 name="user-friends" size={28} color={AppColors.blue} />
                </View>
                <Text style={styles.squareLabel}>Staff</Text>
                <Text style={styles.squareSubtitle}>Team access</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.greySquare} onPress={() => navigation.navigate('MembersScreen')}>
                <View style={styles.whiteSquare}>
                  <FontAwesome5 name="users" size={28} color={AppColors.blue} />
                </View>
                <Text style={styles.squareLabel}>Members</Text>
                <Text style={styles.squareSubtitle}>Client list</Text>
              </TouchableOpacity>
              {isOwner ? (
                <TouchableOpacity style={styles.greySquare} onPress={() => navigation.navigate('ContractorsScreen')}>
                  <View style={styles.whiteSquare}>
                    <FontAwesome5 name="user-tie" size={28} color={AppColors.blue} />
                  </View>
                  <Text style={styles.squareLabel}>Contractors</Text>
                  <Text style={styles.squareSubtitle}>Manage partners</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.greySquare} onPress={() => navigation.navigate('ProductsScreen')}>
                <View style={styles.whiteSquare}>
                  <MaterialCommunityIcons name="shopping" size={28} color={AppColors.blue} />
                </View>
                <Text style={styles.squareLabel}>Products</Text>
                <Text style={styles.squareSubtitle}>Sell items</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.greySquare} onPress={() => navigation.navigate('ContractorsScreen')}>
                <View style={styles.whiteSquare}>
                  <FontAwesome5 name="user-tie" size={28} color={AppColors.blue} />
                </View>
                <Text style={styles.squareLabel}>Gym Videos</Text>
                <Text style={styles.squareSubtitle}>Content library</Text>
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
  heroCard: {
    backgroundColor: AppColors.grey,
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    shadowColor: AppColors.grey3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  heroCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  heroTextBlock: {
    flex: 1,
  },
  heroEyebrow: {
    color: AppColors.blue,
    fontSize: 12,
    fontFamily: 'Montserrat',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  heroTitleText: {
    color: AppColors.primary,
    fontSize: 22,
    fontFamily: 'Montserrat',
    marginTop: 4,
  },
  heroDescription: {
    color: AppColors.grey3,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  heroChip: {
    backgroundColor: AppColors.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroChipText: {
    color: AppColors.blue,
    fontSize: 13,
    fontFamily: 'Montserrat',
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
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    rowGap: 12,
    columnGap: 12,
    // width: '100%',
    width: 'auto',
    // paddingBottom: 96,
  },
  greySquare: {
    backgroundColor: AppColors.grey,
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    // flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
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
    textAlign: 'center'
  },
  squareSubtitle: {
    color: AppColors.grey3,
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Montserrat',
    textAlign: 'center',
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
