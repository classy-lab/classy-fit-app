import { ScrollView, View, TouchableOpacity, Text } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import ClassesSvg from '../../components/svg/ClassesSvg'
import PersonalTrainingSvg from '../../components/svg/PersonalTrainingSvg'
import { AppColors } from '../../styles/colors'
import { gymScreenStyles } from '../../styles/gymScreenStyles'


const GymScreenScrollViewOne = () => {
  const navigation = useNavigation<any>()
  return (
    <>
      <Text style={gymScreenStyles.sectionTitle}>Gym</Text>
      <ScrollView
        style={gymScreenStyles.greySquares}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      >
        <View style={gymScreenStyles.greySquareContainer}>
          <TouchableOpacity style={gymScreenStyles.greySquare} onPress={() => navigation.navigate('ClassesScreen')}>
            <View style={gymScreenStyles.whiteSquare}>
              <ClassesSvg />
            </View>
          </TouchableOpacity>
          <Text style={gymScreenStyles.cardText}>Classes</Text>
        </View>
        <View style={gymScreenStyles.greySquareContainer}>
          <TouchableOpacity style={gymScreenStyles.greySquare}>
            <View style={gymScreenStyles.whiteSquare}>
              <PersonalTrainingSvg />
            </View>
          </TouchableOpacity>
          <Text style={gymScreenStyles.cardText}>Personal {'\n'}Training</Text>
        </View>
      </ScrollView>
    </>
  )
}

export default GymScreenScrollViewOne
