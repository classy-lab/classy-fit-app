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
  user_picture_url?: string;
  fname?: string;
  lname?: string;
};

const MembersScreen = ({ navigation }: { navigation: any }) => {
  const { user } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const { webServer } = useContext(UserContext);
  const [members, setMembers] = useState<Record<string, StaffMember>>({});
  const [imageCacheKey, setImageCacheKey] = useState(Date.now());
  const membersList = Object.values(members);

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

  const filteredMembers = membersList.filter(matchesSearch);

  useFocusEffect(
    useCallback(() => {
      const fetchStaffData = async () => {
        if (!user?.gym_id || !tokens?.access_token) {
          return;
        }

        try {
          const response = await fetch(`${webServer}/api/v1/gyms/${user.gym_id}/members`, {
            headers: {
              Authorization: "Bearer " + tokens.access_token,
            },
          });

          const json = await response.text();
          const obj = JSON.parse(json);

          if (response.status === 200) {
            setMembers(obj.members);
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
            <Feather
              name="arrow-left"
              color={AppColors.blue}
              size={36}
              onPress={() => {
                navigation.goBack();
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
              {/* move to separate component */}
              <View style={styles.signOut}>
                <Text style={styles.signOutText}>Add</Text>
                <View style={styles.circle}>
                  <MaterialIcons name="add" color={AppColors.white} size={16} />
                </View>
              </View>
              <SignOut />
            </View>
          </View>
          <ScrollView style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headingContainer}>
              <Text style={styles.title}>Members</Text>
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
                        onBlur={() => {
                          onBlur();
                          console.log('Search value on blur:', value);
                          handleSubmit(onSubmit)();
                        }}
                        onSubmitEditing={() => {
                          Keyboard.dismiss();
                        }}
                        onChangeText={onChange}
                        value={value}
                        placeholder="Search"
                        style={styles.inputField}
                        keyboardType="default"
                        returnKeyType="done"
                        autoCapitalize="none"
                        placeholderTextColor={AppColors.blue}
                      />
                    )}
                  />
                </View>
                {/* Render other form inputs and their corresponding error messages */}
                {errors.search && <Text style={styles.errorText}>{errors.search.message}</Text>}
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>Members</Text>
                  <Text style={styles.countText}>Count: {filteredMembers.length}</Text>
                </View>
                <View style={styles.boxes}>
                  {filteredMembers.length === 0 ? (
                    <Text style={styles.noResultsText}>No results found</Text>
                  ) :
                    (
                      filteredMembers.map((member, index) => {
                        return (
                          <TouchableOpacity key={index}>
                            <View style={styles.box}>
                              {
                                member.user_picture_url ? (
                                  <Image style={styles.image} source={{ uri: getImageUri(member.user_picture_url) }} />
                                ) : null}
                              <Text style={styles.personName}>{member.fname ?? ''} {member.lname ? member.lname[0] + '.' : ''}</Text>
                            </View>
                          </TouchableOpacity>
                        )
                      })
                    )
                  }
                </View>
                {/* <View style={styles.boxes}>
                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/headshots/jenniferHeadshot.png')} />
                    <Text style={styles.personName}>Jenniffer P.</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/headshots/patrickHeadshot.png')} />
                    <Text style={styles.personName}>Patrick P.</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/headshots/MarkS.png')} />
                    <Text style={styles.personName}>Mark S.</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/headshots/lisaM.png')} />
                    <Text style={styles.personName}>Lisa M.</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/headshots/AndronicusP.png')} />
                    <Text style={styles.personName}>Andronicus P.</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/headshots/sona.png')} />
                    <Text style={styles.personName}>Sona M.</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/headshots/lisa.png')} />
                    <Text style={styles.personName}>Sarah B.</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/headshots/andy.png')} />
                    <Text style={styles.personName}>Jenniffer P.</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/headshots/jessica.png')} />
                    <Text style={styles.personName}>Maria K.</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/headshots/candy.png')} />
                    <Text style={styles.personName}>Sarah B.</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/headshots/sam.png')} />
                    <Text style={styles.personName}>Jenniffer P.</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity>
                  <View style={styles.box}>
                    <Image style={styles.image} source={require('../../assets/images/headshots/rajesh.png')} />
                    <Text style={styles.personName}>Maria K.</Text>
                  </View>
                </TouchableOpacity>
              </View> */}
              </View>

            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </>
  )
}

export default MembersScreen

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
    // marginBottom: 16,
    // width: '100%'
  },
  boxes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 26,
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  box: {},
  image: {
    marginTop: 16,
    width: 80,
    height: 80
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
  sectionHeading: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between' },
  countText: { color: AppColors.blue },
})
