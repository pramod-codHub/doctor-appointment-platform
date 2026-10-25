
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import API_BASE_URL from "../config/api";

type Props = NativeStackScreenProps<RootStackParamList, "OTP">;

export default function OTPScreen({ route }: Props) {
  const { name, mobile } = route.params;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(otp)) {
      Alert.alert("Invalid OTP", "Please enter a 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/otp/verify`,
        {
          mobile,
          otp,
        }
      );

      if (response.data.success) {
        Alert.alert(
          "Success",
          "Your mobile number has been verified!",
          [
            {
              text: "Continue",
              onPress: () => navigation.replace("Dashboard"),
            },
          ]
        );
      } else {
        Alert.alert(
          "Verification failed",
          response.data.message || "Unable to verify OTP."
        );
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;

        Alert.alert(
          "Verification failed",
          typeof message === "string"
            ? message
            : "Unable to connect to the server. Please try again."
        );
      } else {
        Alert.alert(
          "Error",
          "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <View className="mb-8 h-20 w-20 items-center justify-center self-center rounded-full bg-blue-100">
        <Text className="text-4xl">📱</Text>
      </View>

      <Text className="text-center text-3xl font-bold text-blue-900">
        Verify Your Number
      </Text>

      <Text className="mt-4 text-center text-base leading-6 text-gray-500">
        Hi {name}, enter the 6-digit OTP sent to{"\n"}
        +91 {mobile}
      </Text>

      <Text className="mb-2 mt-8 font-semibold text-gray-800">
        Enter OTP
      </Text>

      <TextInput
        className="rounded-xl border border-gray-300 px-4 py-4 text-center text-2xl tracking-widest text-gray-900"
        placeholder="------"
        placeholderTextColor="#9CA3AF"
        value={otp}
        onChangeText={(value) =>
          setOtp(value.replace(/\D/g, "").slice(0, 6))
        }
        keyboardType="number-pad"
        maxLength={6}
        editable={!loading}
      />

      <Pressable
        className={`mt-6 items-center rounded-xl px-4 py-4 ${loading ? "bg-blue-400" : "bg-blue-600 active:bg-blue-700"
          }`}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-base font-bold text-white">
            Verify & Continue
          </Text>
        )}
      </Pressable>

      <Text className="mt-5 text-center text-sm text-gray-500">
        For development, use the OTP printed in your backend terminal.
      </Text>
    </View>
  );
}
