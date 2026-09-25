import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
  Platform,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/HomeStack";
import { colors } from "../../theme/colors";
import {
  cancelRsvp,
  getEventById,
  rsvpEvent,
  saveEvent,
  unsaveEvent,
} from "../../api/events.api";
import {
  createReview,
  getEventReviews,
  getRatingSummary,
} from "../../api/reviews.api";

type Props = NativeStackScreenProps<HomeStackParamList, "EventDetails">;

const API_ORIGIN = "http://10.200.14.124:8080"; // your PC LAN IP

function formatDateTime(dateStr?: string, start?: string, end?: string) {
  if (!dateStr) return "—";
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    const dateLabel = d.toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
    const to12 = (t?: string) => {
      if (!t) return "";
      const [h, m] = t.slice(0, 5).split(":").map(Number);
      const x = new Date();
      x.setHours(h || 0, m || 0, 0, 0);
      return x.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };
    if (start && end) return `${dateLabel}, ${to12(start)} - ${to12(end)}`;
    if (start) return `${dateLabel}, ${to12(start)}`;
    return dateLabel;
  } catch {
    return dateStr;
  }
}

function relativeTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  return `${weeks} weeks ago`;
}

export default function EventDetailsScreen({ navigation, route }: Props) {
  const { eventId } = route.params;

  const [event, setEvent] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [saved, setSaved] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const load = async () => {
    try {
      const [e, r, s] = await Promise.all([
        getEventById(eventId),
        getEventReviews(eventId),
        getRatingSummary(eventId),
      ]);
      setEvent(e);
      setReviews(r || []);
      setSummary(s);
      setSaved(!!e?.is_saved);
      setRegistered(!!e?.is_registered);
    } catch {
      // MVP simple
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const banner = useMemo(() => {
    if (!event?.image_url) return null;
    return event.image_url.startsWith("http")
      ? event.image_url
      : `${API_ORIGIN}${event.image_url}`;
  }, [event]);

  const organizerName = event?.organizer_name || "Organizer";
  const organizerAvatar = event?.organizer_avatar_url
    ? event.organizer_avatar_url.startsWith("http")
      ? event.organizer_avatar_url
      : `${API_ORIGIN}${event.organizer_avatar_url}`
    : null;
  const organizerInitials = organizerName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const openInMaps = () => {
    if (event?.latitude == null || event?.longitude == null) return;
    const lat = Number(event.latitude);
    const lng = Number(event.longitude);
    const label = encodeURIComponent(event.venue_name || event.title || "Event");
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?ll=${lat},${lng}&q=${label}`
        : `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    Linking.openURL(url);
  };

  const onToggleSave = async () => {
    try {
      if (saved) {
        await unsaveEvent(eventId);
        setSaved(false);
      } else {
        await saveEvent(eventId);
        setSaved(true);
      }
    } catch {
      showToast("Could not update saved state");
    }
  };

  const onRegister = async () => {
    setActionLoading(true);
    try {
      await rsvpEvent(eventId);
      setRegistered(true);
      showToast("Registration successful");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Registration failed");
    } finally {
      setActionLoading(false);
    }
  };

  const onCancelRegistration = async () => {
    setActionLoading(true);
    try {
      await cancelRsvp(eventId);
      setRegistered(false);
      setCancelOpen(false);
      showToast("Registration canceled!");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Cancel failed");
    } finally {
      setActionLoading(false);
    }
  };

  const onSubmitReview = async () => {
    if (rating < 1) {
      setRatingError("Rating is required");
      return;
    }
    setReviewLoading(true);
    setRatingError("");
    try {
      await createReview(eventId, {
        rating,
        comment: comment.trim() || undefined,
      });
      setReviewSuccess(true);
      await load();
    } catch (err: any) {
      setRatingError(err?.response?.data?.message || "Could not submit review");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.brand.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.text.secondary }}>Event not found</Text>
      </View>
    );
  }

  const avg = Number(summary?.average_rating ?? summary?.avg_rating ?? 0);
  const count = Number(summary?.total_reviews ?? summary?.count ?? reviews.length);
  const description = event.description || "";
  const shortDescription =
    description.length > 140 && !aboutExpanded
      ? `${description.slice(0, 140).trim()}...`
      : description;

  const hasCoords = event.latitude != null && event.longitude != null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.default }}>
      {toast ? (
        <View
          style={{
            position: "absolute",
            top: 54,
            alignSelf: "center",
            zIndex: 30,
            backgroundColor: colors.status.success,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>{toast}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View
          style={{
            position: "absolute",
            top: 48,
            left: 16,
            right: 16,
            zIndex: 10,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={iconBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity onPress={onToggleSave} style={iconBtn}>
              <Ionicons
                name={saved ? "heart" : "heart-outline"}
                size={20}
                color={saved ? colors.status.error : colors.text.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={iconBtn}>
              <Ionicons name="share-outline" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {banner ? (
          <Image source={{ uri: banner }} style={{ width: "100%", height: 240 }} />
        ) : (
          <View
            style={{
              width: "100%",
              height: 240,
              backgroundColor: colors.background.subtle,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="image-outline" size={32} color={colors.text.tertiary} />
          </View>
        )}

        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text.primary }}>
            {event.title}
          </Text>
          <Text style={{ marginTop: 4, color: colors.text.secondary }}>
            {event.category_name || "Event"} · Free
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
            <Ionicons name="calendar-outline" size={16} color={colors.text.tertiary} />
            <Text style={{ marginLeft: 8, color: colors.text.secondary }}>
              {formatDateTime(event.event_date, event.start_time, event.end_time)}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
            <Ionicons name="location-outline" size={16} color={colors.text.tertiary} />
            <Text style={{ marginLeft: 8, color: colors.text.secondary }}>
              {event.venue_name || event.address || "Location TBA"}
            </Text>
          </View>

          {/* Map */}
          {hasCoords ? (
            <>
              <MapView
                style={{ marginTop: 16, height: 160, borderRadius: 12 }}
                initialRegion={{
                  latitude: Number(event.latitude),
                  longitude: Number(event.longitude),
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: Number(event.latitude),
                    longitude: Number(event.longitude),
                  }}
                  title={event.title}
                  description={event.venue_name || event.address}
                />
              </MapView>

              <TouchableOpacity onPress={openInMaps}>
                <Text
                  style={{
                    marginTop: 8,
                    color: colors.brand.primary,
                    fontWeight: "600",
                  }}
                >
                  Open in Maps
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View
              style={{
                marginTop: 16,
                height: 160,
                borderRadius: 12,
                backgroundColor: colors.background.subtle,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.text.tertiary }}>Map unavailable</Text>
            </View>
          )}

          {/* Organizer */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                overflow: "hidden",
                backgroundColor: colors.brand.primaryLight,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
              }}
            >
              {organizerAvatar ? (
                <Image source={{ uri: organizerAvatar }} style={{ width: 28, height: 28 }} />
              ) : (
                <Text style={{ color: colors.brand.primary, fontWeight: "700", fontSize: 11 }}>
                  {organizerInitials}
                </Text>
              )}
            </View>
            <Text style={{ color: colors.text.secondary }}>
              Organized by {organizerName}
            </Text>
          </View>

          <Text style={{ marginTop: 8, color: colors.status.success, fontWeight: "600" }}>
            {event.spots_left != null
              ? `${event.spots_left} spots left`
              : event.capacity
              ? `${event.capacity} capacity`
              : ""}
          </Text>

          {/* About */}
          <Text
            style={{
              marginTop: 22,
              fontSize: 16,
              fontWeight: "700",
              color: colors.text.primary,
            }}
          >
            About
          </Text>
          <Text style={{ marginTop: 8, color: colors.text.secondary, lineHeight: 21 }}>
            {shortDescription}
            {description.length > 140 ? (
              <Text
                onPress={() => setAboutExpanded((v) => !v)}
                style={{ color: colors.brand.primary, fontWeight: "600" }}
              >
                {aboutExpanded ? " Show less" : " Read more"}
              </Text>
            ) : null}
          </Text>

          {/* Ratings */}
          <Text
            style={{
              marginTop: 22,
              fontSize: 16,
              fontWeight: "700",
              color: colors.text.primary,
            }}
          >
            Ratings & Reviews
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 6 }}>
            <Text style={{ color: colors.brand.primary, fontWeight: "700" }}>
              {avg ? avg.toFixed(1) : "0.0"}
            </Text>
            <View style={{ flexDirection: "row" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Ionicons
                  key={n}
                  name={n <= Math.round(avg) ? "star" : "star-outline"}
                  size={16}
                  color="#F59E0B"
                />
              ))}
            </View>
            <Text style={{ color: colors.text.secondary }}>({count} reviews)</Text>
          </View>

          <TouchableOpacity onPress={() => setReviewOpen(true)} style={{ marginTop: 10 }}>
            <Text style={{ color: colors.brand.primary, fontWeight: "600" }}>
              Write a review
            </Text>
          </TouchableOpacity>

          <View style={{ marginTop: 8 }}>
            {reviews.length === 0 ? (
              <Text style={{ color: colors.text.tertiary, marginTop: 8 }}>
                No reviews yet
              </Text>
            ) : (
              reviews.slice(0, 8).map((r: any) => (
                <View
                  key={r.id}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border.default,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontWeight: "600", color: colors.text.primary }}>
                      {r.user_name || r.full_name || "Attendee"}
                    </Text>
                    <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>
                      {relativeTime(r.created_at)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", marginTop: 4 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Ionicons
                        key={n}
                        name={n <= Number(r.rating) ? "star" : "star-outline"}
                        size={14}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                  {r.comment ? (
                    <Text style={{ marginTop: 4, color: colors.text.secondary }}>
                      {r.comment}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
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
        }}
      >
        {!registered ? (
          <TouchableOpacity
            onPress={onRegister}
            disabled={actionLoading}
            style={{
              backgroundColor: actionLoading
                ? colors.brand.primaryLight
                : colors.brand.primary,
              borderRadius: 28,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: actionLoading ? colors.brand.primary : "#fff",
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              {actionLoading ? "Registering..." : "Register"}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              disabled
              style={{
                backgroundColor: colors.brand.primaryLight,
                borderRadius: 28,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.brand.primary, fontWeight: "600", fontSize: 16 }}>
                Registered
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCancelOpen(true)}
              style={{ marginTop: 10, alignItems: "center" }}
            >
              <Text style={{ color: colors.status.error }}>Cancel Registration</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Cancel modal */}
      <Modal transparent visible={cancelOpen} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15,23,42,0.45)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text.primary }}>
              Cancel Registration?
            </Text>
            <Text style={{ marginTop: 8, color: colors.text.secondary }}>
              Are you sure you want to cancel your registration for this event?
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 18,
                gap: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => setCancelOpen(false)}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border.default,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onCancelRegistration}
                disabled={actionLoading}
                style={{
                  backgroundColor: colors.status.error,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {actionLoading ? "Cancelling..." : "Yes"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Review modal */}
      <Modal transparent visible={reviewOpen} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15,23,42,0.45)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20 }}>
            {!reviewSuccess ? (
              <>
                <TouchableOpacity
                  onPress={() => {
                    setReviewOpen(false);
                    setRatingError("");
                  }}
                >
                  <Text style={{ color: colors.text.secondary }}>←</Text>
                </TouchableOpacity>

                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 18,
                    fontWeight: "700",
                    color: colors.text.primary,
                  }}
                >
                  Write a Review
                </Text>
                <Text style={{ marginTop: 4, color: colors.text.secondary }}>
                  {event.title}
                </Text>

                <Text style={{ marginTop: 16, color: colors.text.secondary }}>
                  Your rating <Text style={{ color: colors.status.error }}>*</Text>
                </Text>
                <View style={{ flexDirection: "row", marginTop: 8, gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity key={n} onPress={() => setRating(n)}>
                      <Ionicons
                        name={n <= rating ? "star" : "star-outline"}
                        size={28}
                        color={n <= rating ? "#F59E0B" : colors.text.tertiary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {ratingError ? (
                  <Text style={{ marginTop: 6, color: colors.status.error, fontSize: 12 }}>
                    {ratingError}
                  </Text>
                ) : null}

                <Text style={{ marginTop: 14, color: colors.text.secondary }}>
                  Your review (optional)
                </Text>
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Share your experience..."
                  placeholderTextColor={colors.text.disabled}
                  multiline
                  style={{
                    marginTop: 8,
                    minHeight: 90,
                    borderWidth: 1,
                    borderColor: colors.border.default,
                    borderRadius: 12,
                    padding: 12,
                    textAlignVertical: "top",
                    color: colors.text.primary,
                  }}
                />

                <TouchableOpacity
                  onPress={onSubmitReview}
                  disabled={reviewLoading}
                  style={{
                    marginTop: 16,
                    backgroundColor: colors.brand.primary,
                    borderRadius: 28,
                    paddingVertical: 14,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    {reviewLoading ? "Submitting..." : "Submit Review"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 18,
                    fontWeight: "700",
                    color: colors.text.primary,
                  }}
                >
                  Review Submitted
                </Text>
                <Text
                  style={{
                    marginTop: 10,
                    textAlign: "center",
                    color: colors.text.secondary,
                  }}
                >
                  Thanks for sharing your experience. Your review helps other attendees.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setReviewOpen(false);
                    setReviewSuccess(false);
                    setRating(0);
                    setComment("");
                  }}
                  style={{
                    marginTop: 18,
                    borderRadius: 28,
                    borderWidth: 1,
                    borderColor: colors.border.default,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontWeight: "600" }}>Back to event</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const iconBtn = {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: "rgba(255,255,255,0.92)",
  alignItems: "center" as const,
  justifyContent: "center" as const,
};