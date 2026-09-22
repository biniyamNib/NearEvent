import { View, Text, ActivityIndicator } from "react-native";
import { colors } from "../../theme/colors";

export default function SplashScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.brand.primary }}>
      <Text style={{ color: "#fff", fontSize: 28, fontWeight: "700" }}>NearEvent</Text>
      <ActivityIndicator color="#fff" style={{ marginTop: 16 }} />
    </View>
  );
}