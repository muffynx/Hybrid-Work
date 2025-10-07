import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { LogBox } from 'react-native';

import LoginScreen from './screens/Login';
import DashboardScreen from './screens/Dashboard';
import ClassMembersScreen from './screens/ClassMembers';
import PostsScreen from './screens/Posts';

// Suppress deprecated warnings
LogBox.ignoreLogs(['props.pointerEvents is deprecated']);

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          'NotoSansThai': require('./assets/fonts/NotoSansThai_SemiCondensed-Regular.ttf'),
        });
      } catch (e) {
        console.warn('Error loading fonts:', e);
      } finally {
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      }
    };

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null; // Splash screen will remain until fonts are loaded
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
        <Stack.Screen name="ClassMembers" component={ClassMembersScreen} options={{ title: 'Class Members' }} />
        <Stack.Screen name="Posts" component={PostsScreen} options={{ title: 'Posts' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
