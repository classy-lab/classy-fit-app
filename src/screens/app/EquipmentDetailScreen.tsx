// @ts-nocheck
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useState, useEffect, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'

const EquipmentDetailScreen = ({ navigation, route }) => {
  const { user } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const { webServer } = useContext(UserContext);
  const equipmentId = route?.params?.equipmentId ?? route?.params?.equipment?.uid;
  const [equipment, setEquipment] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchEquipment = async () => {
      setIsLoading(true);
      setError('');
      setNotFound(false);

      try {
        const response = await fetch(`${webServer}/api/v1/gyms/${user.gym_id}/equipment/${equipmentId}`, {
          headers: {
            Authorization: "Bearer " + tokens.access_token,
          },
        });

        if (response.status === 404) {
          setNotFound(true);
          return;
        }

        const data = await response.json();

        if (response.status === 200) {
          setEquipment(data.data);
          setSelectedImageIndex(0);
        }
        else {
          console.log("Access token expired, requesting new one - useEffect()");

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
        console.log('EquipmentDetailScreen equipment error: ', error);
        setError('Unable to load equipment. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (equipmentId) {
      fetchEquipment();
    } else {
      setIsLoading(false);
      setNotFound(true);
    }
  }, [tokens?.access_token, tokens?.refresh_token, equipmentId]);

  const handleEditPress = () => {
    // EquipmentEditScreen has not been built yet. Guard the navigation so this
    // handler is ready to use as soon as that screen/route is registered.
    const availableRoutes = navigation.getState?.()?.routeNames ?? [];

    if (availableRoutes.includes('EquipmentEditScreen')) {
      navigation.navigate('EquipmentEditScreen', { equipment });
    } else {
      console.log('EquipmentEditScreen route is not registered yet. Equipment:', equipment);
    }
  };

  const images = Array.isArray(equipment?.images) ? equipment.images : [];
  const orderedImages = images.length > 0
    ? [...images].sort((a, b) => (b?.is_primary ? 1 : 0) - (a?.is_primary ? 1 : 0))
    : [];
  const selectedImage = orderedImages[selectedImageIndex]?.image_url || orderedImages[0]?.image_url || null;

  const detailRows = [
    { label: 'Category', value: equipment?.equipment_category_name },
    { label: 'Brand', value: equipment?.brand },
    { label: 'Model', value: equipment?.model },
    { label: 'Quantity', value: equipment?.quantity },
    { label: 'Color', value: equipment?.color },
    { label: 'Location', value: equipment?.location },
    { label: 'Serial Number', value: equipment?.serial_number },
    { label: 'Asset Tag', value: equipment?.asset_tag },
    { label: 'Purchase Date', value: equipment?.purchase_date },
    { label: 'Purchase Price', value: equipment?.purchase_price },
    { label: 'Warranty Expiration', value: equipment?.warranty_expiration_date },
    { label: 'Status', value: equipment?.status },
    { label: 'Condition', value: equipment?.equipment_condition },
    { label: 'Maintenance Interval', value: equipment?.maintenance_interval_days ? `${equipment.maintenance_interval_days} days` : null },
  ].filter((row) => row.value !== null && row.value !== undefined && row.value !== '');

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => navigation.goBack()} />
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.editIconButton}
              onPress={handleEditPress}
              activeOpacity={0.8}
            >
              <Feather name="edit-2" color={AppColors.blue} size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={AppColors.blue} style={styles.loadingIndicator} />
        ) : notFound ? (
          <View style={styles.centeredMessage}>
            <Text style={styles.errorText}>This equipment could not be found.</Text>
          </View>
        ) : error ? (
          <View style={styles.centeredMessage}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.body}>
              <View>
                <View style={styles.heroImageContainer}>
                  {selectedImage ? (
                    <Image
                      style={styles.heroImage}
                      source={{ uri: selectedImage }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.heroImagePlaceholder}>
                      <Feather name="image" color={AppColors.grey2} size={48} />
                    </View>
                  )}
                </View>
                {orderedImages.length > 1 && (
                  <View style={styles.heroImageThumbnails}>
                    {orderedImages.map((image, index) => (
                      <TouchableOpacity key={`${image?.image_url || index}`} onPress={() => setSelectedImageIndex(index)}>
                        <Image
                          style={[
                            styles.thumbnail,
                            selectedImageIndex === index && styles.selectedThumbnail,
                          ]}
                          source={{ uri: image?.image_url || null }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.content}>
                <Text style={styles.equipmentTitle}>{equipment?.title ?? 'Untitled Equipment'}</Text>

                {equipment?.description ? (
                  <View style={styles.descriptionBlock}>
                    <Text style={styles.formLabel}>Description:</Text>
                    <Text style={styles.equipmentDesc}>{equipment.description}</Text>
                  </View>
                ) : null}

                <View style={styles.detailsCard}>
                  {detailRows.map((row) => (
                    <View key={row.label} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{row.label}</Text>
                      <Text style={styles.detailValue}>{String(row.value)}</Text>
                    </View>
                  ))}
                </View>

                {equipment?.notes ? (
                  <View style={styles.descriptionBlock}>
                    <Text style={styles.formLabel}>Notes:</Text>
                    <Text style={styles.equipmentDesc}>{equipment.notes}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  )
}

export default EquipmentDetailScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
  editIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    backgroundColor: AppColors.grey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    marginTop: 32,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    color: AppColors.red,
    fontSize: 14,
    textAlign: 'center',
  },
  scrollView: {},
  scrollContent: {
    paddingBottom: 40,
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 24,
  },
  heroImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heroImage: {
    width: 232,
    height: 232,
    borderRadius: 12,
  },
  heroImagePlaceholder: {
    width: 232,
    height: 232,
    borderRadius: 12,
    backgroundColor: AppColors.grey,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageThumbnails: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  thumbnail: {
    width: 56,
    height: 56,
    marginRight: 8,
    borderRadius: 8,
  },
  selectedThumbnail: {
    borderWidth: 2,
    borderColor: AppColors.blue,
  },
  content: {
    marginTop: 24,
  },
  equipmentTitle: {
    fontSize: 20,
    color: AppColors.blue,
  },
  descriptionBlock: {
    marginTop: 16,
    marginBottom: 8,
  },
  formLabel: {
    marginBottom: 8,
  },
  equipmentDesc: {
    lineHeight: 24,
    color: '#333',
  },
  detailsCard: {
    marginTop: 20,
    backgroundColor: AppColors.grey,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    borderRadius: 12,
    padding: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    color: AppColors.grey2,
    fontSize: 13,
  },
  detailValue: {
    color: AppColors.blue,
    fontSize: 13,
  },
})
