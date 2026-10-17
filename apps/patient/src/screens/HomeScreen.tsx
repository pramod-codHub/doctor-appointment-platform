
import { View, Text, Pressable, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View className="flex-1 justify-center px-6 py-10">
        {/* App branding */}
        <View className="mb-10 items-center">
          <View className="mb-5 h-24 w-24 items-center justify-center rounded-full bg-blue-100">
            <Text className="text-5xl">🩺</Text>
          </View>

          <Text className="text-center text-3xl font-bold text-blue-900">
            Your Health{"\n"}Our Priority
          </Text>

          <Text className="mt-4 text-center text-base leading-6 text-gray-500">
            Book appointments with trusted{"\n"}
            doctors and get the best care.
          </Text>
        </View>

        {/* Create Account button */}
        <Pressable
          className="mb-3 items-center rounded-xl bg-blue-600 px-4 py-4 active:bg-blue-700"
          onPress={() => navigation.navigate("Registration")}
        >
          <Text className="text-base font-bold text-white">
            Create Account
          </Text>
        </Pressable>

        {/* Log In button */}
        <Pressable
          className="items-center rounded-xl border border-blue-600 bg-white px-4 py-4"
          onPress={() => console.log("Log In pressed")}
        >
          <Text className="text-base font-bold text-blue-700">
            Log In
          </Text>
        </Pressable>

        {/* Terms and privacy */}
        <Text className="mt-10 text-center text-xs leading-5 text-gray-500">
          By continuing, you agree to our{"\n"}
          <Text className="font-semibold text-blue-700">
            Terms & Conditions
          </Text>
          {" "}and{" "}
          <Text className="font-semibold text-blue-700">
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </ScrollView>
  );
}
