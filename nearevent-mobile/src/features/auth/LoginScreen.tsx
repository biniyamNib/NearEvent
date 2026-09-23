import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { colors } from "../../theme/colors";
import { api } from "../../api/client";
import { useAuthStore } from "../../store/authStore";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let ok = true;
    setEmailError("");
    setPasswordError("");
    setFormError("");

    if (!email.trim()) {
      setEmailError("Email is required");
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      ok = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      ok = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      ok = false;
    }

    return ok;
  };

  const onLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    const start = Date.now();

    try {
      const res = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const { token, user } = res.data.data;

      const elapsed = Date.now() - start;
      if (elapsed < 700) {
        await new Promise((r) => setTimeout(r, 700 - elapsed));
      }

      // Mobile app is attendee-only
      if (user.role !== "attendee") {
        setFormError("This app is only for attendees. Please use the web app.");
        return;
      }

      setAuth(token, user);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ||
          "Incorrect email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background.default }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingVertical: 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <Text
          style={{
            textAlign: "center",
            fontSize: 28,
            fontWeight: "700",
            color: colors.brand.primary,
          }}
        >
          NearEvent
        </Text>

        <Text
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 22,
            fontWeight: "700",
            color: colors.text.primary,
          }}
        >
          Welcome Back
        </Text>
        <Text
          style={{
            marginTop: 6,
            textAlign: "center",
            fontSize: 14,
            color: colors.text.secondary,
          }}
        >
          Sign in to continue
        </Text>

        {/* Email */}
        <Text style={{ marginTop: 28, marginBottom: 8, color: colors.text.secondary }}>
          Email <Text style={{ color: colors.status.error }}>*</Text>
        </Text>
        <TextInput
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (emailError) setEmailError("");
            if (formError) setFormError("");
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Enter your email"
          placeholderTextColor={colors.text.disabled}
          editable={!loading}
          style={{
            borderWidth: 1,
            borderColor: emailError ? colors.status.error : colors.border.default,
            backgroundColor: colors.background.default,
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

        {/* Password */}
        <Text style={{ marginTop: 16, marginBottom: 8, color: colors.text.secondary }}>
          Password <Text style={{ color: colors.status.error }}>*</Text>
        </Text>
        <View>
          <TextInput
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (passwordError) setPasswordError("");
              if (formError) setFormError("");
            }}
            secureTextEntry={!showPassword}
            placeholder="Enter your password"
            placeholderTextColor={colors.text.disabled}
            editable={!loading}
            style={{
              borderWidth: 1,
              borderColor: passwordError
                ? colors.status.error
                : colors.border.default,
              backgroundColor: colors.background.default,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 13,
              paddingRight: 44,
              color: colors.text.primary,
              fontSize: 15,
            }}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((s) => !s)}
            style={{ position: "absolute", right: 12, top: 13 }}
            disabled={loading}
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        </View>
        {passwordError ? (
          <Text style={{ marginTop: 6, color: colors.status.error, fontSize: 12 }}>
            {passwordError}
          </Text>
        ) : null}

        {/* Forgot password */}
        <TouchableOpacity
          onPress={() => navigation.navigate("ForgotPassword")}
          style={{ alignSelf: "flex-start", marginTop: 12 }}
          disabled={loading}
        >
          <Text style={{ color: colors.brand.primary, fontSize: 14 }}>
            Forgot password?
          </Text>
        </TouchableOpacity>

        {/* Form error under forgot password */}
        {formError ? (
          <Text
            style={{
              marginTop: 10,
              color: colors.status.error,
              fontSize: 13,
            }}
          >
            {formError}
          </Text>
        ) : null}

        {/* Login button */}
        <TouchableOpacity
          onPress={onLogin}
          disabled={loading}
          style={{
            marginTop: 24,
            backgroundColor: loading
              ? colors.brand.primaryLight
              : colors.brand.primary,
            borderRadius: 28,
            paddingVertical: 15,
            alignItems: "center",
          }}
        >
          {loading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator color={colors.brand.primary} />
              <Text
                style={{
                  color: colors.brand.primary,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Logging in...
              </Text>
            </View>
          ) : (
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Login
            </Text>
          )}
        </TouchableOpacity>

        {/* Sign up link */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Signup")}
          style={{ marginTop: 22, alignItems: "center" }}
          disabled={loading}
        >
          <Text style={{ color: colors.text.secondary, fontSize: 14 }}>
            Don’t have an account?{" "}
            <Text style={{ color: colors.brand.primary, fontWeight: "600" }}>
              Sign Up
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}