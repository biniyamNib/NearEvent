import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "../features/discovery/HomeScreen";
import SearchScreen from "../features/discovery/SearchScreen";
import MyEventsScreen from "../features/myEvents/MyEventsScreen";
import ProfileScreen from "../features/profile/ProfileScreen";
import { colors } from "../theme/colors";

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  MyEvents: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: "Search" }} />
      <Tab.Screen name="MyEvents" component={MyEventsScreen} options={{ title: "My Events" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}