import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../../theme/colors";
import { getActiveCategories } from "../../api/categories.api";
import { api } from "../../api/client";

const API_ORIGIN = "http://10.200.14.124:8080"; 
const RECENT_KEY = "nearevent_recent_searches";

type Category = { id: string; name: string };
type EventCard = {
  id: string;
  title: string;
  category_name?: string;
  event_date: string;
  start_time?: string;
  venue_name?: string;
  address?: string;
  image_url?: string | null;
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

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

function dateRange(preset: string | null): { from?: string; to?: string } {
  if (!preset) return {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === "today") {
    const y = toYMD(today);
    return { from: y, to: y };
  }
  if (preset === "tomorrow") {
    const t = new Date(today);
    t.setDate(t.getDate() + 1);
    const y = toYMD(t);
    return { from: y, to: y };
  }
  if (preset === "weekend") {
    // next Sat–Sun (or this weekend if already Sat/Sun)
    const day = today.getDay(); // 0 Sun ... 6 Sat
    const sat = new Date(today);
    if (day === 0) sat.setDate(sat.getDate() - 1); // Sunday -> yesterday Sat
    else if (day !== 6) sat.setDate(sat.getDate() + (6 - day));
    const sun = new Date(sat);
    sun.setDate(sun.getDate() + 1);
    return { from: toYMD(sat), to: toYMD(sun) };
  }
  return {};
}

export default function SearchScreen() {
  const navigation = useNavigation<any>();

  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null); // UI only for MVP
  const [spotsOnly, setSpotsOnly] = useState(false); // UI only unless API supports

  const [recent, setRecent] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EventCard[]>([]);

  useEffect(() => {
    getActiveCategories()
      .then((c) => setCategories(c || []))
      .catch(() => setCategories([]));

    AsyncStorage.getItem(RECENT_KEY)
      .then((raw) => {
        if (raw) setRecent(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const saveRecent = async (term: string) => {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...recent.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8);
    setRecent(next);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (categoryId !== "all") {
      const name = categories.find((c) => c.id === categoryId)?.name || "Category";
      chips.push({
        key: "cat",
        label: name,
        onClear: () => setCategoryId("all"),
      });
    }
    if (datePreset) {
      const label =
        datePreset === "today"
          ? "Today"
          : datePreset === "tomorrow"
          ? "Tomorrow"
          : "This Weekend";
      chips.push({ key: "date", label, onClear: () => setDatePreset(null) });
    }
    if (distance) {
      chips.push({
        key: "dist",
        label: distance === "any" ? "Any" : `${distance} km`,
        onClear: () => setDistance(null),
      });
    }
    return chips;
  }, [categoryId, datePreset, distance, categories]);

  const runSearch = async () => {
    setLoading(true);
    setShowResults(true);
    try {
      if (query.trim()) await saveRecent(query);

      const range = dateRange(datePreset);
      const res = await api.get("/events", {
        params: {
          q: query.trim() || undefined,
          category_id: categoryId !== "all" ? categoryId : undefined,
          date_from: range.from,
          date_to: range.to,
        },
      });
      setResults(res.data?.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setQuery("");
    setCategoryId("all");
    setDatePreset(null);
    setDistance(null);
    setSpotsOnly(false);
    setShowResults(false);
    setResults([]);
  };

  const Chip = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active?: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: active ? colors.brand.primary : colors.background.subtle,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text
        style={{
          color: active ? "#fff" : colors.text.secondary,
          fontWeight: "600",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // RESULTS VIEW
  if (showResults) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.page }}>
        <View
          style={{
            paddingTop: 54,
            paddingHorizontal: 16,
            paddingBottom: 12,
            backgroundColor: colors.background.default,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View
            style={{
              flex: 1,
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
              value={query}
              onChangeText={setQuery}
              placeholder="Search events..."
              placeholderTextColor={colors.text.disabled}
              style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: colors.text.primary }}
              onSubmitEditing={runSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity onPress={() => setShowResults(false)}>
            <Text style={{ color: colors.brand.primary, fontWeight: "600" }}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Active filters */}
        {activeFilterChips.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
          >
            {activeFilterChips.map((c) => (
              <TouchableOpacity
                key={c.key}
                onPress={c.onClear}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.brand.primaryLight,
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: colors.brand.primary, fontWeight: "600", marginRight: 6 }}>
                  {c.label}
                </Text>
                <Ionicons name="close" size={14} color={colors.brand.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={colors.brand.primary} />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            ListHeaderComponent={
              results.length > 0 ? (
                <Text style={{ marginBottom: 12, color: colors.text.secondary }}>
                  {results.length} results found
                </Text>
              ) : null
            }
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 24 }}>
                <Ionicons name="file-tray-outline" size={72} color={colors.brand.primary} />
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
                  }}
                >
                  Try adjusting your filters or search terms.
                </Text>
                <TouchableOpacity
                  onPress={clearAll}
                  style={{
                    marginTop: 20,
                    backgroundColor: colors.brand.primary,
                    borderRadius: 28,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Clear Filters</Text>
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
                    <Image source={{ uri: img }} style={{ width: "100%", height: 150 }} />
                  ) : (
                    <View
                      style={{
                        height: 150,
                        backgroundColor: colors.background.subtle,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="image-outline" size={28} color={colors.text.tertiary} />
                    </View>
                  )}
                  <View style={{ padding: 14 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text.primary }}>
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
        )}
      </View>
    );
  }

  // FILTER VIEW
  return (
    <View style={{ flex: 1, backgroundColor: colors.background.default }}>
      <View
        style={{
          paddingTop: 54,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border.focus,
            borderRadius: 12,
            paddingHorizontal: 12,
          }}
        >
          <Ionicons name="search" size={18} color={colors.text.tertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search events..."
            placeholderTextColor={colors.text.disabled}
            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: colors.text.primary }}
            onSubmitEditing={runSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.brand.primary, fontWeight: "600" }}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Recent */}
        {recent.length > 0 ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontWeight: "700", color: colors.text.primary, marginBottom: 10 }}>
              Recent
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {recent.map((r) => (
                <Chip
                  key={r}
                  label={r}
                  onPress={() => {
                    setQuery(r);
                  }}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* Category */}
        <Text style={{ fontWeight: "700", color: colors.text.primary, marginBottom: 10 }}>
          Category
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 18 }}>
          <Chip
            label="All"
            active={categoryId === "all"}
            onPress={() => setCategoryId("all")}
          />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              active={categoryId === c.id}
              onPress={() => setCategoryId(c.id)}
            />
          ))}
        </View>

        {/* Date */}
        <Text style={{ fontWeight: "700", color: colors.text.primary, marginBottom: 10 }}>
          Date
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 18 }}>
          <Chip label="Today" active={datePreset === "today"} onPress={() => setDatePreset(datePreset === "today" ? null : "today")} />
          <Chip label="Tomorrow" active={datePreset === "tomorrow"} onPress={() => setDatePreset(datePreset === "tomorrow" ? null : "tomorrow")} />
          <Chip label="This Weekend" active={datePreset === "weekend"} onPress={() => setDatePreset(datePreset === "weekend" ? null : "weekend")} />
        </View>

        {/* Distance (UI only for MVP) */}
        <Text style={{ fontWeight: "700", color: colors.text.primary, marginBottom: 10 }}>
          Distance
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 18 }}>
          {["1", "2", "5", "10", "any"].map((d) => (
            <Chip
              key={d}
              label={d === "any" ? "Any" : `${d} km`}
              active={distance === d}
              onPress={() => setDistance(distance === d ? null : d)}
            />
          ))}
        </View>

        {/* Availability */}
        <Text style={{ fontWeight: "700", color: colors.text.primary, marginBottom: 10 }}>
          Availability
        </Text>
        <TouchableOpacity
          onPress={() => setSpotsOnly((v) => !v)}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}
        >
          <View
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              backgroundColor: spotsOnly ? colors.brand.primary : colors.border.default,
              justifyContent: "center",
              paddingHorizontal: 3,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: "#fff",
                alignSelf: spotsOnly ? "flex-end" : "flex-start",
              }}
            />
          </View>
          <Text style={{ marginLeft: 12, color: colors.text.secondary }}>
            Only events with spots left
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom actions */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border.default,
          backgroundColor: colors.background.default,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={clearAll}>
          <Text style={{ color: colors.brand.primary, fontWeight: "600" }}>Clear All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={runSearch}
          style={{
            backgroundColor: colors.brand.primary,
            borderRadius: 28,
            paddingHorizontal: 28,
            paddingVertical: 14,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Show Results</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}