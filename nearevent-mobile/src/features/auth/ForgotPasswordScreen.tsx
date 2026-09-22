import { View, Text } from "react-native";
import { colors } from "../../theme/colors";

export default function ForgotPasswordScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background.page }}>
      <Text style={{ color: colors.text.primary }}>ForgotPassword Screen</Text>
    </View>
  );
}