import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { api } from "../../api/client";

const API_ORIGIN = "http://10.200.14.124:8080"; // your LAN IP

type TabKey = "registered" | "saved";

type EventCard = {
  id: string;
  title: string;
  category_name?: string;
  event_date: string;
  start_time?: string;
  venue_name?: string;
  address?: string;
  image_url?: string | null;
  spots_left?: number;
  capacity?: number;
};

function formatEventDate(dateStr?: string, timeStr?: string) {
  if (!dateStr) return "—";
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    const dateLabel = d.toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
    if (!timeStr) return dateLabel;
    const [h, m] = timeStr.slice(0, 5).split(":").map(Number);
    const t = new Date();
    t.setHours(h || 0, m || 0, 0, 0);
    const timeLabel = t.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateLabel}, ${timeLabel}`;
  } catch {
    return dateStr;
  }
}

function imageUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url}`;
}

export default function MyEventsScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<TabKey>("registered");
  const [registered, setRegistered] = useState<EventCard[]>([]);
  const [saved, setSaved] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      // Adjust endpoints to match your backend
      const [regRes, savedRes] = await Promise.all([
        api.get("/me/registrations").catch(() => ({ data: { data: [] } })),
        api.get("/me/saved-events").catch(() => ({ data: { data: [] } })),
      ]);

      // Support either array of events or array of { event: ... }
      const mapList = (raw: any[]): EventCard[] =>
        (raw || []).map((item) => item.event || item);

      setRegistered(mapList(regRes.data?.data || []));
      setSaved(mapList(savedRes.data?.data || []));
    } catch {
      setRegistered([]);
      setSaved([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [])
  );

  const data = tab === "registered" ? registered : saved;

  const emptyTitle =
    tab === "registered"
      ? "You haven't registered for any events yet."
      : "You haven't saved any events yet.";

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.page }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 54,
          paddingHorizontal: 20,
          paddingBottom: 8,
          backgroundColor: colors.background.default,
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: colors.text.primary,
            textAlign: "center",
          }}
        >
          My Events
        </Text>

        {/* Tabs */}
        <View
          style={{
            flexDirection: "row",
            marginTop: 18,
            borderBottomWidth: 1,
            borderBottomColor: colors.border.default,
          }}
        >
          {(["registered", "saved"] as TabKey[]).map((key) => {
            const active = tab === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setTab(key)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingBottom: 12,
                  borderBottomWidth: 2,
                  borderBottomColor: active
                    ? colors.brand.primary
                    : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: active ? "700" : "500",
                    color: active ? colors.brand.primary : colors.text.tertiary,
                  }}
                >
                  {key === "registered" ? "Registered" : "Saved"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 32,
              paddingTop: 80,
            }}
          >
            <Ionicons
              name="file-tray-outline"
              size={72}
              color={colors.brand.primary}
            />
            <Text
              style={{
                marginTop: 20,
                textAlign: "center",
                fontSize: 16,
                color: colors.text.primary,
                fontWeight: "600",
              }}
            >
              {emptyTitle}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Home")}
              style={{
                marginTop: 24,
                backgroundColor: colors.brand.primary,
                borderRadius: 28,
                paddingHorizontal: 28,
                paddingVertical: 14,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
                Discover Events
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const img = imageUrl(item.image_url);
          return (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Home", {
                  screen: "EventDetails",
                  params: { eventId: item.id },
                })
              }
              style={{
                backgroundColor: colors.background.default,
                borderRadius: 16,
                marginBottom: 14,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border.default,
              }}
            >
              {img ? (
                <Image
                  source={{ uri: img }}
                  style={{ width: "100%", height: 150 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: 150,
                    backgroundColor: colors.background.subtle,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="image-outline"
                    size={28}
                    color={colors.text.tertiary}
                  />
                </View>
              )}

              <View style={{ padding: 14 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.text.primary,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    marginTop: 4,
                    color: colors.text.secondary,
                    fontSize: 13,
                  }}
                >
                  {item.category_name || "Event"} · Free
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 10,
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={colors.text.tertiary}
                  />
                  <Text
                    style={{
                      marginLeft: 6,
                      color: colors.text.secondary,
                      fontSize: 13,
                    }}
                  >
                    {formatEventDate(item.event_date, item.start_time)}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 6,
                  }}
                >
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={colors.text.tertiary}
                  />
                  <Text
                    style={{
                      marginLeft: 6,
                      color: colors.text.secondary,
                      fontSize: 13,
                    }}
                  >
                    {item.venue_name || item.address || "Location TBA"}
                  </Text>
                </View>

                {item.spots_left != null ? (
                  <Text
                    style={{
                      marginTop: 8,
                      color: colors.status.success,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    {item.spots_left} spots left
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}