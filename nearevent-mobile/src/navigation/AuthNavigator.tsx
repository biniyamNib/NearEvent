import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../features/auth/LoginScreen";
import SignupScreen from "../features/auth/SignupScreen";
import OnboardingScreen from "../features/onboarding/OnboardingScreen";
import ForgotPasswordScreen from "../features/auth/ForgotPasswordScreen";

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}