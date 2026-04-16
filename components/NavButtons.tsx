import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface NavItem {
  emoji: string;
  label: string;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  { emoji: "🛍️", label: "Loja", route: "/loja" },
  { emoji: "🎯", label: "Metas", route: "/objetivo" },
];

export function NavButtons() {
  const router = useRouter();

  return (
    <View style={styles.gridNavegacao}>
      {NAV_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.route}
          style={styles.botaoNavegar}
          onPress={() => router.push(item.route as any)}
        >
          <Text style={styles.emojiNav}>{item.emoji}</Text>
          <Text style={styles.txtNav}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridNavegacao: {
    width: "100%",
    flexDirection: "row",
    gap: 15,
    marginTop: 30,
  },
  botaoNavegar: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 2,
  },
  emojiNav: { fontSize: 24 },
  txtNav: { fontWeight: "bold", color: "#333", marginTop: 5 },
});
