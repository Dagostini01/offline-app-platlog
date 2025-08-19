import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabsRoutes from './TabsRoutes';
import ResumoDoDia from '../screens/ResumoDoDia';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppRoutes() {
  return (
    <Stack.Navigator initialRouteName="Tabs" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabsRoutes} />
      <Stack.Screen
        name="ResumoDoDia"
        component={ResumoDoDia}
        options={{ headerShown: true, title: 'Resumo do Dia' }}
      />
    </Stack.Navigator>
  );
}
