
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import API_BASE_URL from "../config/api";

interface PatientProfile {
  id: string;
  name: string;
  mobile: string;
  isMobileVerified: boolean;
  createdAt: string;
}

export default function DashboardScreen() {
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientProfile = async () => {
      try {
        // 1. Read the JWT saved after OTP verification
        const token = await SecureStore.getItemAsync("authToken");

        if (!token) {
          Alert.alert(
            "Login required",
            "Your authentication token was not found. Please verify your mobile number again."
          );
          return;
        }

        // 2. Request the authenticated patient's profile
        const response = await axios.get(
          `${API_BASE_URL}/patients/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // 3. Store the profile returned by the backend
        setPatient(response.data.patient);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const message = error.response?.data?.message;

          Alert.alert(
            "Unable to load profile",
            typeof message === "string"
              ? message
              : "Please check your internet connection and try again."
          );
        } else {
          Alert.alert(
            "Error",
            "An unexpected error occurred while loading your profile."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPatientProfile();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-gray-500">
          Loading your profile...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-3xl font-bold text-blue-900">
        Welcome to Your Dashboard!
      </Text>

      {patient && (
        <View className="mt-6 w-full rounded-xl border border-blue-100 bg-blue-50 p-5">
          <Text className="text-xl font-bold text-blue-900">
            Hello, {patient.name}!
          </Text>

          <Text className="mt-3 text-base text-gray-700">
            Mobile: {patient.mobile}
          </Text>

          <Text className="mt-2 text-sm text-green-700">
            {patient.isMobileVerified
              ? "Mobile number verified"
              : "Mobile number not verified"}
          </Text>
        </View>
      )}

      <Text className="mt-4 text-center text-base text-gray-500">
        Explore specialties, discover nearby clinics, and book your appointment.
      </Text>
    </View>
  );
}
