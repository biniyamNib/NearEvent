import { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import SearchScreen from "../features/discovery/SearchScreen";
import MyEventsScreen from "../features/myEvents/MyEventsScreen";
import HomeStack from "./HomeStack";
import ProfileStack from "./ProfileStack";
import { colors } from "../theme/colors";
import { registerForPushAsync } from "../notifications/registerForPush";
import { registerDeviceToken } from "../api/notifications.api";

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  MyEvents: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  useEffect(() => {
  registerForPushAsync().then(async (token) => {
    if (!token) return;
    try {
      await registerDeviceToken(token);
      console.log("Push token registered with API");
    } catch (e) {
      console.log("Failed to register push token", e);
    }
  });
}, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.background.default,
          borderTopColor: colors.border.default,
        },
        tabBarIcon: ({ color, size }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: "home-outline",
            Search: "search-outline",
            MyEvents: "calendar-outline",
            Profile: "person-outline",
          };
          return <Ionicons name={map[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: "Search", tabBarStyle: { display: "none" } }}
      />
      <Tab.Screen
        name="MyEvents"
        component={MyEventsScreen}
        options={{ title: "My Events" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}