
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  View,
} from "react-native";

import axios from "axios";
import * as SecureStore from "expo-secure-store";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import RegistrationScreen from "../screens/RegistrationScreen";
import OTPScreen from "../screens/OTPScreen";
import DashboardScreen from "../screens/DashboardScreen";
import LoginScreen from "../screens/LoginScreen";

import API_BASE_URL from "../config/api";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

type InitialRoute = "Home" | "Dashboard";

export default function RootNavigator() {
  const [initialRoute, setInitialRoute] =
    useState<InitialRoute | null>(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Step 1: Read saved JWT token
        const token = await SecureStore.getItemAsync("authToken");

        // Step 2: If no token exists, open Home
        if (!token) {
          setInitialRoute("Home");
          return;
        }

        // Step 3: Validate token using backend
        await axios.get(`${API_BASE_URL}/patients/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Step 4: Token is valid, open Dashboard
        setInitialRoute("Dashboard");

      } catch (error: unknown) {
        if (
          axios.isAxiosError(error) &&
          (error.response?.status === 401 ||
            error.response?.status === 403)
        ) {
          // Invalid or expired token
          await SecureStore.deleteItemAsync("authToken");

          setInitialRoute("Home");
        } else {
          // Network/server error:
          // Keep the saved token and let Dashboard
          // attempt to load the patient profile.
          const token = await SecureStore.getItemAsync("authToken");

          setInitialRoute(token ? "Dashboard" : "Home");
        }
      }
    };

    checkAuthentication();
  }, []);

  // Show loading screen while checking authentication
  if (!initialRoute) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />

        <Text className="mt-4 text-gray-500">
          Checking your account...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>

        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Patient Login" }}
        />

        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Registration"
          component={RegistrationScreen}
          options={{ title: "Create Account" }}
        />

        <Stack.Screen
          name="OTP"
          component={OTPScreen}
          options={{ title: "OTP Verification" }}
        />

        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
