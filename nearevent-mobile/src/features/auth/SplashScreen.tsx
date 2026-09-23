// src/features/auth/SplashScreen.tsx
import { useEffect } from "react";
import { View, Text } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { colors } from "../../theme/colors";

type Props = NativeStackScreenProps<AuthStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const t = setTimeout(() => navigation.replace("Onboarding"), 1600);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.brand.primary,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 34,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        NearEvent
      </Text>
      <Text
        style={{
          marginTop: 10,
          color: "rgba(255,255,255,0.9)",
          fontSize: 15,
          textAlign: "center",
        }}
      >
        Discover local events near you
      </Text>
    </View>
  );
}