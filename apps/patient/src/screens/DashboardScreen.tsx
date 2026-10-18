
import { View, Text } from "react-native";

export default function DashboardScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-3xl font-bold text-blue-900">
        Welcome to Your Dashboard!
      </Text>

      <Text className="mt-4 text-center text-base text-gray-500">
        Explore specialties, discover nearby clinics, and book your appointment.
      </Text>
    </View>
  );
}
