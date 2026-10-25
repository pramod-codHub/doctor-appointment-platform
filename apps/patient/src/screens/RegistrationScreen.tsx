
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import axios from "axios";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { RootStackParamList } from "../navigation/types";
import API_BASE_URL from "../config/api";

export default function RegistrationScreen() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();


  const handleNext = async () => {
    const trimmedName = name.trim();

    // Step 1: Validate the user's input.
    if (!trimmedName) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!/^\d{10}$/.test(mobile)) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      // Step 2: Register the patient in the backend.
      const registrationResponse = await axios.post(
        `${API_BASE_URL}/patients/register`,
        {
          name: trimmedName,
          mobile,
        }
      );

      if (!registrationResponse.data.success) {
        setErrorMessage("Registration could not be completed.");
        return;
      }

      // Step 3: Request an OTP from the backend.
      await axios.post(`${API_BASE_URL}/otp/send`, {
        mobile,
      });

      // Step 4: Navigate to the OTP screen.
      navigation.navigate("OTP", {
        name: trimmedName,
        mobile,
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;

        setErrorMessage(
          typeof message === "string"
            ? message
            : "Unable to connect to the server. Please try again."
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
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
            onChangeText={(value) => {
              setName(value);
              setErrorMessage("");
            }}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!loading}
          />

          <Text className="mb-2 font-semibold text-gray-800">
            Mobile Number
          </Text>

          <TextInput
            className="mb-5 rounded-xl border border-gray-300 px-4 py-4 text-base text-gray-900"
            placeholder="Enter your 10-digit mobile number"
            placeholderTextColor="#9CA3AF"
            value={mobile}
            onChangeText={(value) => {
              setMobile(value.replace(/\D/g, "").slice(0, 10));
              setErrorMessage("");
            }}
            keyboardType="number-pad"
            maxLength={10}
            editable={!loading}
          />

          {errorMessage ? (
            <Text className="mb-4 text-sm text-red-600">
              {errorMessage}
            </Text>
          ) : null}

          <Pressable
            className={`items-center rounded-xl px-4 py-4 ${loading ? "bg-blue-400" : "bg-blue-600 active:bg-blue-700"
              }`}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-base font-bold text-white">
                Next
              </Text>
            )}
          </Pressable>

          <Text className="mt-5 text-center text-sm text-gray-500">
            We will use your mobile number for OTP verification.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
