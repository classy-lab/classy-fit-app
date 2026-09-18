// @ts-nocheck
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { gymScreenStyles } from '../../styles/gymScreenStyles'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useCallback, useContext, useState } from 'react'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'
import PersonalTrainingSvg from '../../components/svg/PersonalTrainingSvg'

const GymScreenScrollViewTwo = () => {
  const navigation = useNavigation<any>()
  const { user, tokens, setTokens, webServer } = useContext(UserContext);
  const [equipment, setEquipment] = useState([]);

  return (
    <>
      <Text style={gymScreenStyles.sectionTitle}>Equipment</Text>
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
            onPress={() => navigation.navigate('GymTab', { screen: 'GymEquipmentScreen' })}
          >
            <View style={gymScreenStyles.whiteSquare}>
              <PersonalTrainingSvg />
            </View>
          </TouchableOpacity>
          <Text style={gymScreenStyles.cardText}>Gym {'\n'}Equipment</Text>
        </View>
        <View style={gymScreenStyles.greySquareContainer}>
          <TouchableOpacity
            style={gymScreenStyles.greySquare}
            activeOpacity={0.8}
            hitSlop={8}
            onPress={() => navigation.navigate('GymTab', { screen: 'AddEquipmentScreen' })}
          >
            <View style={gymScreenStyles.whiteSquare}>
              <PersonalTrainingSvg />
            </View>
          </TouchableOpacity>
          <Text style={gymScreenStyles.cardText}>Add {'\n'}Equipment</Text>
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
  sectionTitle: {
    width: 'auto',
    flexShrink: 1,
  },
  viewAllText: {
    color: AppColors.blue,
    fontSize: 14,
    marginBottom: 16,
  },
  noResultsText: {
    color: AppColors.primary,
    fontSize: 14,
  },
})
