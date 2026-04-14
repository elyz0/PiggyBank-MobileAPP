import React, { useRef } from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";

export default function HomeScreen() {
  const marteloY = useRef(new Animated.Value(-150)).current;
  const porquinhoShake = useRef(new Animated.Value(0)).current;

  const rodarAnimacao = () => {
    Animated.sequence([
      Animated.timing(marteloY, {
        toValue: 20,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(porquinhoShake, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start(() => marteloY.setValue(-150));
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.martelo, { transform: [{ translateY: marteloY }] }]}
      />
      <Animated.View
        style={[
          styles.porquinho,
          { transform: [{ translateX: porquinhoShake }] },
        ]}
      />

      <TouchableOpacity onPress={rodarAnimacao} style={styles.btn}>
        <Text>Testar Martelo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  martelo: {
    width: 50,
    height: 40,
    backgroundColor: "red",
    position: "absolute",
    top: 100,
  },
  porquinho: {
    width: 100,
    height: 80,
    backgroundColor: "pink",
    borderRadius: 40,
  },
  btn: { marginTop: 300 },
});
