// components/Piggy.tsx
import React from "react";
import { Animated, StyleSheet, View } from "react-native";
import { PigHat } from "./PigHat";

interface PiggyProps {
  scaleAnim: Animated.Value;
  chapeuEquipado: string | null;
}

export function Piggy({ scaleAnim, chapeuEquipado }: PiggyProps) {
  return (
    <Animated.View
      style={[styles.porquinho, { transform: [{ scale: scaleAnim }] }]}
    >
      <PigHat chapeuEquipado={chapeuEquipado} />
      <View style={styles.orelhaLado} />
      <View style={styles.corpoLado} />
      <View style={styles.focinhoLado} />
      <View style={styles.olhoLado} />
      <View style={styles.pata} />
      <View style={styles.pataTras} />
      <View style={styles.rabo} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  porquinho: { width: 120, height: 100, alignItems: "center" },
  corpoLado: {
    width: 110,
    height: 75,
    backgroundColor: "#ff9ff3",
    borderRadius: 50,
    zIndex: 2,
  },
  focinhoLado: {
    width: 12,
    height: 22,
    backgroundColor: "#f368e0",
    borderRadius: 5,
    position: "absolute",
    left: -4,
    top: 30,
    zIndex: 3,
  },
  olhoLado: {
    width: 6,
    height: 6,
    backgroundColor: "#333",
    borderRadius: 3,
    position: "absolute",
    left: 18,
    top: 30,
    zIndex: 4,
  },
  orelhaLado: {
    width: 20,
    height: 25,
    backgroundColor: "#f368e0",
    borderRadius: 10,
    position: "absolute",
    left: 35,
    top: -10,
    transform: [{ rotate: "-10deg" }],
    zIndex: 1,
  },
  pata: {
    width: 12,
    height: 20,
    backgroundColor: "#f368e0",
    position: "absolute",
    left: 30,
    bottom: 12,
    borderRadius: 5,
  },
  pataTras: {
    width: 12,
    height: 20,
    backgroundColor: "#f368e0",
    position: "absolute",
    right: 30,
    bottom: 12,
    borderRadius: 5,
  },
  rabo: {
    width: 15,
    height: 15,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderColor: "#f368e0",
    position: "absolute",
    right: -4,
    top: 35,
    borderTopRightRadius: 10,
    transform: [{ rotate: "45deg" }],
  },
});
