// @ts-nocheck
import { ScrollView, View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import Treadmill from '../../assets/svg/Treadmill'
import Elliptical from '../../assets/svg/Elliptical'
import Dumbbell from '../../assets/svg/Dumbbell'
import { gymScreenStyles } from '../../styles/gymScreenStyles'
import { useNavigation } from '@react-navigation/native'
import { AppColors } from '../../styles/colors'

const GymScreenScrollViewTwo = () => {
  const navigation = useNavigation<any>()

  return (
    <>
      <View style={styles.sectionHeading}>
        <Text style={gymScreenStyles.sectionTitle}>Equipment</Text>
        <TouchableOpacity onPress={() => navigation.navigate('GymTab', { screen: 'GymEquipmentScreen' })}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
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

const styles = StyleSheet.create({
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllText: {
    color: AppColors.blue,
    fontSize: 14,
  },
})
