import { useRef, useState } from "react";
import {
  View,
  Text,
  Dimensions,
  FlatList,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { colors } from "../../theme/colors";

type Props = NativeStackScreenProps<AuthStackParamList, "Onboarding">;

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Discover Local Events",
    description:
      "Find events happening near you based on your location and interests.",
    image: require("../../../assets/undraw_searching-everywhere_tffi.png"),
  },
  {
    id: "2",
    title: "Made for Your Interests",
    description:
      "Select what you love and get personalised event recommendations.",
    image: require("../../../assets/undraw_booking_8vl5.png"),
  },
  {
    id: "3",
    title: "Join with One Tap",
    description: "Save events and RSVP instantly. It’s that simple.",
    image: require("../../../assets/undraw_join_niai.png"),
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
  };

  const goLogin = () => navigation.replace("Login");

  const next = () => {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      goLogin();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.default }}>
      {/* Skip */}
      <View
        style={{
          paddingTop: 56,
          paddingHorizontal: 24,
          alignItems: "flex-end",
        }}
      >
        <TouchableOpacity onPress={goLogin}>
          <Text style={{ color: colors.text.secondary, fontSize: 15 }}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        renderItem={({ item }) => (
          <View
            style={{
              width,
              paddingHorizontal: 28,
              alignItems: "center",
              paddingTop: 24,
            }}
          >
            <Image
              source={item.image}
              resizeMode="contain"
              style={{
                width: width * 0.72,
                height: width * 0.72,
                marginBottom: 36,
              }}
            />

            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: colors.text.primary,
                textAlign: "center",
              }}
            >
              {item.title}
            </Text>

            <Text
              style={{
                marginTop: 12,
                fontSize: 15,
                lineHeight: 22,
                color: colors.text.secondary,
                textAlign: "center",
                paddingHorizontal: 8,
              }}
            >
              {item.description}
            </Text>
          </View>
        )}
      />

      {/* Dots */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          marginBottom: 20,
        }}
      >
        {slides.map((s, i) => (
          <View
            key={s.id}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                i === index ? colors.brand.primary : colors.border.default,
            }}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        <TouchableOpacity
          onPress={next}
          style={{
            backgroundColor: colors.brand.primary,
            borderRadius: 28,
            paddingVertical: 15,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            {index === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}