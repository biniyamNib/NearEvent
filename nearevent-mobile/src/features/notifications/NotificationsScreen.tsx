import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "../../api/notifications.api";

function relativeTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

function iconForType(type: string): keyof typeof Ionicons.glyphMap {
  const t = (type || "").toLowerCase();
  if (t.includes("rsvp") || t.includes("register")) return "checkmark-circle";
  if (t.includes("cancel")) return "close-circle";
  if (t.includes("remind")) return "time";
  if (t.includes("update") || t.includes("change")) return "refresh-circle";
  if (t.includes("approv")) return "checkmark-circle";
  return "notifications";
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await getNotifications();
      setItems(data || []);
    } catch {
      setItems([]);
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

  const onMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore for MVP
    }
  };

  const onPressItem = async (item: NotificationItem) => {
    if (!item.is_read) {
      try {
        await markNotificationRead(item.id);
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        );
      } catch {
        // ignore
      }
    }
    // optional: navigate to event if event_id exists
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.default }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 54,
          paddingHorizontal: 16,
          paddingBottom: 14,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 22, color: colors.text.primary }}>←</Text>
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 18,
            fontWeight: "700",
            color: colors.text.primary,
          }}
        >
          Notifications
        </Text>
        <TouchableOpacity onPress={onMarkAll}>
          <Text style={{ color: colors.brand.primary, fontSize: 13, fontWeight: "600" }}>
            Mark all as read
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.brand.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          contentContainerStyle={{ flexGrow: 1 }}
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
              <Ionicons name="file-tray-outline" size={72} color={colors.brand.primary} />
              <Text
                style={{
                  marginTop: 16,
                  fontSize: 18,
                  fontWeight: "700",
                  color: colors.text.primary,
                }}
              >
                No notifications yet
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const unread = !item.is_read;
            return (
              <TouchableOpacity
                onPress={() => onPressItem(item)}
                style={{
                  flexDirection: "row",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  backgroundColor: unread
                    ? colors.brand.primarySubtle
                    : colors.background.default,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border.default,
                }}
              >
                {/* unread dot */}
                <View style={{ width: 12, alignItems: "center", paddingTop: 6 }}>
                  {unread ? (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.brand.primary,
                      }}
                    />
                  ) : null}
                </View>

                <Ionicons
                  name={iconForType(item.type)}
                  size={22}
                  color={
                    item.type?.toLowerCase().includes("cancel")
                      ? colors.status.error
                      : colors.brand.primary
                  }
                  style={{ marginRight: 12, marginTop: 2 }}
                />

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: unread ? "700" : "600",
                      color: colors.text.primary,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 13,
                      color: colors.text.secondary,
                      lineHeight: 18,
                    }}
                    numberOfLines={2}
                  >
                    {item.message}
                  </Text>
                  <Text
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: colors.text.tertiary,
                    }}
                  >
                    {relativeTime(item.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}