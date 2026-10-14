import { useContext } from 'react'
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppColors } from '../../styles/colors'
import { s } from 'react-native-size-matters'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Feather from '@expo/vector-icons/Feather'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import GymScreenScrollViewOne from './GymScreenScrollViewOne'
import GymScreenScrollViewTwo from './GymScreenScrollViewTwo'
import GymScreenScrollViewThree from './GymScreenScrollViewThree'
import GymScreenScrollViewFour from './GymScreenScrollViewFour'
import GymScreenScrollViewFive from './GymScreenScrollViewFive'
import SignOut from '../../components/utils/SignOut'
import { UserContext } from '../../context/UserContext'


const windowWidth = Dimensions.get('window').width

const GymScreen = ({ navigation, route }) => {
  const { user } = useContext(UserContext)
  const role = String(user?.role ?? '').trim().toLowerCase()
  const isOwner = role === 'owner'
  const isTrainer = role === 'trainer'
  const isMember = role === 'member'

  const heroTitle = isOwner
    ? 'Gym command center'
    : isTrainer
      ? 'Your training workspace'
      : isMember
        ? 'Your gym home base'
        : 'Everything gym-related in one place'

  const heroDescription = isOwner
    ? 'Manage classes, personal training, memberships, and equipment from one place.'
    : isTrainer
      ? 'Stay on top of sessions, bookings, and the clients you work with.'
      : isMember
        ? 'Quickly check classes, bookings, and your membership details.'
        : 'Use the sections below to get where you need to go fast.'

  const heroIcon = isOwner
    ? <MaterialIcons name="dashboard" size={22} color={AppColors.blue} />
    : isTrainer
      ? <MaterialIcons name="fitness-center" size={22} color={AppColors.blue} />
      : isMember
        ? <Feather name="user" size={22} color={AppColors.blue} />
        : <Ionicons name="sparkles" size={22} color={AppColors.blue} />

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Feather
            name="arrow-left"
            color={AppColors.blue}
            size={36}
            onPress={() => navigation.navigate('HomeTab', { screen: 'DashboardScreen' })}
          />
          <SignOut />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Gym</Text>
            <PinkLeafSvg style={styles.pinkLeaf} />
          </View>
          <View style={styles.body}>
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroIconWrap}>
                  {heroIcon}
                </View>
                <View style={styles.heroTextBlock}>
                  <Text style={styles.heroEyebrow}>Today&apos;s hub</Text>
                  <Text style={styles.heroTitleText}>{heroTitle}</Text>
                  <Text style={styles.heroDescription}>{heroDescription}</Text>
                </View>
              </View>

              <View style={styles.heroChips}>
                <View style={styles.heroChip}>
                  <Feather name="calendar" size={14} color={AppColors.blue} />
                  <Text style={styles.heroChipText}>Classes</Text>
                </View>
                <View style={styles.heroChip}>
                  <Feather name="activity" size={14} color={AppColors.blue} />
                  <Text style={styles.heroChipText}>Training</Text>
                </View>
                <View style={styles.heroChip}>
                  <Feather name="credit-card" size={14} color={AppColors.blue} />
                  <Text style={styles.heroChipText}>Memberships</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <GymScreenScrollViewFour />
            </View>
            <View style={styles.section}>
              <GymScreenScrollViewOne />
            </View>
            <View style={styles.section}>
              <GymScreenScrollViewThree />
            </View>
            <View style={styles.section}>
              <GymScreenScrollViewTwo />
            </View>
            {isOwner ? (
              <View style={styles.section}>
                <GymScreenScrollViewFive />
              </View>
            ) : null}
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
    flex: 1,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 24,
    width: '100%',
  },
  headingContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 32,
    marginTop: 20,
    textAlign: 'center',
    width: '100%',
    zIndex: 1,
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 88
  },
  heroCard: {
    backgroundColor: AppColors.grey4,
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
    shadowColor: AppColors.grey3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTopRow: {
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
    zIndex: 0,
    top: 0,
    right: 148,
  }
})
