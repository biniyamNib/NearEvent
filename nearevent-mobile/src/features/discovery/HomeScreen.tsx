import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { getPublishedEvents, type EventItem } from "../../api/events.api";
import { getActiveCategories } from "../../api/categories.api";
import { useAuthStore } from "../../store/authStore";

const API_ORIGIN = "http://10.200.14.124:8080"; // use your PC LAN IP

function formatEventDate(dateStr: string, timeStr?: string) {
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

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const avatarSrc = user?.avatar_url
    ? user.avatar_url.startsWith("http")
      ? user.avatar_url
      : `${API_ORIGIN}${user.avatar_url}`
    : null;

  const load = async () => {
    try {
      const [cats, list] = await Promise.all([
        getActiveCategories(),
        getPublishedEvents(),
      ]);
      setCategories(cats || []);
      setEvents(list || []);
    } catch (e) {
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (selectedCategory !== "all" && e.category_id !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        (e.address || "").toLowerCase().includes(q) ||
        (e.venue_name || "").toLowerCase().includes(q)
      );
    });
  }, [events, search, selectedCategory]);

  const chips = [{ id: "all", name: "All" }, ...categories];

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
          paddingBottom: 12,
          backgroundColor: colors.background.default,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: colors.brand.primary,
            }}
          >
            NearEvent
          </Text>

          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              overflow: "hidden",
              backgroundColor: colors.brand.primaryLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {avatarSrc ? (
              <Image
                source={{ uri: avatarSrc }}
                style={{ width: 40, height: 40 }}
              />
            ) : (
              <Text style={{ color: colors.brand.primary, fontWeight: "700" }}>
                {(user?.full_name || "A")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        {/* Location (static for now) */}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
          <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
          <Text style={{ marginLeft: 4, color: colors.text.secondary, fontSize: 13 }}>
            Bole, Addis Ababa
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={colors.text.secondary}
            style={{ marginLeft: 2 }}
          />
        </View>

        {/* Search */}
        <View
          style={{
            marginTop: 14,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border.default,
            borderRadius: 12,
            paddingHorizontal: 12,
            backgroundColor: colors.background.default,
          }}
        >
          <Ionicons name="search" size={18} color={colors.text.tertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search events..."
            placeholderTextColor={colors.text.disabled}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 8,
              color: colors.text.primary,
            }}
          />
        </View>

        {/* Category chips */}
        <FlatList
          horizontal
          data={chips}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 14 }}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => {
            const active = selectedCategory === item.id;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: active
                    ? colors.brand.primary
                    : colors.background.subtle,
                }}
              >
                <Text
                  style={{
                    color: active ? "#fff" : colors.text.secondary,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Events */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24, flexGrow: 1 }}
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
          <View style={{ alignItems: "center", marginTop: 60, paddingHorizontal: 24 }}>
            <Ionicons name="file-tray-outline" size={64} color={colors.brand.primary} />
            <Text
              style={{
                marginTop: 16,
                fontSize: 18,
                fontWeight: "700",
                color: colors.text.primary,
              }}
            >
              No events found
            </Text>
            <Text
              style={{
                marginTop: 8,
                textAlign: "center",
                color: colors.text.secondary,
                lineHeight: 20,
              }}
            >
              Try adjusting your filters or check back later for new local events.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const img = imageUrl(item.image_url);
          return (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("EventDetails", { eventId: item.id })
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
                  style={{ width: "100%", height: 160 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: 160,
                    backgroundColor: colors.background.subtle,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="image-outline" size={28} color={colors.text.tertiary} />
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
                <Text style={{ marginTop: 4, color: colors.text.secondary, fontSize: 13 }}>
                  {item.category_name || "Event"} · Free
                </Text>

                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
                  <Ionicons name="calendar-outline" size={14} color={colors.text.tertiary} />
                  <Text style={{ marginLeft: 6, color: colors.text.secondary, fontSize: 13 }}>
                    {formatEventDate(item.event_date, item.start_time)}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                  <Ionicons name="location-outline" size={14} color={colors.text.tertiary} />
                  <Text style={{ marginLeft: 6, color: colors.text.secondary, fontSize: 13 }}>
                    {item.venue_name || item.address || "Location TBA"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}