import React, { useContext } from 'react'
import { UserContext } from '../../context/UserContext'
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { AppColors } from '../../styles/colors'

const SignOut = () => {
    const { user, setUser } = useContext(UserContext);
    const { tokens, setTokens } = useContext(UserContext);
    const { isLoggedIn, setIsLoggedIn } = useContext(UserContext);

  return (
    <TouchableOpacity onPress={() => { 
        console.log('signout pressed'); 
        setUser(null);          // store token payload user info
        setIsLoggedIn('false'); // set loggedIn status to true
    }}>
        <View style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
            <View style={styles.circle}>
            <MaterialIcons name="logout" color={AppColors.white} size={16} />
            </View>
        </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
    signOut: {
        // borderWidth: 1, borderColor: 'red',
        flexDirection: 'row',
        alignItems: 'center',
      },
      signOutText: {
        marginRight: 4,
        color: AppColors.blue,
        fontSize: 14
      },
      circle: {
        width: 30,
        height: 30,
        borderRadius: '50%',
        backgroundColor: AppColors.blue,
        justifyContent: 'center',
        alignItems: 'center',
      },
});

export default SignOut
