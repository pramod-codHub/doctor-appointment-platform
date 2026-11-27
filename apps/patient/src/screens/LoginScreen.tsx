
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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/types";
import API_BASE_URL from "../config/api";

export default function LoginScreen() {
    const navigation =
        useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [mobile, setMobile] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!/^\d{10}$/.test(mobile)) {
            Alert.alert(
                "Invalid mobile number",
                "Please enter a valid 10-digit mobile number."
            );
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/otp/send`,
                { mobile }
            );

            if (response.data.success) {
                Alert.alert(
                    "OTP Sent",
                    "Please check the OTP in your backend terminal."
                );

                navigation.navigate("OTP", {
                    mobile,
                    flow: "login",
                });
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.message;

                Alert.alert(
                    "Login failed",
                    typeof message === "string"
                        ? message
                        : "Unable to send OTP. Please try again."
                );
            } else {
                Alert.alert("Error", "An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center bg-white px-6">

            <View className="mb-8 h-20 w-20 items-center justify-center self-center rounded-full bg-blue-100">
                <Text className="text-4xl">👋</Text>
            </View>

            <Text className="text-center text-3xl font-bold text-blue-900">
                Welcome Back!
            </Text>

            <Text className="mt-3 text-center text-base text-gray-500">
                Enter your registered mobile number to continue.
            </Text>

            <Text className="mb-2 mt-8 font-semibold text-gray-800">
                Mobile Number
            </Text>

            <View className="flex-row items-center rounded-xl border border-gray-300 px-4">
                <Text className="mr-3 text-base font-semibold text-gray-700">
                    +91
                </Text>

                <TextInput
                    className="flex-1 py-4 text-base text-gray-900"
                    placeholder="Enter mobile number"
                    placeholderTextColor="#9CA3AF"
                    value={mobile}
                    onChangeText={(value) =>
                        setMobile(value.replace(/\D/g, "").slice(0, 10))
                    }
                    keyboardType="number-pad"
                    maxLength={10}
                    editable={!loading}
                />
            </View>

            <Pressable
                className={`mt-6 items-center rounded-xl px-4 py-4 ${loading
                    ? "bg-blue-400"
                    : "bg-blue-600 active:bg-blue-700"
                    }`}
                onPress={handleLogin}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text className="text-base font-bold text-white">
                        Send OTP
                    </Text>
                )}
            </Pressable>

            <Text className="mt-5 text-center text-sm text-gray-500">
                Only registered patients can log in.
            </Text>
        </View>
    );
}
