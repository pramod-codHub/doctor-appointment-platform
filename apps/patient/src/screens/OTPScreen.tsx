
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "OTP">;

export default function OTPScreen({ route }: Props) {
  const { name, mobile } = route.params;
  const [otp, setOtp] = useState("");
  const navigation =
  useNavigation<NativeStackNavigationProp<RootStackParamList>>();

const handleVerify = () => {
  if (!/^\d{6}$/.test(otp)) {
    Alert.alert("Invalid OTP", "Please enter a 6-digit OTP.");
    return;
  }

  navigation.replace("Dashboard");
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
      />

      <Pressable
        className="mt-6 items-center rounded-xl bg-blue-600 px-4 py-4 active:bg-blue-700"
        onPress={handleVerify}
      >
        <Text className="text-base font-bold text-white">
          Verify & Continue
        </Text>
      </Pressable>

      <Text className="mt-5 text-center text-sm text-gray-500">
        Didn't receive the OTP? Resend functionality will be added later.
      </Text>
    </View>
  );
}
