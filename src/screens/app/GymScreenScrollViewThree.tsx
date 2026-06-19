import { ScrollView, View, TouchableOpacity, Text } from 'react-native'
import MemberNotification from '../../assets/svg/MemberNotification'
import { gymScreenStyles } from '../../styles/gymScreenStyles'

const GymScreenScrollViewThree = () => {
  return (
    <>
      <Text style={gymScreenStyles.sectionTitle}>Messaging</Text>
      <ScrollView
        style={gymScreenStyles.greySquares}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      >
        <View style={gymScreenStyles.greySquareContainer}>
          <TouchableOpacity style={gymScreenStyles.greySquare}>
            <View style={gymScreenStyles.whiteSquare}>
              <MemberNotification />
            </View>
          </TouchableOpacity>
          <Text style={gymScreenStyles.cardText}>Member{'\n'}Notifications</Text>
        </View>
      </ScrollView>
    </>
  )
}

export default GymScreenScrollViewThree
