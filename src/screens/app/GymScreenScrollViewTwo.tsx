// @ts-nocheck
import { ScrollView, View, TouchableOpacity, Text } from 'react-native'
import Treadmill from '../../assets/svg/Treadmill'
import Elliptical from '../../assets/svg/Elliptical'
import Dumbbell from '../../assets/svg/Dumbbell'
import { gymScreenStyles } from '../../styles/gymScreenStyles'

const GymScreenScrollViewTwo = () => {
  return (
    <>
      <Text style={gymScreenStyles.sectionTitle}>Equipment</Text>
      <ScrollView
        style={gymScreenStyles.greySquares}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      >
        <View style={gymScreenStyles.greySquareContainer}>
          <TouchableOpacity style={gymScreenStyles.greySquare} onPress={() => navigation.navigate('GymTab', { screen: 'TreadmillEquipmentScreen' })}>
            <View style={gymScreenStyles.whiteSquare}>
              <Treadmill />
            </View>
          </TouchableOpacity>
          <Text style={gymScreenStyles.cardText}>Treadmill</Text>
        </View>
        <View style={gymScreenStyles.greySquareContainer}>
          <TouchableOpacity style={gymScreenStyles.greySquare} onPress={() => navigation.navigate('GymTab', { screen: 'TreadmillEquipmentScreen' })}>
            <View style={gymScreenStyles.whiteSquare}>
              <Elliptical />
            </View>
          </TouchableOpacity>
          <Text style={gymScreenStyles.cardText}>Elliptical</Text>
        </View>
        <View style={gymScreenStyles.greySquareContainer}>
          <TouchableOpacity style={gymScreenStyles.greySquare} onPress={() => navigation.navigate('GymTab', { screen: 'TreadmillEquipmentScreen' })}>
            <View style={gymScreenStyles.whiteSquare}>
              <Dumbbell />
            </View>
          </TouchableOpacity>
          <Text style={gymScreenStyles.cardText}>Dumbbells</Text>
        </View>
        <View style={gymScreenStyles.greySquareContainer}>
          <TouchableOpacity style={gymScreenStyles.greySquare} onPress={() => navigation.navigate('GymTab', { screen: 'TreadmillEquipmentScreen' })}>
            <View style={gymScreenStyles.whiteSquare}>
              <Dumbbell />
            </View>
          </TouchableOpacity>
          <Text style={gymScreenStyles.cardText}>Smith {'\n'} Machine</Text>
        </View>
      </ScrollView>
    </>
  )
}

export default GymScreenScrollViewTwo
