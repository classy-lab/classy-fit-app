import { ScrollView, View, TouchableOpacity, Text } from 'react-native'
import { useContext } from 'react'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import ClassesSvg from '../../components/svg/ClassesSvg'
import { AppColors } from '../../styles/colors'
import { gymScreenStyles } from '../../styles/gymScreenStyles'
import { UserContext } from '../../context/UserContext'


const GymScreenScrollViewOne = () => {
  const navigation = useNavigation<any>()
  const { user } = useContext(UserContext)
  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'
  return (
    <>
      <Text style={gymScreenStyles.sectionTitle}>Classes</Text>
      <ScrollView
        style={gymScreenStyles.greySquares}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      >
        {isOwner ? (
          <View style={gymScreenStyles.greySquareContainer}>
            <TouchableOpacity
              style={gymScreenStyles.greySquare}
              onPress={() => navigation.navigate('ClassManagementScreen')}
            >
              <View style={gymScreenStyles.whiteSquare}>
                <Feather name="settings" color={AppColors.blue} size={28} />
              </View>
            </TouchableOpacity>
            <Text style={gymScreenStyles.cardText}>Manage Classes</Text>
          </View>
        ) : null}
        <View style={gymScreenStyles.greySquareContainer}>
          <TouchableOpacity
            style={gymScreenStyles.greySquare}
            activeOpacity={0.8}
            hitSlop={8}
            onPress={() => navigation.navigate('ClassesScreen')}
          >
            <View style={gymScreenStyles.whiteSquare}>
              <ClassesSvg />
            </View>
          </TouchableOpacity>
          <Text style={gymScreenStyles.cardText}>Classes</Text>
        </View>
        <View style={gymScreenStyles.greySquareContainer}>
          <TouchableOpacity
            style={gymScreenStyles.greySquare}
            onPress={() => navigation.navigate('MyClassBookingsScreen')}
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

export default GymScreenScrollViewOne
