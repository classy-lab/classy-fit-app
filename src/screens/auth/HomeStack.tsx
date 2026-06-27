// @ts-nocheck
import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import DashboardScreen from './DashboardScreen'
// ... other screens in the Home stack

const DashboardStack = createStackNavigator()

const HomeStack = () => {
  return (
    <DashboardStack.Navigator>
      <DashboardStack.Screen name="Home" component={DashboardScreen} />
      {/* Other screens that should be accessible from Home, while keeping the tab bar hidden if pushed in the root stack */}
    </DashboardStack.Navigator>
  )
}

export default HomeStack