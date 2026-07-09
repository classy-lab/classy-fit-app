// @ts-nocheck
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Image, Keyboard, TouchableWithoutFeedback } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppColors } from '../../styles/colors'
import { Feather, MaterialIcons } from '@expo/vector-icons'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import SignOut from '../../components/utils/SignOut'
import { useFocusEffect } from '@react-navigation/native'
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useCallback, useContext, useState } from 'react'
import { UserContext } from '../../context/UserContext'

type StaffMember = {
  contact_id?: string | number;
  user_picture_url?: string;
  fname?: string;
  lname?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
};

const ContractorsScreen = ({ navigation }: { navigation: any }) => {
  const { user } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const { webServer } = useContext(UserContext);
  const [contacts, setContacts] = useState<Record<string, StaffMember>>({});
  const [imageCacheKey, setImageCacheKey] = useState(Date.now());
  const contactsList = Object.entries(contacts).map(([id, member]) => ({
    ...member,
    contact_id: member?.contact_id ?? id,
  }));

  // 1. Define the Yup validation schema
  const schema = yup.object().shape({
    search: yup.string().matches(
      /^[a-zA-Z0-9 .,]+$/,
      'Search can only contain letters, numbers, spaces, full stops, and commas'
    )
  })

  // 2. Initialize useForm with the Yup resolver
  const { control, watch, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      search: '',
    },
  })

  // 3. Define the submit handler
  const onSubmit = (data: { search: string }) => {
    // This function only runs if validation passes
    try {
      console.log('Search value:', data.search);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Search submit failed:', error);
    }
  }

  const getImageUri = (path?: string) => {
    if (!path) return '';
    const queryJoiner = path.includes('?') ? '&' : '?';
    return `${webServer}/api/${path}${queryJoiner}v=${imageCacheKey}`;
  };

  const searchQuery = (watch('search') || '').trim().toLowerCase();

  const matchesSearch = (staff: StaffMember) => {
    if (!searchQuery) return true; // If search query is empty, include all members

    const firstName = staff.fname?.toLowerCase() || '';
    const lastName = staff.lname?.toLowerCase() || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const initialsName = `${firstName} ${lastName ? `${lastName[0]}.` : ''}`.trim();

    return firstName.includes(searchQuery) ||
      lastName.includes(searchQuery) ||
      fullName.includes(searchQuery) ||
      initialsName.includes(searchQuery);
  };

  const filteredContacts = contactsList.filter(matchesSearch);

  const getDisplayName = (member: StaffMember) => {
    const fullName = `${member.fname ?? ''} ${member.lname ? member.lname[0] + '.' : ''}`.trim();
    return fullName.length > 11 ? `${fullName.slice(0, 11)}` : fullName;
  };

  useFocusEffect(
    useCallback(() => {
      const fetchStaffData = async () => {
        if (!user?.gym_id || !tokens?.access_token) {
          return;
        }

        try {
          const response = await fetch(`${webServer}/api/v1/gyms/${user.gym_id}/contacts`, {
            headers: {
              Authorization: "Bearer " + tokens.access_token,
            },
          });

          const json = await response.text();
          const obj = JSON.parse(json);

          if (response.status === 200) {
            setContacts(obj.contacts);
            setImageCacheKey(Date.now());
          }
          else {
            console.log("Access token expired, requesting new one - useFocusEffect()");

            const response = await fetch(`${webServer}/api/refresh.php`, {
              method: "POST",
              body: JSON.stringify({
                token: tokens.refresh_token,
              }),
            });

            const json = await response.text();
            const obj = JSON.parse(json);

            if (response.status == 200) {
              console.log("Got new access token and refresh token");
              setTokens((prev: any) => ({
                ...prev,
                access_token: obj.access_token,
                refresh_token: obj.refresh_token,
              }));
            }
          }
        } catch (error) {
          console.log('Failed to fetch staff data', error);
        }
      };

      fetchStaffData();
    }, [user?.gym_id, tokens?.access_token, tokens?.refresh_token, webServer, setTokens])
  );

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.container}>
          <View style={styles.navs}>
            <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
            <View style={styles.rightActions}>
              <TouchableOpacity onPress={() => { navigation.navigate('StaffTab', { screen: 'AddContactScreen' }) }} style={styles.signOut}>
                <Text style={styles.signOutText}>Add</Text>
                <View style={styles.circle}>
                  <MaterialIcons name="add" color={AppColors.white} size={16} />
                </View>
              </TouchableOpacity>
              <SignOut />
            </View>
          </View>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.headingContainer}>
              <Text style={styles.title}>Contractors</Text>
              <PinkLeafSvg style={styles.pinkLeaf} />
            </View>
            <View style={styles.body}>

              <View style={styles.fieldset}>
                <View style={styles.field}>
                  <Controller
                    control={control}
                    name="search"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={styles.inputField}
                        // onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        keyboardType="default"
                        autoCapitalize="none"
                        placeholder="Search"
                        placeholderTextColor={AppColors.blue}
                        onBlur={handleSubmit(onSubmit)}
                      />
                    )}
                  />
                </View>
                {/* Render other form inputs and their corresponding error messages */}
                {errors.search && <Text style={styles.errorText}>{errors.search.message}</Text>}
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>Contacts</Text>
                  <Text style={styles.countText}>Count: {filteredContacts.length}</Text>
                </View>
                <View style={styles.boxes}>
                  {filteredContacts.length === 0 ? (
                    <Text style={styles.noResultsText}>No results found</Text>
                  ) :
                    (
                      filteredContacts.map((member, index) => {
                        const contactId = member?.contact_id ?? String(index);
                        return (
                          <TouchableOpacity
                            key={String(contactId)}
                            onPress={() => {
                              navigation.navigate('StaffTab', {
                                screen: 'UpdateContactScreen',
                                params: {
                                  contactId,
                                  contact: member,
                                },
                              })
                            }}
                          >
                            <View style={styles.box}>
                              {
                                member.user_picture_url ? (
                                  <Image style={styles.image} source={{ uri: getImageUri(member.user_picture_url) }} />
                                ) : null}
                              <Text style={styles.personName}>{getDisplayName(member)}</Text>
                            </View>
                          </TouchableOpacity>
                        )
                      })
                    )
                  }
                </View>
              </View>

            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </>
  )
}

export default ContractorsScreen

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
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
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
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    color: AppColors.primary,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutText: {
    marginLeft: 10,
    marginRight: 4,
    color: AppColors.blue,
    fontSize: 14
  },
  errorText: {
    color: AppColors.red,
    // marginTop: 8
  },
  fieldset: {},
  field: {
    flexGrow: 1
  },
  inputField: {
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    backgroundColor: AppColors.grey,
    paddingLeft: 22,
    height: 48,
    borderRadius: 8,
    color: AppColors.blue,
    fontFamily: "Montserrat",
    fontSize: 16,
  },
  section: {
    // flexDirection: 'column',
    marginTop: 24,
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 24,
  },
  boxes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 26,
    rowGap: 26 + 16,
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  box: { width: 96, height: 96, },
  image: {
    marginTop: 16,
    width: 96,
    height: 96,
    borderRadius: 16
  },
  personName: {
    marginTop: 10,
    textAlign: 'center'
  },
  noResultsText: {
    marginTop: 12,
    color: AppColors.primary,
    fontSize: 14,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AppColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeading: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  countText: {
    color: AppColors.blue
  },
})
