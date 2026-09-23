import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { colors } from "../../theme/colors";
import { api } from "../../api/client";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    setEmailError("");
    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const onSend = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", {
        email: email.trim(),
      });
      setSuccess(true);
    } catch (err: any) {
      // For security, many APIs still return success.
      // If backend returns error, show it.
      setEmailError(
        err?.response?.data?.message ||
          "Could not send reset link. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const close = () => navigation.goBack();

  return (
    <Modal transparent animationType="fade" visible onRequestClose={close}>
      {/* Dimmed background (login behind) */}
      <Pressable
        onPress={close}
        style={{
          flex: 1,
          backgroundColor: "rgba(15, 23, 42, 0.45)",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: colors.background.default,
            borderRadius: 16,
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 22,
          }}
        >
          {/* Back */}
          <TouchableOpacity onPress={close} style={{ marginBottom: 8 }}>
            <Text style={{ color: colors.text.secondary, fontSize: 18 }}>←</Text>
          </TouchableOpacity>

          {!success ? (
            <>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: "700",
                  color: colors.brand.primary,
                }}
              >
                NearEvent
              </Text>

              <Text
                style={{
                  marginTop: 14,
                  textAlign: "center",
                  fontSize: 20,
                  fontWeight: "700",
                  color: colors.text.primary,
                }}
              >
                Forgot Password?
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  textAlign: "center",
                  fontSize: 13,
                  color: colors.text.secondary,
                }}
              >
                Enter your email to reset your password
              </Text>

              <Text
                style={{
                  marginTop: 22,
                  marginBottom: 8,
                  color: colors.text.secondary,
                }}
              >
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
                style={{
                  borderWidth: 1,
                  borderColor: emailError
                    ? colors.status.error
                    : colors.border.default,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  color: colors.text.primary,
                  fontSize: 15,
                }}
              />

              {emailError ? (
                <Text
                  style={{
                    marginTop: 6,
                    color: colors.status.error,
                    fontSize: 12,
                  }}
                >
                  {emailError}
                </Text>
              ) : null}

              <TouchableOpacity
                onPress={onSend}
                disabled={loading}
                style={{
                  marginTop: 20,
                  backgroundColor: loading
                    ? colors.brand.primaryLight
                    : colors.brand.primary,
                  borderRadius: 28,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                {loading ? (
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
                    <ActivityIndicator color={colors.brand.primary} />
                    <Text
                      style={{
                        color: colors.brand.primary,
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      Sending...
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}
                  >
                    Send Reset Link
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 22,
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
                  fontSize: 20,
                  fontWeight: "700",
                  color: colors.text.primary,
                }}
              >
                Check your email
              </Text>
              <Text
                style={{
                  marginTop: 10,
                  textAlign: "center",
                  fontSize: 14,
                  lineHeight: 20,
                  color: colors.text.secondary,
                }}
              >
                We’ve sent password reset instructions to your email address.
              </Text>

              <TouchableOpacity
                onPress={close}
                style={{
                  marginTop: 24,
                  backgroundColor: colors.brand.primary,
                  borderRadius: 28,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                  Back to Login
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}