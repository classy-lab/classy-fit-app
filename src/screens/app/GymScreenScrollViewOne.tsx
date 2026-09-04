import { ScrollView, View, TouchableOpacity, Text } from 'react-native'
import BuildingSvg from '../../components/svg/BuildingSvg'
import ClassesSvg from '../../components/svg/ClassesSvg'
import PersonalTrainingSvg from '../../components/svg/PersonalTrainingSvg'
import { gymScreenStyles } from '../../styles/gymScreenStyles'


const GymScreenScrollViewOne = () => {
  return (
    <>
      <Text style={gymScreenStyles.sectionTitle}>Gym</Text>
      <ScrollView
        style={gymScreenStyles.greySquares}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      >
        <View style={gymScreenStyles.greySquareContainer}>
          <TouchableOpacity style={gymScreenStyles.greySquare}>
            <View style={gymScreenStyles.whiteSquare}>
              <BuildingSvg />
            </View>
          </TouchableOpacity>
          <Text style={gymScreenStyles.cardText}>Live Occupancy</Text>
        </View>
        <View style={gymScreenStyles.greySquareContainer}>
          <TouchableOpacity style={gymScreenStyles.greySquare}>
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
