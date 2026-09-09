// @ts-nocheck
import { StyleSheet, Text, View, Image, TouchableOpacity, ImageBackground, ScrollView, Linking, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppColors } from '../../styles/colors'
import Feather from '@expo/vector-icons/Feather'
import { s } from 'react-native-size-matters'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import EarningsBarGraph from '../../assets/svg/EarningsBarGraph'
import Entypo from '@expo/vector-icons/Entypo'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useContext, useState } from 'react'
import { UserContext } from '../../context/UserContext'

import LineChart from '../../assets/svg/LineChart'
import LineChart2 from '../../assets/svg/LineChart2'
import LineChart3 from '../../assets/svg/LineChart3'
import LineChart4 from '../../assets/svg/LineChart4'
const imageSource = require('../../assets/images/ovalBg.png')

const EarningsScreen = ({ navigation, route }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext)
  const [isLoadingStripe, setIsLoadingStripe] = useState(false)

  const handleConnectStripe = async () => {
    if (!user?.gym_id) {
      Alert.alert('Error', 'Gym information not found')
      return
    }

    setIsLoadingStripe(true)
    try {
      const response = await fetch(
        `${webServer}/api/v1/gyms/${user.gym_id}/stripe/accounts/onboarding-link`,
        {
          headers: {
            Authorization: 'Bearer ' + tokens.access_token,
          },
        }
      )

      if (response.status === 401) {
        console.log('Access token expired, requesting new one')
        const refreshResponse = await fetch(`${webServer}/api/v1/refresh`, {
          method: 'POST',
          body: JSON.stringify({
            token: tokens.refresh_token,
          }),
        })

        if (refreshResponse.status === 200) {
          const refreshObj = await refreshResponse.json()
          setTokens((prev) => ({
            ...prev,
            access_token: refreshObj.access_token,
            refresh_token: refreshObj.refresh_token,
          }))
          setIsLoadingStripe(false)
          // Retry the original request
          handleConnectStripe()
          return
        }
      }

      if (response.status !== 200) {
        const errorData = await response.json()
        Alert.alert(
          'Error',
          errorData?.message || 'Failed to get Stripe onboarding link'
        )
        setIsLoadingStripe(false)
        return
      }

      const data = await response.json()

      if (!data?.onboarding_url || typeof data.onboarding_url !== 'string') {
        Alert.alert('Error', 'Invalid onboarding link received from server')
        setIsLoadingStripe(false)
        return
      }

      // Open the Stripe onboarding URL
      try {
        await Linking.openURL(data.onboarding_url)
      } catch (error) {
        Alert.alert('Error', 'Unable to open Stripe onboarding link')
      }
    } catch (error) {
      console.log('Stripe onboarding error:', error)
      Alert.alert('Error', 'Failed to initiate Stripe Connect setup')
    } finally {
      setIsLoadingStripe(false)
    }
  }

  return (
    <>
      <ImageBackground source={imageSource} style={styles.background}>
        <SafeAreaView style={styles.container}>
          <View style={styles.navs}>
            <Feather name="arrow-left" color={AppColors.white} size={36} onPress={() => { navigation.goBack() }} />
            <View style={styles.signOut}>
              <Text style={styles.signOutText}>Log out</Text>
              <View style={styles.circle}>
                <MaterialIcons name="logout" color={AppColors.white} size={18} onPress={() => { navigation.navigate('SignoutScreen') }} />
              </View>
            </View>
          </View>

          <ScrollView style={styles.scrollViewStyles} showsVerticalScrollIndicator={false}>
            <View style={styles.heading}>
              <Text style={styles.headingTitle}>Statements</Text>
              <Text style={styles.headingSubTitle}>March 2026</Text>
              <View style={styles.calendarControls}>
                <TouchableOpacity>
                  <Text style={styles.calendarControlText}>{'<'} Previous</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={styles.calendarControlText}>Full Year</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={styles.calendarControlText}>Next {'>'}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.body}>
              <TouchableOpacity
                style={styles.stripeCard}
                onPress={handleConnectStripe}
                disabled={isLoadingStripe}
              >
                <View style={styles.stripeCardContent}>
                  <View style={styles.stripeCardLeft}>
                    <View style={styles.stripeCardIcon}>
                      <FontAwesome6 name="stripe-s" size={24} color={AppColors.blue} />
                    </View>
                    <View style={styles.stripeCardText}>
                      <Text style={styles.stripeCardTitle}>Connect Stripe Account</Text>
                      <Text style={styles.stripeCardSubtitle}>
                        Set up payments for your gym
                      </Text>
                    </View>
                  </View>
                  {isLoadingStripe ? (
                    <ActivityIndicator color={AppColors.blue} size="small" />
                  ) : (
                    <Feather name="arrow-right" color={AppColors.blue} size={20} />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('HomeTab', { screen: 'AllEarnings' })}>
                <View style={styles.squareCard}>
                  <View style={styles.squareCardHeadingContainer}>
                    <View style={styles.squareCardHeading}>
                      <Text style={styles.SquareCardTitle}>March</Text>
                      <Text style={styles.SquareCardSubTitle}>7 Day Business Earnings Graph</Text>
                    </View>
                    <View style={styles.SquareCardSettingsIcon}>
                      <Entypo name="sound-mix" size={24} color={AppColors.grey3} />
                    </View>
                  </View>
                  <View style={styles.barGraph}>
                    <EarningsBarGraph />
                  </View>
                </View>
              </TouchableOpacity>
              <View style={styles.cards}>
                <TouchableOpacity>
                  <View style={styles.square}>
                    <Text style={styles.smallSquareCardTitle}>Membership</Text>
                    <Text style={styles.smallSquareCardSubTitle}>Earnings</Text>
                    <View style={styles.smallBarGraph}>
                      <LineChart />
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity>
                  <View style={styles.square}>
                    <Text style={styles.smallSquareCardTitle}>Product</Text>
                    <Text style={styles.smallSquareCardSubTitle}>Earnings</Text>
                    <View style={styles.smallBarGraph}>
                      <LineChart2 />
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity>
                  <View style={styles.square}>
                    <Text style={styles.smallSquareCardTitle}>Class</Text>
                    <Text style={styles.smallSquareCardSubTitle}>Statements</Text>
                    <View style={styles.smallBarGraph}>
                      <LineChart3 />
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity>
                  <View style={styles.square}>
                    <Text style={styles.smallSquareCardTitle}>Personal Training</Text>
                    <Text style={styles.smallSquareCardSubTitle}>Earnings</Text>
                    <View style={styles.smallBarGraph}>
                      <LineChart4 />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </>
  )
}

export default EarningsScreen

const styles = StyleSheet.create({
  container: {
    // backgroundColor: AppColors.grey,
    backgroundColor: 'transparent',
  },
  background: {
    flex: 1,
    // width: '100%',
    // height: '100%',
    // jusifyContent: 'center',
    // alignItems: 'center',
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 24,
    width: '100%',
  },
  scrollViewStyles: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 8,
  },
  title: {
    color: AppColors.white,
    fontSize: 32,
    marginTop: 20,
  },
  bodyText: {
    fontSize: s(14),
    lineHeight: 24,
    color: AppColors.primary,
  },
  signOut: {
    // borderWidth: 1, borderColor: 'red',
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutText: {
    marginRight: 4,
    color: AppColors.white,
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
  earningsText: {
    color: AppColors.white,
    fontSize: 24
  },
  heading: {
    // marginTop: 8,
    alignItems: 'center',
    width: '100%',
    // borderWidth: 1, borderColor: 'red',
    marginBottom: 20
  },
  headingTitle: {
    color: AppColors.white,
    fontSize: 32,
    marginTop: 16,
    // fontFamily: 'Montserrat-Bold'
  },
  headingSubTitle: {
    marginTop: 6,
    fontSize: 16,
    color: AppColors.white,
  },
  calendarControls: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    // borderWidth: 1, borderColor: 'red',
    width: '100%'
  },
  calendarControlText: {
    color: AppColors.blue,
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
    marginBottom: 20,
    boxShadow: '4px 8px 24px rgba(000, 0, 0, 0.1)'
  },
  squareCardHeadingContainer: {
    flexDirection: 'row',
    // borderWidth: 1, borderColor: 'red',
    justifyContent: 'space-between',
    alignItems: 'baseline'
  },
  squareCardHeading: {},
  SquareCardHeadingText: {},
  SquareCardTitle: {
    color: AppColors.primary,
    fontSize: 24,
    fontFamily: 'Montserrat-Bold'
  },
  SquareCardSubTitle: {
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    // flex: 1,
    marginBottom: 20,
    // borderWidth: 1, borderColor: 'red',
    rowGap: 16,
    columnGap: 16,
    justifyContent: 'center',
    paddingBottom: 88
  },
  square: {
    width: s(140),
    height: s(140),
    borderRadius: 24,
    backgroundColor: AppColors.white,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    boxShadow: '4px 8px 24px rgba(000, 0, 0, 0.1)',
    padding: 16
  },
  smallSquareCardTitle: {
    fontSize: 12,
    fontFamily: 'Montserrat-Bold',
    // borderWidth: 1, borderColor: 'red',
  },
  smallSquareCardSubTitle: {
    marginTop: 6,
    color: AppColors.grey2
  },
  smallBarGraph: {
    marginTop: 16
  },
  stripeCard: {
    width: '100%',
    backgroundColor: AppColors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 20,
    marginBottom: 20,
    boxShadow: '4px 8px 24px rgba(000, 0, 0, 0.1)',
  },
  stripeCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stripeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stripeCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: AppColors.grey,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stripeCardText: {
    flex: 1,
  },
  stripeCardTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Bold',
    color: AppColors.blue,
  },
  stripeCardSubtitle: {
    fontSize: 12,
    color: AppColors.grey2,
    marginTop: 2,
  },
})
