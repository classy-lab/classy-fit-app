import { ScrollView, View, TouchableOpacity, Text } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AppColors } from '../../styles/colors'
import { gymScreenStyles } from '../../styles/gymScreenStyles'

const GymScreenScrollViewThree = () => {
  return (
    <>
      <Text style={gymScreenStyles.sectionTitle}>Bills</Text>
      <ScrollView
        style={gymScreenStyles.greySquares}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      >
        <View style={gymScreenStyles.greySquareContainer}>
          <TouchableOpacity style={gymScreenStyles.greySquare}>
            <View style={gymScreenStyles.whiteSquare}>
              <Ionicons name="flash" color={AppColors.blue} size={32} />
            </View>
          </TouchableOpacity>
          <Text style={gymScreenStyles.cardText}>Utility Bills</Text>
        </View>
      </ScrollView>
    </>
  )
}

export default GymScreenScrollViewThree
