import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

// Pantallas de autenticación
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Pantallas principales
import HomeScreen from '../screens/HomeScreen';
import InventoryScreen from '../screens/InventoryScreen';
import AddProductScreen from '../screens/AddProductScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import SalesScreen from '../screens/SalesScreen';
import SalesHistoryScreen from '../screens/SalesHistoryScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

import colors from '../constants/colors';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navegador de autenticación
const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.primary,
      },
      headerTintColor: colors.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{ title: 'Iniciar Sesión' }}
    />
    <Stack.Screen
      name="Register"
      component={RegisterScreen}
      options={{ title: 'Registrarse' }}
    />
    <Stack.Screen
      name="ForgotPassword"
      component={ForgotPasswordScreen}
      options={{ title: 'Recuperar Contraseña' }}
    />
  </Stack.Navigator>
);

// Navegador de inventario
const InventoryNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.primary,
      },
      headerTintColor: colors.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen
      name="InventoryList"
      component={InventoryScreen}
      options={{ title: 'Inventario' }}
    />
    <Stack.Screen
      name="AddProduct"
      component={AddProductScreen}
      options={{ title: 'Añadir Producto' }}
    />
    <Stack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ title: 'Detalle de Producto' }}
    />
  </Stack.Navigator>
);

// Navegador de ventas
const SalesNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.primary,
      },
      headerTintColor: colors.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen
      name="SalesRegister"
      component={SalesScreen}
      options={{ title: 'Registrar Venta' }}
    />
    <Stack.Screen
      name="SalesHistory"
      component={SalesHistoryScreen}
      options={{ title: 'Historial de Ventas' }}
    />
  </Stack.Navigator>
);

// Navegador principal de la aplicación
const MainNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Inventory') {
          iconName = focused ? 'list' : 'list-outline';
        } else if (route.name === 'Sales') {
          iconName = focused ? 'cart' : 'cart-outline';
        } else if (route.name === 'Reports') {
          iconName = focused ? 'bar-chart' : 'bar-chart-outline';
        } else if (route.name === 'Settings') {
          iconName = focused ? 'settings' : 'settings-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textLight,
      headerStyle: {
        backgroundColor: colors.primary,
      },
      headerTintColor: colors.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    })}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ title: 'Inicio' }}
    />
    <Tab.Screen
      name="Inventory"
      component={InventoryNavigator}
      options={{ headerShown: false, title: 'Inventario' }}
    />
    <Tab.Screen
      name="Sales"
      component={SalesNavigator}
      options={{ headerShown: false, title: 'Ventas' }}
    />
    <Tab.Screen
      name="Reports"
      component={ReportsScreen}
      options={{ title: 'Reportes' }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ title: 'Ajustes' }}
    />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { user, loading } = useContext(AuthContext);

  // Si está cargando, podrías mostrar una pantalla de carga
  if (loading) {
    return null; // O un componente de carga
  }

  return (
    <Stack.Navigator headerMode="none">
      {user ? (
        <Stack.Screen
          name="Main"
          component={MainNavigator}
          options={{ headerShown: false }}
        />
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
