import { ScrollView, View, TouchableOpacity, Text } from 'react-native'
import { useContext } from 'react'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { AppColors } from '../../styles/colors'
import { gymScreenStyles } from '../../styles/gymScreenStyles'
import { UserContext } from '../../context/UserContext'

const GymScreenScrollViewFour = () => {
  const navigation = useNavigation<any>()
  const { user } = useContext(UserContext)
  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'

  return (
    <>
      <Text style={gymScreenStyles.sectionTitle}>Memberships</Text>
      <ScrollView
        style={gymScreenStyles.greySquares}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      >
        {!isOwner ? (
          <View style={gymScreenStyles.greySquareContainer}>
            <TouchableOpacity
              style={gymScreenStyles.greySquare}
              activeOpacity={0.8}
              hitSlop={8}
              onPress={() => navigation.navigate('MembershipPlansScreen')}
            >
              <View style={gymScreenStyles.whiteSquare}>
                <Feather name="credit-card" color={AppColors.blue} size={28} />
              </View>
            </TouchableOpacity>
            <Text style={gymScreenStyles.cardText}>Membership Plans</Text>
          </View>
        ) : null}
        {isOwner ? (
          <View style={gymScreenStyles.greySquareContainer}>
            <TouchableOpacity
              style={gymScreenStyles.greySquare}
              activeOpacity={0.8}
              hitSlop={8}
              onPress={() => navigation.navigate('MembershipPlanManagementScreen')}
            >
              <View style={gymScreenStyles.whiteSquare}>
                <MaterialCommunityIcons name="credit-card-settings" color={AppColors.blue} size={28} />
              </View>
            </TouchableOpacity>
            <Text style={gymScreenStyles.cardText}>Manage Membership Plans</Text>
          </View>
        ) : null}
      </ScrollView>
    </>
  )
}

export default GymScreenScrollViewFour
