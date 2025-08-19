import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from './types';
import Home from '../screens/Home';
import Notas from '../screens/Notas';
import Paletes from '../screens/Paletes';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabsRoutes() {
  return (
    <Tab.Navigator screenOptions={{ header: () => <AppHeader /> }}>
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Notas"
        component={Notas}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Paletes"
        component={Paletes}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="cube" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
