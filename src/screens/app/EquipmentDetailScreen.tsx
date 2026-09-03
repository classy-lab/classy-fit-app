// @ts-nocheck
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native'
import { useState, useCallback, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useFocusEffect } from '@react-navigation/native'
import RenderHtml from 'react-native-render-html'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'

const resolveEquipmentImageUri = (webServer, imageUrl) => {
  const normalized = String(imageUrl ?? '').trim();
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized) || normalized.startsWith('file://')) {
    return normalized;
  }
  return `${webServer}/api/${normalized.replace(/^\/?(api\/)?/, '')}`;
};

const buildImageSlots = (images = [], webServer) => {
  const sorted = [...images].sort((a, b) => Number(a?.sort_order ?? 999) - Number(b?.sort_order ?? 999));
  const slots = sorted.slice(0, 5).map((img, i) => ({
    id: `existing-${img?.uid || i}`,
    isPlaceholder: false,
    source: { uri: resolveEquipmentImageUri(webServer, img?.image_url) },
  }));
  
  for (let i = slots.length; i < 5; i++) {
    slots.push({ id: `placeholder-${i}`, isPlaceholder: true });
  }
  return slots;
};

const EquipmentDetailScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions()
  const { user } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const { webServer } = useContext(UserContext);
  const equipmentId = route?.params?.equipmentId ?? route?.params?.equipment?.uid;
  const [equipment, setEquipment] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useFocusEffect(
    useCallback(() => {
    const fetchEquipment = async () => {
      setIsLoading(true);
      setError('');
      setNotFound(false);

      try {
        if (!equipmentId) {
          setIsLoading(false);
          setNotFound(true);
          return;
        }

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
        console.log('EquipmentDetailScreen equipment error: ', error);
        setError('Unable to load equipment. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEquipment();
    }, [tokens?.access_token, tokens?.refresh_token, equipmentId, user?.gym_id, webServer, setTokens])
  );

  const handleEditPress = () => {
    const availableRoutes = navigation.getState?.()?.routeNames ?? [];

    if (availableRoutes.includes('EquipmentEditScreen')) {
      navigation.navigate('EquipmentEditScreen', { equipmentId, equipment });
    } else {
      console.log('EquipmentEditScreen route is not registered yet. Equipment:', equipment);
    }
  };

  const images = Array.isArray(equipment?.images) ? equipment.images : [];
  const imageSlots = buildImageSlots(images, webServer);
  const selectedImage = resolveEquipmentImageUri(
    webServer,
    imageSlots[selectedImageIndex]?.source?.uri || imageSlots[0]?.source?.uri
  );

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
                {imageSlots.length > 1 && (
                  <View style={styles.heroImageThumbnails}>
                    {imageSlots.map((image, index) => (
                      <TouchableOpacity key={image.id} onPress={() => setSelectedImageIndex(index)}>
                        {image.isPlaceholder ? (
                          <View
                            style={[
                              styles.thumbnail,
                              styles.placeholderThumbnail,
                              selectedImageIndex === index && styles.selectedThumbnail,
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={image.iconName || 'image-outline'}
                              size={24}
                              color={AppColors.blue}
                            />
                          </View>
                        ) : (
                          <Image
                            style={[
                              styles.thumbnail,
                              selectedImageIndex === index && styles.selectedThumbnail,
                            ]}
                            source={{ uri: image.source?.uri }}
                            resizeMode="cover"
                          />
                        )}
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
                    <RenderHtml
                      contentWidth={width - 48}
                      source={{ html: equipment.description || '<p>No description available.</p>' }}
                      tagsStyles={tagsStyles}
                      baseStyle={styles.descriptionText}
                    />
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
                    <RenderHtml
                      contentWidth={width - 48}
                      source={{ html: equipment.notes || '<p>No notes available.</p>' }}
                      tagsStyles={tagsStyles}
                      baseStyle={styles.descriptionText}
                    />
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

const tagsStyles = {
  p: {
    color: AppColors.primary,
    lineHeight: 20,
    marginBottom: 10,
  },
  h1: {
    color: '#111111',
    marginBottom: 15,
  },
  h2: {
    color: '#333333',
    marginBottom: 12,
  },
  h3: {
    color: '#555555',
    marginBottom: 10,
  },
  ul: {
    marginBottom: 10,
  },
  li: {
    color: AppColors.primary,
    lineHeight: 20,
  },
  b: {
    fontWeight: 'bold',
  },
  strong: {
    fontWeight: 'bold',
  },
  i: {
    fontStyle: 'italic',
  },
  em: {
    fontStyle: 'italic',
  },
  u: {
    textDecorationLine: 'underline',
  },
  s: {
    textDecorationLine: 'line-through',
  },
  del: {
    textDecorationLine: 'line-through',
  },
}

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
  placeholderThumbnail: {
    backgroundColor: AppColors.grey,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    justifyContent: 'center',
    alignItems: 'center',
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
  descriptionText: {
    lineHeight: 24,
    color: AppColors.primary,
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
