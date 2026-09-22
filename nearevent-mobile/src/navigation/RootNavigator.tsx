import { NavigationContainer } from "@react-navigation/native";
import { useAuthStore } from "../store/authStore";
import AuthNavigator from "./AuthNavigator";
import MainTabNavigator from "./MainTabNavigator";

export default function RootNavigator() {
  const token = useAuthStore((s) => s.token);

  return (
    <NavigationContainer>
      {token ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}