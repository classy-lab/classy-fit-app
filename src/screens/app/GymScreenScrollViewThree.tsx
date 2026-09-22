import { ScrollView, View, TouchableOpacity, Text } from 'react-native'
import { useContext } from 'react'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AppColors } from '../../styles/colors'
import { gymScreenStyles } from '../../styles/gymScreenStyles'
import PersonalTrainingSvg from '../../components/svg/PersonalTrainingSvg'
import { UserContext } from '../../context/UserContext'

const GymScreenScrollViewThree = () => {
  const navigation = useNavigation<any>()
  const { user } = useContext(UserContext)
  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'

  return (
    <>
      <Text style={gymScreenStyles.sectionTitle}>Personal Training</Text>
      <ScrollView
        style={gymScreenStyles.greySquares}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      >
        {isOwner ? (
          <View style={gymScreenStyles.greySquareContainer}>
            <TouchableOpacity
              style={gymScreenStyles.greySquare}
              onPress={() => navigation.navigate('PersonalTrainingManagementScreen')}
            >
              <View style={gymScreenStyles.whiteSquare}>
                <Feather name="settings" color={AppColors.blue} size={28} />
              </View>
            </TouchableOpacity>
            <Text style={gymScreenStyles.cardText}>Manage PT</Text>
          </View>
        ) : null}
        <View style={gymScreenStyles.greySquareContainer}>
          <TouchableOpacity
            style={gymScreenStyles.greySquare}
            activeOpacity={0.8}
            hitSlop={8}
            onPress={() => navigation.navigate('PersonalTrainingSessionsScreen')}
          >
            <View style={gymScreenStyles.whiteSquare}>
              <PersonalTrainingSvg />
            </View>
          </TouchableOpacity>
          <Text style={gymScreenStyles.cardText}>PT Sessions</Text>
        </View>
        <View style={gymScreenStyles.greySquareContainer}>
          <TouchableOpacity
            style={gymScreenStyles.greySquare}
            activeOpacity={0.8}
            hitSlop={8}
            onPress={() => navigation.navigate('MyPersonalTrainingBookingsScreen')}
          >
            <View style={gymScreenStyles.whiteSquare}>
              <Feather name="calendar" color={AppColors.blue} size={28} />
            </View>
          </TouchableOpacity>
          <Text style={gymScreenStyles.cardText}>My Bookings</Text>
        </View>
      </ScrollView>
    </>
  )
}

export default GymScreenScrollViewThree
