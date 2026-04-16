import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface DepositButtonsProps {
  onDeposit: (valor: number) => void;
}

const DEPOSIT_VALUES = [1, 5, 10];

export function DepositButtons({ onDeposit }: DepositButtonsProps) {
  return (
    <View style={styles.gridBotoes}>
      {DEPOSIT_VALUES.map((valor) => (
        <TouchableOpacity
          key={valor}
          style={styles.botaoPeq}
          onPress={() => onDeposit(valor)}
        >
          <Text style={styles.botaoText}>+ R$ {valor}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridBotoes: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    justifyContent: "center",
  },
  botaoPeq: {
    backgroundColor: "#6c5ce7",
    paddingVertical: 15,
    flex: 1,
    borderRadius: 20,
    alignItems: "center",
    elevation: 4,
  },
  botaoText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
