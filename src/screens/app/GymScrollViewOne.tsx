import React from 'react'
import { ScrollView, StyleSheet, View, TouchableOpacity, Text } from 'react-native'
import BuildingSvg from '../../components/svg/BuildingSvg'
import ClassesSvg from '../../components/svg/ClassesSvg'
import PersonalTrainingSvg from '../../components/svg/PersonalTrainingSvg'
import { s } from 'react-native-size-matters'
import { AppColors } from '../../styles/colors'

const GymScrollViewOne = () => {
  return (
    <>
      <Text style={styles.sectionTitle}>Gym</Text>
      <ScrollView
        style={styles.greySquares}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.greySquareContainer}>
          <TouchableOpacity style={styles.greySquare}>
            <View style={styles.whiteSquare}>
              <BuildingSvg />
            </View>
          </TouchableOpacity>
          <Text style={styles.cardText}>Building</Text>
        </View>
        <View style={styles.greySquareContainer}>
          <TouchableOpacity style={styles.greySquare}>
            <View style={styles.whiteSquare}>
              <ClassesSvg />
            </View>
          </TouchableOpacity>
          <Text style={styles.cardText}>Classes</Text>
        </View>
        <View style={styles.greySquareContainer}>
          <TouchableOpacity style={styles.greySquare}>
            <View style={styles.whiteSquare}>
              <PersonalTrainingSvg />
            </View>
          </TouchableOpacity>
          <Text style={styles.cardText}>Personal {'\n'}Training</Text>
        </View>
      </ScrollView>
    </>

  )
}

export default GymScrollViewOne

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 24,
    marginBottom: 16,
    width: '100%'
  },
  greySquares: {
    // borderWidth: 1, borderRadius: 'red',
    // flexDirection: 'row',
    // flexWrap: 'wrap',
    // justifyContent: 'flex-start',
    columnGap: 8,
    rowGap: 16
  },
  greySquareContainer: {
    alignItems: 'center',
    // borderWidth: 1, borderRadius: 'red',
  },
  greySquare: {
    backgroundColor: AppColors.grey,
    width: s(96),
    height: s(96),
    borderRadius: s(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  whiteSquare: {
    backgroundColor: AppColors.white,
    borderRadius: s(16),
    width: s(60),
    height: s(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: s(8)
  },
  cardText: {
    textAlign: 'center',
    marginTop: 8
  }
});
