// src/features/profile/SettingsScreen.tsx
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../theme/colors";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../api/client";

// Adjust param list name to your navigator
type Props = NativeStackScreenProps<any, "Settings">;

const API_ORIGIN = "http://10.200.14.124:8080";

export default function SettingsScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.avatar_url) {
      const src = user.avatar_url.startsWith("http")
        ? user.avatar_url
        : `${API_ORIGIN}${user.avatar_url}`;
      setAvatarUri(src);
    }
  }, [user?.avatar_url]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo library access to change photo.");
      return;
    }

    // const result = await ImagePicker.launchImageLibraryAsync({
    //   mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //   allowsEditing: true,
    //   aspect: [1, 1],
    //   quality: 0.8,
    // });

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setAvatarUri(asset.uri);
      setAvatarFile({
        uri: asset.uri,
        name: `avatar_${Date.now()}.jpg`,
        type: "image/jpeg",
      });
    }
  };

  const validate = () => {
    let ok = true;
    setFullNameError("");
    setEmailError("");
    setFormError("");

    if (!fullName.trim() && !email.trim() && !avatarFile) {
      setFormError("Please update at least one field before saving.");
      return false;
    }

    if (fullName.trim() === "") {
      // allow empty only if not changing name - Figma empty state
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      ok = false;
    }

    return ok;
  };

  const onSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      let avatar_url: string | undefined;

      if (avatarFile) {
        const form = new FormData();
        form.append("image", {
          uri: avatarFile.uri,
          name: avatarFile.name,
          type: avatarFile.type,
        } as any);

        const uploadRes = await api.post("/uploads/image", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        avatar_url = uploadRes.data?.data?.url || uploadRes.data?.data;
      }

      const payload: any = {
        full_name: fullName.trim() || user?.full_name,
        email: email.trim() || user?.email,
      };
      if (avatar_url) payload.avatar_url = avatar_url;

      const res = await api.put("/users/me", payload);
      const updated = res.data.data;

      if (token) setAuth(token, updated);
      navigation.goBack();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const initials =
    (fullName || user?.full_name || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background.default }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{
          paddingTop: 54,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 22, color: colors.text.primary }}>←</Text>
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 18,
            fontWeight: "700",
            color: colors.text.primary,
            marginRight: 24,
          }}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center", marginTop: 12 }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              overflow: "hidden",
              backgroundColor: colors.brand.primaryLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={{ width: 88, height: 88 }} />
            ) : (
              <Text style={{ color: colors.brand.primary, fontWeight: "700", fontSize: 24 }}>
                {initials}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={pickImage} style={{ marginTop: 10 }}>
            <Text style={{ color: colors.brand.primary, fontWeight: "600" }}>
              Change photo
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={{ marginTop: 28, marginBottom: 8, color: colors.text.secondary }}>
          Full Name
        </Text>
        <TextInput
          value={fullName}
          onChangeText={(v) => {
            setFullName(v);
            setFormError("");
          }}
          placeholder="Enter your full name"
          placeholderTextColor={colors.text.disabled}
          editable={!saving}
          style={{
            borderWidth: 1,
            borderColor: fullNameError ? colors.status.error : colors.border.default,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 13,
            color: colors.text.primary,
            fontSize: 15,
          }}
        />
        {fullNameError ? (
          <Text style={{ marginTop: 6, color: colors.status.error, fontSize: 12 }}>
            {fullNameError}
          </Text>
        ) : null}

        <Text style={{ marginTop: 16, marginBottom: 8, color: colors.text.secondary }}>
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setEmailError("");
            setFormError("");
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Enter your email"
          placeholderTextColor={colors.text.disabled}
          editable={!saving}
          style={{
            borderWidth: 1,
            borderColor: emailError ? colors.status.error : colors.border.default,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 13,
            color: colors.text.primary,
            fontSize: 15,
          }}
        />
        {emailError ? (
          <Text style={{ marginTop: 6, color: colors.status.error, fontSize: 12 }}>
            {emailError}
          </Text>
        ) : null}

        {formError ? (
          <Text style={{ marginTop: 12, color: colors.status.error, fontSize: 13 }}>
            {formError}
          </Text>
        ) : null}

        <TouchableOpacity
          onPress={onSave}
          disabled={saving}
          style={{
            marginTop: 28,
            backgroundColor: colors.brand.primary,
            borderRadius: 28,
            paddingVertical: 14,
            alignItems: "center",
            opacity: saving ? 0.85 : 1,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}