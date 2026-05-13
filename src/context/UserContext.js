// UserContext.js
import React, { createContext, useState, useContext } from 'react';

export const UserContext = createContext(null);

// export const UserProvider = ({ children }) => {
//   // Variables to store user object and login status for app
//   // const [darkMode, setDarkMode] = useState(true);
//   const {user, setUser} = useState(null);
//   const {tokens, setTokens} = useState('vishal & sarah');

//   const toggleTheme = () => {
//     setDarkMode(prev => !prev);
//   };

//   return (
//     <UserContext.Provider
//       value={{
//         tokens,
//         setTokens,
//         user,
//         setUser,
//         // darkMode, 
//         // toggleTheme
//       }}
//     >
//       {children}
//     </UserContext.Provider>
//   );
// };
