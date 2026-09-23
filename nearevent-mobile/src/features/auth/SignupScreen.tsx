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

type Props = NativeStackScreenProps<AuthStackParamList, "Signup">;

export default function SignupScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let ok = true;
    setFullNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmError("");

    if (!fullName.trim()) {
      setFullNameError("Full Name is required");
      ok = false;
    }

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

    if (!confirmPassword) {
      setConfirmError("Confirm Password is required");
      ok = false;
    } else if (password && confirmPassword !== password) {
      setConfirmError("Passwords do not match.");
      ok = false;
    }

    return ok;
  };

  const onSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    const start = Date.now();

    try {
      await api.post("/auth/register", {
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role: "attendee", // mobile = attendee only
      });

      const elapsed = Date.now() - start;
      if (elapsed < 800) {
        await new Promise((r) => setTimeout(r, 800 - elapsed));
      }

      // Same as web preference: go to login after register
      navigation.replace("Login");
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Could not create account. Please try again.";

      if (
        message.toLowerCase().includes("already") ||
        message.toLowerCase().includes("exists")
      ) {
        setEmailError("An account with this email already exists.");
      } else {
        setEmailError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError: boolean) => ({
    borderWidth: 1,
    borderColor: hasError ? colors.status.error : colors.border.default,
    backgroundColor: colors.background.default,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text.primary,
    fontSize: 15,
  });

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
          Create an Account
        </Text>
        <Text
          style={{
            marginTop: 6,
            textAlign: "center",
            fontSize: 14,
            color: colors.text.secondary,
          }}
        >
          Join NearEvent to discover local events near you.
        </Text>

        {/* Full Name */}
        <Text style={{ marginTop: 28, marginBottom: 8, color: colors.text.secondary }}>
          Full Name <Text style={{ color: colors.status.error }}>*</Text>
        </Text>
        <TextInput
          value={fullName}
          onChangeText={(v) => {
            setFullName(v);
            if (fullNameError) setFullNameError("");
          }}
          placeholder="Enter your full name"
          placeholderTextColor={colors.text.disabled}
          editable={!loading}
          style={inputStyle(!!fullNameError)}
        />
        {fullNameError ? (
          <Text style={{ marginTop: 6, color: colors.status.error, fontSize: 12 }}>
            {fullNameError}
          </Text>
        ) : null}

        {/* Email */}
        <Text style={{ marginTop: 16, marginBottom: 8, color: colors.text.secondary }}>
          Email <Text style={{ color: colors.status.error }}>*</Text>
        </Text>
        <TextInput
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (emailError) setEmailError("");
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Enter your email"
          placeholderTextColor={colors.text.disabled}
          editable={!loading}
          style={inputStyle(!!emailError)}
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
            }}
            secureTextEntry={!showPassword}
            placeholder="Create your password"
            placeholderTextColor={colors.text.disabled}
            editable={!loading}
            style={{ ...inputStyle(!!passwordError), paddingRight: 44 }}
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

        {/* Confirm Password */}
        <Text style={{ marginTop: 16, marginBottom: 8, color: colors.text.secondary }}>
          Confirm Password <Text style={{ color: colors.status.error }}>*</Text>
        </Text>
        <View>
          <TextInput
            value={confirmPassword}
            onChangeText={(v) => {
              setConfirmPassword(v);
              if (confirmError) setConfirmError("");
            }}
            secureTextEntry={!showConfirmPassword}
            placeholder="Confirm your password"
            placeholderTextColor={colors.text.disabled}
            editable={!loading}
            style={{ ...inputStyle(!!confirmError), paddingRight: 44 }}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword((s) => !s)}
            style={{ position: "absolute", right: 12, top: 13 }}
            disabled={loading}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        </View>
        {confirmError ? (
          <Text style={{ marginTop: 6, color: colors.status.error, fontSize: 12 }}>
            {confirmError}
          </Text>
        ) : null}

        {/* Create Account button */}
        <TouchableOpacity
          onPress={onSignup}
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
                Creating Account...
              </Text>
            </View>
          ) : (
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Create Account
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={{ marginTop: 22, alignItems: "center" }}
          disabled={loading}
        >
          <Text style={{ color: colors.text.secondary, fontSize: 14 }}>
            Don’t have an account?{" "}
            <Text style={{ color: colors.brand.primary, fontWeight: "600" }}>
              Log In
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}