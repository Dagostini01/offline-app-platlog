import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabsRoutes from './TabsRoutes';
import ResumoDoDia from '../screens/ResumoDoDia';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabsRoutes} />
      <Stack.Screen name="ResumoDoDia" component={ResumoDoDia} />
    </Stack.Navigator>
  );
}
