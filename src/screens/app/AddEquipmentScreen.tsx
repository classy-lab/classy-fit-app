// @ts-nocheck
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useState, useContext, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { AppColors } from "../../styles/colors";
import { UserContext } from "../../context/UserContext";
import { RichEditor, RichToolbar, actions } from "react-native-pell-rich-editor";
import ImagePicker from "react-native-image-crop-picker";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { SelectList } from "react-native-dropdown-select-list";
import DateOfBirthField from "../../../src/components/forms/input_fields/DateOfBirthField";
import {
  showMessage,
  hideMessage,
} from "react-native-flash-message";

const MAX_EQUIPMENT_IMAGE_BYTES = 10 * 1024 * 1024;
const EQUIPMENT_IMAGE_PLACEHOLDER_COUNT = 5;

/*
 * Hard-coded for MVP.
 *
 * IMPORTANT:
 * These keys must match equipment_categories.uid in the database:
 *
 * 1 = Cardio
 * 2 = Strength
 * 3 = Free Weights
 */
const equipmentCategoryData = [
  { key: "1", value: "Cardio" },
  { key: "2", value: "Strength" },
  { key: "3", value: "Free Weights" },
];

const equipmentStatusData = [
  { key: "active", value: "Active" },
  { key: "maintenance", value: "Maintenance" },
  { key: "out_of_service", value: "Out of Service" },
  { key: "retired", value: "Retired" },
];

const equipmentConditionData = [
  { key: "excellent", value: "Excellent" },
  { key: "good", value: "Good" },
  { key: "fair", value: "Fair" },
  { key: "poor", value: "Poor" },
];

const addEquipmentSchema = yup.object({
  equipment_category_uid: yup
    .string()
    .required("Category is required"),

  title: yup
    .string()
    .trim()
    .required("Title is required"),

  description: yup.string().nullable(),

  brand: yup.string().nullable(),

  model: yup.string().nullable(),

  serial_number: yup.string().nullable(),

  asset_tag: yup.string().nullable(),

  quantity: yup
    .string()
    .required("Quantity is required")
    .test(
      "positive-integer",
      "Quantity must be at least 1",
      (value) => {
        if (!value) return false;

        const quantity = Number(value);

        return Number.isInteger(quantity) && quantity >= 1;
      }
    ),

  color: yup.string().nullable(),

  location: yup.string().nullable(),

  purchase_date: yup.string().nullable(),

  purchase_price: yup
    .string()
    .nullable()
    .test(
      "non-negative-price",
      "Purchase price cannot be negative",
      (value) => {
        if (!value) return true;

        const price = Number(value);

        return !Number.isNaN(price) && price >= 0;
      }
    ),

  warranty_expiration_date: yup.string().nullable(),

  status: yup
    .string()
    .oneOf(
      ["active", "maintenance", "out_of_service", "retired"],
      "Invalid status"
    )
    .required("Status is required"),

  equipment_condition: yup
    .string()
    .nullable()
    .test(
      "valid-condition",
      "Invalid equipment condition",
      (value) => {
        if (!value) return true;

        return ["excellent", "good", "fair", "poor"].includes(value);
      }
    ),

  maintenance_interval_days: yup
    .string()
    .nullable()
    .test(
      "positive-maintenance-interval",
      "Maintenance interval must be greater than 0",
      (value) => {
        if (!value) return true;

        const days = Number(value);

        return Number.isInteger(days) && days > 0;
      }
    ),

  notes: yup.string().nullable(),
});

type AddEquipmentFormValues = {
  equipment_category_uid: string;
  title: string;
  description: string;
  brand: string;
  model: string;
  serial_number: string;
  asset_tag: string;
  quantity: string;
  color: string;
  location: string;
  purchase_date: string;
  purchase_price: string;
  warranty_expiration_date: string;
  status: string;
  equipment_condition: string;
  maintenance_interval_days: string;
  notes: string;
};

const AddEquipmentScreen = ({ navigation }) => {
  const { user } = useContext(UserContext);
  const { tokens } = useContext(UserContext);
  const { webServer } = useContext(UserContext);

  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const richText = useRef(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddEquipmentFormValues>({
    resolver: yupResolver(addEquipmentSchema),

    defaultValues: {
      equipment_category_uid: "",
      title: "",
      description: "",
      brand: "",
      model: "",
      serial_number: "",
      asset_tag: "",
      quantity: "1",
      color: "",
      location: "",
      purchase_date: "",
      purchase_price: "",
      warranty_expiration_date: "",
      status: "active",
      equipment_condition: "",
      maintenance_interval_days: "",
      notes: "",
    },
  });

  const [equipmentImages, setEquipmentImages] = useState(
    Array.from(
      { length: EQUIPMENT_IMAGE_PLACEHOLDER_COUNT },
      (_, index) => ({
        id: `placeholder - ${index} `,
        iconName: "image-outline",
        isPlaceholder: true,
      })
    )
  );

  const pickImage = async (targetIndex: number) => {
    try {
      const selectedAsset = await ImagePicker.openPicker({
        cropping: true,
        width: 380,
        height: 380,
        compressImageQuality: 0.7,
        mediaType: "photo",
      });

      const mimeType = String(
        selectedAsset?.mime || ""
      ).toLowerCase();

      const fileName = String(
        selectedAsset?.filename ||
        selectedAsset?.path ||
        ""
      ).toLowerCase();

      const fileSize = Number(
        selectedAsset?.fileSize ??
        selectedAsset?.size ??
        0
      );

      const hasAllowedExtension =
        fileName.endsWith(".jpg") ||
        fileName.endsWith(".jpeg") ||
        fileName.endsWith(".png") ||
        fileName.endsWith(".webp");

      const hasAllowedMimeType =
        mimeType === "image/jpeg" ||
        mimeType === "image/png" ||
        mimeType === "image/webp";

      if (!hasAllowedMimeType && !hasAllowedExtension) {
        Alert.alert(
          "Unsupported Format",
          "Please select a JPEG, PNG, or WebP image."
        );

        return;
      }

      if (fileSize > MAX_EQUIPMENT_IMAGE_BYTES) {
        Alert.alert(
          "Image Too Large",
          "Please select an image that is 10 MB or less."
        );

        return;
      }

      const nextImage = {
        id: `picked - ${Date.now()} -${targetIndex} `,
        isPlaceholder: false,
        source: {
          uri: selectedAsset.path,
        },
        image_url: selectedAsset.path,
        localAsset: selectedAsset,
      };

      setEquipmentImages((previousImages) => {
        const nextImages = [...previousImages];

        nextImages[targetIndex] = nextImage;

        return nextImages;
      });

      setSelectedImageIndex(targetIndex);
    } catch (error) {
      console.log(
        "Equipment image selection cancelled or failed:",
        error
      );
    }
  };

  const onSubmit = async (
    formData: AddEquipmentFormValues
  ) => {
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      const requestPayload = new FormData();

      /*
       * Category
       *
       * The SelectList displays the category name but because
       * save="key" is used, formData.equipment_category_uid
       * contains 1, 2, or 3.
       */
      requestPayload.append(
        "equipment_category_uid",
        String(
          formData.equipment_category_uid ?? ""
        ).trim()
      );

      requestPayload.append(
        "title",
        String(formData.title ?? "").trim()
      );

      requestPayload.append(
        "description",
        String(descriptionHtml ?? "").trim()
      );

      requestPayload.append(
        "brand",
        String(formData.brand ?? "").trim()
      );

      requestPayload.append(
        "model",
        String(formData.model ?? "").trim()
      );

      requestPayload.append(
        "serial_number",
        String(formData.serial_number ?? "").trim()
      );

      requestPayload.append(
        "asset_tag",
        String(formData.asset_tag ?? "").trim()
      );

      requestPayload.append(
        "quantity",
        String(formData.quantity ?? "1").trim()
      );

      requestPayload.append(
        "color",
        String(formData.color ?? "").trim()
      );

      requestPayload.append(
        "location",
        String(formData.location ?? "").trim()
      );

      /*
       * DateOfBirthField provides the date value to
       * React Hook Form. This should be YYYY-MM-DD,
       * which can be submitted directly to MariaDB DATE.
       */
      requestPayload.append(
        "purchase_date",
        String(formData.purchase_date ?? "").trim()
      );

      requestPayload.append(
        "purchase_price",
        String(formData.purchase_price ?? "").trim()
      );

      requestPayload.append(
        "warranty_expiration_date",
        String(
          formData.warranty_expiration_date ?? ""
        ).trim()
      );

      requestPayload.append(
        "status",
        String(formData.status ?? "active").trim()
      );

      requestPayload.append(
        "equipment_condition",
        String(
          formData.equipment_condition ?? ""
        ).trim()
      );

      requestPayload.append(
        "maintenance_interval_days",
        String(
          formData.maintenance_interval_days ?? ""
        ).trim()
      );

      requestPayload.append(
        "notes",
        String(formData.notes ?? "").trim()
      );

      const newImages = equipmentImages
        .filter(
          (image) =>
            !image?.isPlaceholder &&
            image?.localAsset?.path
        )
        .map((image, index) => {
          const localAsset = image.localAsset;

          const mimeType =
            localAsset?.mime || "image/jpeg";

          let extension = "jpg";

          if (mimeType === "image/png") {
            extension = "png";
          }

          if (mimeType === "image/webp") {
            extension = "webp";
          }

          const fileName =
            localAsset?.filename ||
            `equipment - image - ${index}.${extension} `;

          return {
            uri: localAsset.path,
            type: mimeType,
            name: fileName,
          };
        });

      newImages.forEach((imageFile) => {
        requestPayload.append(
          "images[]",
          imageFile as any
        );
      });

      console.log(
        "Submitting new equipment:",
        {
          category:
            formData.equipment_category_uid,
          title: formData.title,
          purchaseDate:
            formData.purchase_date,
          imageCount: newImages.length,
          imageNames: newImages.map(
            (image) => image.name
          ),
        }
      );

      const response = await fetch(
        `${webServer} /api/v1 / gyms / ${user.gym_id}/equipment`,
        {
          method: "POST",

          headers: {
            Authorization:
              "Bearer " + tokens.access_token,
          },

          body: requestPayload,
        }
      );

      const rawResponse =
        await response.text();

      let obj = {};

      try {
        obj = rawResponse
          ? JSON.parse(rawResponse)
          : {};
      } catch (error) {
        console.log(
          "Could not parse equipment API response:",
          rawResponse
        );
      }

      console.log(
        "Equipment API response:",
        rawResponse
      );

      if (
        response.status === 201 ||
        response.status === 200
      ) {
        showMessage({
          message: "Success",

          description:
            obj?.message ||
            "Equipment created successfully.",

          type: "success",
          icon: "success",
          duration: 3000,
          autoHide: true,

          onPress: () =>
            hideMessage(),
        });

        if (navigation.canGoBack()) {
          navigation.goBack();
        }

        return;
      }

      showMessage({
        message: "Action Failed",

        description:
          obj?.message ||
          "Something went wrong while creating this equipment.",

        type: "danger",
        icon: "danger",
        autoHide: false,
      });
    } catch (error) {
      console.log(
        "Create equipment request failed:",
        error
      );

      showMessage({
        message: "Action Failed",
        description:
          "Network error while creating equipment.",
        type: "danger",
        icon: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedImage =
    equipmentImages?.[
      selectedImageIndex
    ]?.source?.uri || null;

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Feather
            name="arrow-left"
            color={AppColors.blue}
            size={36}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={styles.headingContainer}
          >
            <Text style={styles.title}>
              Add Equipment
            </Text>
          </View>

          <View style={styles.body}>
            {/* =====================================================
                EQUIPMENT PHOTOS
            ===================================================== */}

            <View>
              <View
                style={
                  styles.heroImageContainer
                }
              >
                {selectedImage ? (
                  <Image
                    style={styles.heroImage}
                    source={{
                      uri: selectedImage,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={
                      styles.placeholderHero
                    }
                  >
                    <MaterialCommunityIcons
                      name="image-outline"
                      size={88}
                      color={AppColors.blue}
                    />
                  </View>
                )}
              </View>

              <View
                style={
                  styles.heroImageThumbnails
                }
              >
                {equipmentImages.map(
                  (image, index) => (
                    <TouchableOpacity
                      key={
                        image?.id || index
                      }
                      onPress={() => {
                        setSelectedImageIndex(
                          index
                        );

                        pickImage(index);
                      }}
                    >
                      {image.isPlaceholder ? (
                        <View
                          style={[
                            styles.thumbnail,
                            styles.placeholderThumbnail,
                            selectedImageIndex ===
                            index &&
                            styles.selectedThumbnail,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="image-outline"
                            size={24}
                            color={
                              AppColors.blue
                            }
                          />
                        </View>
                      ) : (
                        <Image
                          style={[
                            styles.thumbnail,
                            selectedImageIndex ===
                            index &&
                            styles.selectedThumbnail,
                          ]}
                          source={
                            image.source
                          }
                          resizeMode="cover"
                        />
                      )}
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            <View style={styles.content}>
              {/* =====================================================
                  BASIC INFORMATION
              ===================================================== */}

              <Text
                style={styles.sectionTitle}
              >
                Basic Information
              </Text>

              <View style={styles.inputField}>
                <Text
                  style={styles.formLabel}
                >
                  Category:
                </Text>

                <Controller
                  control={control}
                  name="equipment_category_uid"
                  render={({
                    field: {
                      onChange,
                      value,
                    },
                  }) => {
                    const selectedCategory =
                      equipmentCategoryData.find(
                        (item) =>
                          item.key ===
                          String(value)
                      );

                    return (
                      <SelectList
                        setSelected={(
                          selectedValue
                        ) =>
                          onChange(
                            selectedValue
                          )
                        }
                        data={
                          equipmentCategoryData
                        }
                        save="key"
                        placeholder="Select Category"
                        defaultOption={
                          selectedCategory
                            ? {
                              key:
                                selectedCategory.key,
                              value:
                                selectedCategory.value,
                            }
                            : undefined
                        }
                        boxStyles={{
                          borderColor:
                            AppColors.textInputBorderColor,
                          borderWidth: 1,
                          paddingHorizontal: 12,
                          backgroundColor:
                            AppColors.grey,
                          borderRadius: 8,
                        }}
                        dropdownStyles={{
                          borderColor:
                            AppColors.textInputBorderColor,
                          borderWidth: 1,
                          marginTop: 8,
                          backgroundColor:
                            AppColors.white,
                        }}
                      />
                    );
                  }}
                />

                {errors
                  .equipment_category_uid && (
                    <Text
                      style={
                        styles.errorText
                      }
                    >
                      {
                        errors
                          .equipment_category_uid
                          .message
                      }
                    </Text>
                  )}
              </View>

              <View style={styles.inputField}>
                <Text
                  style={styles.formLabel}
                >
                  Title:
                </Text>

                <Controller
                  control={control}
                  name="title"
                  render={({
                    field: {
                      onChange,
                      value,
                    },
                  }) => (
                    <TextInput
                      style={
                        styles.textField
                      }
                      value={value}
                      onChangeText={
                        onChange
                      }
                      placeholder="Enter equipment title"
                      placeholderTextColor={
                        AppColors.grey2
                      }
                      autoCapitalize="words"
                      returnKeyType="done"
                    />
                  )}
                />

                {errors.title && (
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {
                      errors.title
                        .message
                    }
                  </Text>
                )}
              </View>

              <View
                style={
                  styles.descriptionBlock
                }
              >
                <Text
                  style={styles.formLabel}
                >
                  Description:
                </Text>

                <RichToolbar
                  editor={richText}
                  style={
                    styles.richToolbar
                  }
                  iconTint={
                    AppColors.blue
                  }
                  selectedIconTint={
                    AppColors.white
                  }
                  selectedButtonStyle={
                    styles.richToolbarSelectedButton
                  }
                  actions={[
                    actions.setBold,
                    actions.setItalic,
                    actions.setUnderline,
                    actions.setStrikethrough,
                    actions.insertBulletsList,
                    actions.insertOrderedList,
                    actions.insertLink,
                    actions.undo,
                    actions.redo,
                  ]}
                />

                <View
                  style={
                    styles.richEditorContainer
                  }
                >
                  <RichEditor
                    ref={richText}
                    useContainer={false}
                    style={
                      styles.richEditor
                    }
                    initialContentHTML={
                      descriptionHtml
                    }
                    initialHeight={36}
                    placeholder="Enter description"
                    editorStyle={{
                      backgroundColor:
                        AppColors.grey,
                      color:
                        AppColors.blue,
                      placeholderColor:
                        AppColors.grey2,
                      contentCSSText:
                        "font-size: 14px; line-height: 18px; min-height: 28px;",
                    }}
                    onChange={(value) =>
                      setDescriptionHtml(
                        value
                      )
                    }
                  />
                </View>
              </View>

              <EquipmentTextField
                control={control}
                name="brand"
                label="Brand:"
                placeholder="Enter brand"
              />

              <EquipmentTextField
                control={control}
                name="model"
                label="Model:"
                placeholder="Enter model"
              />

              <EquipmentTextField
                control={control}
                name="serial_number"
                label="Serial Number:"
                placeholder="Enter serial number"
              />

              <EquipmentTextField
                control={control}
                name="asset_tag"
                label="Asset Tag:"
                placeholder="Enter asset tag"
              />

              <EquipmentTextField
                control={control}
                name="quantity"
                label="Quantity:"
                placeholder="Enter quantity"
                keyboardType="number-pad"
                error={
                  errors.quantity
                    ?.message
                }
              />

              <EquipmentTextField
                control={control}
                name="color"
                label="Color:"
                placeholder="Enter color"
              />

              <EquipmentTextField
                control={control}
                name="location"
                label="Location:"
                placeholder="e.g. Strength Area"
              />

              {/* =====================================================
                  PURCHASE INFORMATION
              ===================================================== */}

              <Text
                style={styles.sectionTitle}
              >
                Purchase Information
              </Text>

              <View style={styles.inputField}>
                <Text
                  style={styles.formLabel}
                >
                  Purchase Date:
                </Text>

                <Controller
                  control={control}
                  name="purchase_date"
                  render={({
                    field: {
                      onChange,
                      onBlur,
                      value,
                    },
                  }) => (
                    <DateOfBirthField
                      value={value}
                      onChange={
                        onChange
                      }
                      onBlur={onBlur}
                    />
                  )}
                />

                {errors.purchase_date && (
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {
                      errors
                        .purchase_date
                        .message
                    }
                  </Text>
                )}
              </View>

              <EquipmentTextField
                control={control}
                name="purchase_price"
                label="Purchase Price:"
                placeholder="Enter purchase price"
                keyboardType="decimal-pad"
                error={
                  errors.purchase_price
                    ?.message
                }
              />

              <View style={styles.inputField}>
                <Text style={styles.formLabel}>
                  Warranty Expiration Date:
                </Text>

                <Controller
                  control={control}
                  name="warranty_expiration_date"
                  render={({
                    field: {
                      onChange,
                      onBlur,
                      value,
                    },
                  }) => (
                    <DateOfBirthField
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />

                {errors.warranty_expiration_date && (
                  <Text style={styles.errorText}>
                    {errors.warranty_expiration_date.message}
                  </Text>
                )}
              </View>

              {/* =====================================================
                  STATUS / CONDITION
              ===================================================== */}

              <Text
                style={styles.sectionTitle}
              >
                Status & Condition
              </Text>

              <View style={styles.inputField}>
                <Text
                  style={styles.formLabel}
                >
                  Status:
                </Text>

                <Controller
                  control={control}
                  name="status"
                  render={({
                    field: {
                      onChange,
                      value,
                    },
                  }) => {
                    const selectedStatus =
                      equipmentStatusData.find(
                        (item) =>
                          item.key ===
                          value
                      );

                    return (
                      <SelectList
                        setSelected={
                          onChange
                        }
                        data={
                          equipmentStatusData
                        }
                        save="key"
                        placeholder="Select Status"
                        defaultOption={
                          selectedStatus
                        }
                        boxStyles={
                          styles.selectBox
                        }
                        dropdownStyles={
                          styles.selectDropdown
                        }
                      />
                    );
                  }}
                />
              </View>

              <View style={styles.inputField}>
                <Text
                  style={styles.formLabel}
                >
                  Condition:
                </Text>

                <Controller
                  control={control}
                  name="equipment_condition"
                  render={({
                    field: {
                      onChange,
                      value,
                    },
                  }) => {
                    const selectedCondition =
                      equipmentConditionData.find(
                        (item) =>
                          item.key ===
                          value
                      );

                    return (
                      <SelectList
                        setSelected={
                          onChange
                        }
                        data={
                          equipmentConditionData
                        }
                        save="key"
                        placeholder="Select Condition"
                        defaultOption={
                          selectedCondition
                        }
                        boxStyles={
                          styles.selectBox
                        }
                        dropdownStyles={
                          styles.selectDropdown
                        }
                      />
                    );
                  }}
                />
              </View>

              <EquipmentTextField
                control={control}
                name="maintenance_interval_days"
                label="Maintenance Interval (Days):"
                placeholder="e.g. 90"
                keyboardType="number-pad"
                error={
                  errors
                    .maintenance_interval_days
                    ?.message
                }
              />

              <View style={styles.inputField}>
                <Text
                  style={styles.formLabel}
                >
                  Notes:
                </Text>

                <Controller
                  control={control}
                  name="notes"
                  render={({
                    field: {
                      onChange,
                      value,
                    },
                  }) => (
                    <TextInput
                      style={
                        styles.notesField
                      }
                      value={value}
                      onChangeText={
                        onChange
                      }
                      placeholder="Enter notes"
                      placeholderTextColor={
                        AppColors.grey2
                      }
                      multiline
                      textAlignVertical="top"
                    />
                  )}
                />
              </View>

              {/* =====================================================
                  BUTTONS
              ===================================================== */}

              <View style={styles.row}>
                <TouchableOpacity
                  style={[
                    styles.loginBtn,
                    isSubmitting && {
                      opacity: 0.5,
                    },
                  ]}
                  disabled={
                    isSubmitting
                  }
                  onPress={handleSubmit(
                    onSubmit
                  )}
                >
                  <Text
                    style={
                      styles.loginBtnText
                    }
                  >
                    {isSubmitting
                      ? "Creating..."
                      : "Create Equipment"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.registerBtn
                  }
                  disabled={
                    isSubmitting
                  }
                  onPress={() => {
                    if (
                      navigation.canGoBack()
                    ) {
                      navigation.goBack();
                    }
                  }}
                >
                  <Text
                    style={
                      styles.registerBtnText
                    }
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

/*
 * Small reusable component used only inside this screen.
 * Keeps all of the standard TextInput fields consistent.
 */
const EquipmentTextField = ({
  control,
  name,
  label,
  placeholder,
  keyboardType = "default",
  error = null,
}) => {
  return (
    <View style={styles.inputField}>
      <Text style={styles.formLabel}>
        {label}
      </Text>

      <Controller
        control={control}
        name={name}
        render={({
          field: {
            onChange,
            value,
          },
        }) => (
          <TextInput
            style={styles.textField}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={
              AppColors.grey2
            }
            keyboardType={
              keyboardType
            }
            returnKeyType="done"
          />
        )}
      />

      {error ? (
        <Text style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

export default AddEquipmentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },

  navs: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 24,
    paddingRight: 24,
  },

  headingContainer: {
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    color: AppColors.blue,
    fontSize: 32,
    marginTop: 60,
  },

  body: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 24,
  },

  scrollView: {},

  scrollContent: {
    paddingBottom: 24,
  },

  heroImageContainer: {
    alignItems: "center",
    marginBottom: 16,
  },

  heroImage: {
    width: 232,
    height: 232,
    borderRadius: 12,
  },

  placeholderHero: {
    width: 232,
    height: 232,
    borderRadius: 12,
    backgroundColor: AppColors.grey,
    borderWidth: 1,
    borderColor:
      AppColors.textInputBorderColor,
    justifyContent: "center",
    alignItems: "center",
  },

  heroImageThumbnails: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    flexWrap: "wrap",
    rowGap: 8,
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
    borderColor:
      AppColors.textInputBorderColor,
    justifyContent: "center",
    alignItems: "center",
  },

  selectedThumbnail: {
    borderWidth: 2,
    borderColor: AppColors.blue,
  },

  content: {
    marginTop: 24,
  },

  sectionTitle: {
    color: AppColors.blue,
    fontSize: 20,
    marginTop: 24,
    marginBottom: 16,
  },

  descriptionBlock: {
    marginTop: 8,
    marginBottom: 16,
  },

  formLabel: {
    marginBottom: 8,
  },

  inputField: {
    marginBottom: 12,
  },

  textField: {
    marginTop: 5,
    borderWidth: 1,
    borderColor:
      AppColors.textInputBorderColor,
    backgroundColor: AppColors.grey,
    paddingLeft: 12,
    paddingRight: 12,
    height: 48,
    borderRadius: 8,
    color: AppColors.blue,
  },

  notesField: {
    marginTop: 5,
    borderWidth: 1,
    borderColor:
      AppColors.textInputBorderColor,
    backgroundColor: AppColors.grey,
    padding: 12,
    minHeight: 120,
    borderRadius: 8,
    color: AppColors.blue,
  },

  selectBox: {
    borderColor:
      AppColors.textInputBorderColor,
    borderWidth: 1,
    paddingHorizontal: 12,
    backgroundColor: AppColors.grey,
    borderRadius: 8,
  },

  selectDropdown: {
    borderColor:
      AppColors.textInputBorderColor,
    borderWidth: 1,
    marginTop: 8,
    backgroundColor: AppColors.white,
  },

  errorText: {
    color: AppColors.red || "red",
    fontSize: 12,
    marginTop: 4,
  },

  richEditorContainer: {
    height: 250,
    borderWidth: 1,
    borderColor:
      AppColors.textInputBorderColor,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: AppColors.grey,
  },

  richEditor: {
    flex: 1,
    backgroundColor: AppColors.grey,
  },

  richToolbar: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor:
      AppColors.textInputBorderColor,
    borderRadius: 8,
    backgroundColor: AppColors.grey,
  },

  richToolbarSelectedButton: {
    backgroundColor: AppColors.blue,
    borderRadius: 6,
  },

  row: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    minHeight: 120,
  },

  registerBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 248,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  registerBtnText: {
    fontSize: 16,
    color: "#fff",
  },

  loginBtn: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: AppColors.blue,
    borderRadius: 40,
    width: 248,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 8,
  },

  loginBtnText: {
    color: AppColors.blue,
    fontSize: 16,
  },
});