import { ScrollView, View, TouchableOpacity, Text } from 'react-native'
import { useContext } from 'react'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { gymScreenStyles } from '../../styles/gymScreenStyles'
import { UserContext } from '../../context/UserContext'

const GymScreenScrollViewFive = () => {
  const navigation = useNavigation<any>()
  const { user } = useContext(UserContext)
  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'

  if (!isOwner) {
    return null
  }

  return (
    <>
      <Text style={gymScreenStyles.sectionTitle}>Gym Videos</Text>
      <ScrollView
        style={gymScreenStyles.greySquares}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      >
        <View style={gymScreenStyles.greySquareContainer}>
          <TouchableOpacity
            style={gymScreenStyles.greySquare}
            activeOpacity={0.8}
            hitSlop={8}
            onPress={() => navigation.navigate('GymVideoManagementScreen')}
          >
            <View style={gymScreenStyles.whiteSquare}>
              <Feather name="video" color={AppColors.blue} size={28} />
            </View>
          </TouchableOpacity>
          <Text style={gymScreenStyles.cardText}>Manage Videos</Text>
        </View>
      </ScrollView>
    </>
  )
}

export default GymScreenScrollViewFive
