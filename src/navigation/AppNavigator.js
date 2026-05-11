import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DoctorDashboard from '../screens/doctor/DoctorDashboard';
import PatientDashboard from '../screens/patient/PatientDashboard';
import ScreeningScreen from '../screens/screening/ScreeningScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2b6cb0" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Screening" component={ScreeningScreen} />
          </>
        ) : user.role === 'doctor' ? (
          <Stack.Screen name="DoctorDashboard" component={DoctorDashboard} />
        ) : (
          <>
            <Stack.Screen name="PatientDashboard" component={PatientDashboard} />
            <Stack.Screen name="Screening" component={ScreeningScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
