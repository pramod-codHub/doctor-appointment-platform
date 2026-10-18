
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import RegistrationScreen from "../screens/RegistrationScreen";
import OTPScreen from "../screens/OTPScreen";
import type { RootStackParamList } from "./types";
import DashboardScreen from "../screens/DashboardScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
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
