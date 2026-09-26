import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../features/profile/ProfileScreen";
// import SettingsScreen from "../features/profile/SettingsScreen";
import SettingsScreen from "../features/profile/SettingsScreen";
import NotificationsScreen from "../features/notifications/NotificationsScreen";

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  // Notifications: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Settings"    component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}