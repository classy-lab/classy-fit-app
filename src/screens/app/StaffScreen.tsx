import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Image, Keyboard, TouchableWithoutFeedback } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppColors } from '../../styles/colors'
import { Feather, MaterialIcons } from '@expo/vector-icons'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import SignOut from '../../components/utils/SignOut'
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useContext, useEffect, useState } from 'react'
import { UserContext } from '../../context/UserContext'

const StaffScreen = ({ navigation }: { navigation: any }) => {
  const { user, setUser } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const { webServer } = useContext(UserContext);
  const [owners, setOwners] = useState({});
  const [trainers, setTrainers] = useState({});
  const ownersList = Object.values(owners as Record<string, { user_picture_url?: string; fname?: string }>);
  const trainersList = Object.values(trainers as Record<string, { user_picture_url?: string; fname?: string }>);;

  // 1. Define the Yup validation schema
  const schema = yup.object().shape({
    search: yup.string().required('Search field is required').matches(
      /^[a-zA-Z0-9 .,]+$/,
      'Search can only contain letters, numbers, spaces, full stops, and commas'
    )
  })

  // 2. Initialize useForm with the Yup resolver
  const { control, handleSubmit, formState: { errors } } = useForm({
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

  useEffect(() => {
    const fetchStaffData = async () => {
      const response = await fetch(`${webServer}/api/v1/gyms/${user.gym_id}/users`, {
        headers: {
          Authorization: "Bearer " + tokens.access_token,
        },
      });

      const json = await response.text();
      const obj = JSON.parse(json);

      if (response.status === 200) {
        // console.log(Object.keys(obj.owners).length);
        // console.log(Object.keys(obj.trainers).length);
        setOwners(obj.owners);
        setTrainers(obj.trainers);
      }
      else {
        console.log("Access token expired, requesting new one - useEffect()");

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
          setTokens({
            ...tokens,
            access_token: obj.access_token,
            refresh_token: obj.refresh_token,
          });
        }
      }
    }
    fetchStaffData();
  }, []);

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
          <ScrollView
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headingContainer}>
              <Text style={styles.title}>Staff</Text>
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
                        blurOnSubmit
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
                <Text style={styles.sectionTitle}>Owners</Text>
                <View style={styles.boxes}>
                  {ownersList.map((owner, index) => {
                    return (
                      <TouchableOpacity key={index}>
                        <View style={styles.box}>
                          {owner.user_picture_url ? (
                            <Image style={styles.image} source={{ uri: `${webServer}/api/${owner.user_picture_url}` }} />
                          ) : null}
                          <Text style={styles.personName}>{owner.fname ?? ''} {owner.lname ? owner.lname[0] + '.' : ''}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Trainers</Text>
                <View style={styles.boxes}>
                  {trainersList.map((trainer, index) => {
                    return (
                      <TouchableOpacity key={index}>
                        <View style={styles.box}>
                          {trainer.user_picture_url ? (
                            <Image style={styles.image} source={{ uri: `${webServer}/api/${trainer.user_picture_url}` }} />
                          ) : null}
                          <Text style={styles.personName}>{trainer.fname ?? ''} {trainer.lname ? trainer.lname[0] + '.' : ''}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })

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

export default StaffScreen

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
    fontFamily: "Montserrat",
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
    fontFamily: "Montserrat",
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
    width: '100%'
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
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AppColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
