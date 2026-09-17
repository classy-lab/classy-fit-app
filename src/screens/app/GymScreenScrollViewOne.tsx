import { ScrollView, View, TouchableOpacity, Text } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import ClassesSvg from '../../components/svg/ClassesSvg'
import PersonalTrainingSvg from '../../components/svg/PersonalTrainingSvg'
import { AppColors } from '../../styles/colors'
import { gymScreenStyles } from '../../styles/gymScreenStyles'
import { useContext } from 'react'
import { UserContext } from '../../context/UserContext'


const GymScreenScrollViewOne = () => {
  const navigation = useNavigation<any>()
  const { user } = useContext(UserContext)
  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'
  return (
    <>
      <Text style={gymScreenStyles.sectionTitle}>Gym</Text>
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
          <Text style={gymScreenStyles.cardText}>My Class {'\n'}Bookings</Text>
        </View>
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
            <Text style={gymScreenStyles.cardText}>Manage {'\n'}Classes</Text>
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
          <Text style={gymScreenStyles.cardText}>Personal {'\n'}Training</Text>
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
          <Text style={gymScreenStyles.cardText}>My PT {'\n'}Bookings</Text>
        </View>
      </ScrollView>
    </>
  )
}

export default GymScreenScrollViewOne
