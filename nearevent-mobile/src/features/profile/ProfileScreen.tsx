// src/features/profile/ProfileScreen.tsx
import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { useAuthStore } from "../../store/authStore";

const API_ORIGIN = "http://10.200.14.124:8080";

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const avatarSrc = user?.avatar_url
    ? user.avatar_url.startsWith("http")
      ? user.avatar_url
      : `${API_ORIGIN}${user.avatar_url}`
    : null;

  const initials =
    user?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const onLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  const Row = ({
    icon,
    label,
    onPress,
    danger,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
      }}
    >
      <Ionicons
        name={icon}
        size={20}
        color={danger ? colors.status.error : colors.text.secondary}
      />
      <Text
        style={{
          marginLeft: 14,
          fontSize: 15,
          color: danger ? colors.status.error : colors.text.primary,
          fontWeight: danger ? "600" : "500",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.page }}>
      <View
        style={{
          paddingTop: 54,
          paddingBottom: 20,
          backgroundColor: colors.background.default,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: colors.text.primary,
            marginBottom: 20,
          }}
        >
          Profile
        </Text>

        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            overflow: "hidden",
            backgroundColor: colors.brand.primaryLight,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {avatarSrc ? (
            <Image source={{ uri: avatarSrc }} style={{ width: 72, height: 72 }} />
          ) : (
            <Text style={{ color: colors.brand.primary, fontWeight: "700", fontSize: 22 }}>
              {initials}
            </Text>
          )}
        </View>

        <Text
          style={{
            marginTop: 12,
            fontSize: 18,
            fontWeight: "700",
            color: colors.text.primary,
          }}
        >
          {user?.full_name || "Attendee"}
        </Text>
        <Text style={{ marginTop: 4, color: colors.text.secondary, fontSize: 14 }}>
          {user?.email || ""}
        </Text>
      </View>

      <View
        style={{
          marginTop: 16,
          marginHorizontal: 16,
          backgroundColor: colors.background.default,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border.default,
          overflow: "hidden",
        }}
      >
        <Row
          icon="notifications-outline"
          label="Notifications"
          onPress={() => navigation.navigate("Notifications")}
        />
        <Row
          icon="settings-outline"
          label="Settings"
          onPress={() => navigation.navigate("Settings")}
        />
        <Row
          icon="help-circle-outline"
          label="Help & Support"
          onPress={() => {
            // optional later
          }}
        />
        <Row icon="log-out-outline" label="Log Out" danger onPress={onLogout} />
      </View>
    </View>
  );
}