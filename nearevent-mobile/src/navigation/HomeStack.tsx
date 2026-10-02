import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../features/discovery/HomeScreen";
import EventDetailsScreen from "../features/events/EventDetailsScreen";

export type HomeStackParamList = {
  HomeMain: undefined;
  EventDetails: { eventId: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
    </Stack.Navigator>
  );
}