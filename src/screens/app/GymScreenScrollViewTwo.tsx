// @ts-nocheck
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { gymScreenStyles } from '../../styles/gymScreenStyles'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useCallback, useContext, useState } from 'react'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'

const GymScreenScrollViewTwo = () => {
  const navigation = useNavigation<any>()
  const { user, tokens, setTokens, webServer } = useContext(UserContext);
  const [equipment, setEquipment] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const fetchEquipment = async () => {
        try {
          const response = await fetch(`${webServer}/api/v1/gyms/${user.gym_id}/equipment`, {
            headers: {
              Authorization: "Bearer " + tokens.access_token,
            },
          });

          const obj = await response.json();

          if (response.status === 200) {
            setEquipment(obj.data ?? []);
          }
          else {
            console.log("Access token expired, requesting new one - useFocusEffect()");

            const refreshResponse = await fetch(`${webServer}/api/v1/refresh`, {
              method: "POST",
              body: JSON.stringify({
                token: tokens.refresh_token,
              }),
            });

            const refreshObj = await refreshResponse.json();

            if (refreshResponse.status === 200) {
              console.log("Got new access token and refresh token");
              setTokens((prev: any) => ({
                ...prev,
                access_token: refreshObj.access_token,
                refresh_token: refreshObj.refresh_token,
              }));
            }
          }
        } catch (error) {
          console.log('Failed to fetch equipment:', error);
        }
      };

      fetchEquipment();
    }, [tokens?.access_token, tokens?.refresh_token])
  );

  const getShortTitle = (title, maxChars = 14) => {
    const trimmedTitle = String(title ?? 'Untitled').trim();
    return trimmedTitle.length > maxChars ? `${trimmedTitle.slice(0, maxChars)}...` : trimmedTitle;
  };

  const handleEquipmentPress = (item) => {
    // EquipmentDetailScreen exists and is registered in GymStack.
    navigation.navigate('GymTab', { screen: 'EquipmentDetailScreen', params: { equipmentId: item.uid, equipment: item } });
  };

  return (
    <>
      <View style={styles.sectionHeading}>
        <Text style={[gymScreenStyles.sectionTitle, styles.sectionTitle]}>Equipment</Text>
        <TouchableOpacity onPress={() => navigation.navigate('GymTab', { screen: 'GymEquipmentScreen' })}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={gymScreenStyles.greySquares}>
        {equipment.length === 0 ? (
          <Text style={styles.noResultsText}>No equipment found for this gym</Text>
        ) : (
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
          >
            {equipment.map((item, index) => {
              return (
                <View key={item.uid ?? index} style={gymScreenStyles.greySquareContainer}>
                  <TouchableOpacity style={gymScreenStyles.greySquare} onPress={() => handleEquipmentPress(item)}>
                    <View style={gymScreenStyles.whiteSquare}>
                      <Ionicons name="barbell-outline" color={AppColors.blue} size={28} />
                    </View>
                  </TouchableOpacity>
                  <Text style={gymScreenStyles.cardText} numberOfLines={1} ellipsizeMode="tail">{getShortTitle(item.title)}</Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
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
