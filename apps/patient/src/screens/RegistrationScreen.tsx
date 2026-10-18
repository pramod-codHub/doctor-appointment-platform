
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { RootStackParamList } from "../navigation/types";
export default function RegistrationScreen() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleNext = () => {
    navigation.navigate("OTP", {
    name: name.trim(),
    mobile,
});
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-10">
          <Text className="text-3xl font-bold text-blue-900">
            Create Account
          </Text>

          <Text className="mt-3 mb-8 text-base leading-6 text-gray-500">
            Enter your details to get started with your healthcare journey.
          </Text>

          <Text className="mb-2 font-semibold text-gray-800">
            Full Name
          </Text>

          <TextInput
            className="mb-5 rounded-xl border border-gray-300 px-4 py-4 text-base text-gray-900"
            placeholder="Enter your full name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoCorrect={false}
          />

          <Text className="mb-2 font-semibold text-gray-800">
            Mobile Number
          </Text>

          <TextInput
            className="mb-8 rounded-xl border border-gray-300 px-4 py-4 text-base text-gray-900"
            placeholder="Enter your 10-digit mobile number"
            placeholderTextColor="#9CA3AF"
            value={mobile}
            onChangeText={(value) =>
              setMobile(value.replace(/\D/g, "").slice(0, 10))
            }
            keyboardType="number-pad"
            maxLength={10}
          />

          <Pressable
            className="items-center rounded-xl bg-blue-600 px-4 py-4 active:bg-blue-700"
            onPress={handleNext}
          >
            <Text className="text-base font-bold text-white">
              Next
            </Text>
          </Pressable>

          <Text className="mt-5 text-center text-sm text-gray-500">
            We will use your mobile number for OTP verification.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
