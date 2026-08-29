// @ts-nocheck
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppColors } from '../../styles/colors'
import { Feather } from '@expo/vector-icons'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import SignOut from '../../components/utils/SignOut'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useContext, useState } from 'react'
import { UserContext } from '../../context/UserContext'

type EquipmentImage = {
  image_url?: string;
  is_primary?: boolean | number;
};

type Equipment = {
  uid?: string | number;
  title?: string;
  images?: EquipmentImage[];
  brand?: string;
  model?: string;
  equipment_category_name?: string;
  quantity?: string | number;
  location?: string;
  status?: string;
  equipment_condition?: string;
};

const GymEquipmentScreen = ({ navigation }: { navigation: any }) => {
  const { user } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const { webServer } = useContext(UserContext);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      const fetchEquipment = async () => {
        setIsLoading(true);
        setError('');

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
            else {
              setError('Unable to load equipment. Please try again.');
            }
          }
        } catch (error) {
          console.log('Failed to fetch equipment:', error);
          setError('Unable to load equipment. Please check your connection and try again.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchEquipment();
    }, [tokens?.access_token, tokens?.refresh_token])
  );

  const getPrimaryImageUrl = (item: Equipment) => {
    if (!Array.isArray(item.images) || item.images.length === 0) return null;
    const primary = item.images.find((image) => image?.is_primary);
    return (primary || item.images[0])?.image_url ?? null;
  };

  const handleEquipmentPress = (item: Equipment) => {
    // EquipmentDetailScreen has not been built yet. Guard the navigation so this
    // handler is ready to use as soon as that screen/route is registered.
    const availableRoutes = navigation.getState?.()?.routeNames ?? [];

    if (availableRoutes.includes('EquipmentDetailScreen')) {
      navigation.navigate('EquipmentDetailScreen', { equipmentId: item.uid, equipment: item });
    } else {
      console.log('EquipmentDetailScreen route is not registered yet. Tapped equipment:', item);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Feather
            name="arrow-left"
            color={AppColors.blue}
            size={36}
            onPress={() => {
              navigation.goBack();
            }}
          />
          <SignOut />
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Equipment</Text>
            <PinkLeafSvg style={styles.pinkLeaf} />
          </View>
          <View style={styles.body}>
            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Equipment</Text>
                <Text style={styles.countText}>Count: {equipment.length}</Text>
              </View>

              {isLoading ? (
                <ActivityIndicator size="large" color={AppColors.blue} style={styles.loadingIndicator} />
              ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : equipment.length === 0 ? (
                <Text style={styles.noResultsText}>No equipment found for this gym</Text>
              ) : (
                <View style={styles.cards}>
                  {equipment.map((item, index) => (
                    <TouchableOpacity key={item.uid ?? index} onPress={() => handleEquipmentPress(item)}>
                      <View style={styles.card}>
                        {getPrimaryImageUrl(item) ? (
                          <Image style={styles.image} source={{ uri: getPrimaryImageUrl(item) }} />
                        ) : (
                          <View style={styles.imagePlaceholder}>
                            <Feather name="image" color={AppColors.grey2} size={28} />
                          </View>
                        )}
                        <View style={styles.cardContent}>
                          <Text style={styles.equipmentTitle} numberOfLines={1} ellipsizeMode="tail">{item.title ?? 'Untitled Equipment'}</Text>
                          <Text style={styles.equipmentSubtitle} numberOfLines={1} ellipsizeMode="tail">
                            {[item.brand, item.model].filter(Boolean).join(' • ')}
                          </Text>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Category:</Text>
                            <Text style={styles.detailValue}>{item.equipment_category_name ?? '—'}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Quantity:</Text>
                            <Text style={styles.detailValue}>{item.quantity ?? '—'}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Location:</Text>
                            <Text style={styles.detailValue}>{item.location ?? '—'}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Condition:</Text>
                            <Text style={styles.detailValue}>{item.equipment_condition ?? '—'}</Text>
                          </View>
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeText}>{item.status ?? 'Unknown'}</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

export default GymEquipmentScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    paddingLeft: 24,
    paddingRight: 24,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    color: AppColors.blue,
    fontSize: 32,
    marginTop: 20,
    marginBottom: 40,
    width: 320,
    textAlign: "center",
  },
  pinkLeaf: {
    position: "absolute",
    zIndex: -1,
    right: 96,
  },
  body: {
    flex: 1,
  },
  section: {
    marginTop: 8,
    marginBottom: 32
  },
  sectionHeading: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
  },
  countText: {
    color: AppColors.blue
  },
  loadingIndicator: {
    marginTop: 32,
  },
  errorText: {
    color: AppColors.red,
    marginTop: 12,
  },
  noResultsText: {
    marginTop: 12,
    color: AppColors.primary,
    fontSize: 14,
  },
  cards: {
    rowGap: 16,
  },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    backgroundColor: AppColors.grey,
    borderRadius: 16,
    padding: 12,
    columnGap: 12,
  },
  image: {
    width: 88,
    height: 88,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  equipmentTitle: {
    fontSize: 16,
    color: AppColors.blue,
    fontFamily: "Montserrat",
  },
  equipmentSubtitle: {
    marginTop: 2,
    marginBottom: 6,
    color: AppColors.grey2,
    fontSize: 12,
  },
  detailRow: {
    flexDirection: 'row',
    columnGap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: AppColors.grey2,
  },
  detailValue: {
    fontSize: 12,
    color: AppColors.blue,
  },
  statusBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: AppColors.blue,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    color: AppColors.white,
    fontSize: 11,
  },
})
