// @ts-nocheck
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { gymScreenStyles } from '../../styles/gymScreenStyles'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useCallback, useContext, useState } from 'react'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'

const GymScreenScrollViewTwo = () => {
  const navigation = useNavigation<any>()
  const { user, tokens, setTokens, webServer } = useContext(UserContext);
  const [equipment, setEquipment] = useState([]);
  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner';

  return (
    <>
      <Text style={gymScreenStyles.sectionTitle}>Gym Equipment</Text>
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
              <FontAwesome5 name="dumbbell" color={AppColors.blue} size={26} />
            </View>
          </TouchableOpacity>
          <Text style={gymScreenStyles.cardText}>Gym Equipment</Text>
        </View>
        {isOwner ? (
          <View style={gymScreenStyles.greySquareContainer}>
            <TouchableOpacity
              style={gymScreenStyles.greySquare}
              activeOpacity={0.8}
              hitSlop={8}
              onPress={() => navigation.navigate('GymTab', { screen: 'AddEquipmentScreen' })}
            >
              <View style={gymScreenStyles.whiteSquare}>
                <Feather name="plus-circle" color={AppColors.blue} size={28} />
              </View>
            </TouchableOpacity>
            <Text style={gymScreenStyles.cardText}>Add Equipment</Text>
          </View>
        ) : null}
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
