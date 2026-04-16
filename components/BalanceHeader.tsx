import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface BalanceHeaderProps {
  pontos: number;
  ofensiva: number;
  depositoHoje: boolean;
  recuperadoresOfensiva: number;
  onUsarRecuperador: () => void;
}

export function BalanceHeader({
  pontos,
  ofensiva,
  depositoHoje,
  recuperadoresOfensiva,
  onUsarRecuperador,
}: BalanceHeaderProps) {
  const ofensivaAtiva = depositoHoje || ofensiva === 0;
  const corOfensiva = ofensivaAtiva ? "#f1c40f" : "#aaa";

  return (
    <View style={styles.container}>
      {/* Badge de pontos */}
      <View style={styles.badge}>
        <Text style={styles.badgeEmoji}>✨</Text>
        <Text style={styles.badgeValor}>{pontos}</Text>
        <Text style={styles.badgeLabel}>pts</Text>
      </View>

      {/* Badge de ofensiva */}
      <View style={[styles.badge, styles.badgeOfensiva, { borderColor: corOfensiva }]}>
        <Text style={styles.badgeEmoji}>🔥</Text>
        <Text style={[styles.badgeValor, { color: corOfensiva }]}>{ofensiva}</Text>
        <Text style={[styles.badgeLabel, { color: corOfensiva }]}>
          {ofensiva === 1 ? "dia" : "dias"}
        </Text>
      </View>

      {/* Botão de recuperador — só aparece se a ofensiva está em risco */}
      {!ofensivaAtiva && recuperadoresOfensiva > 0 && (
        <TouchableOpacity style={styles.botaoRecuperar} onPress={onUsarRecuperador}>
          <Text style={styles.botaoRecuperarTexto}>
            🛡️ {recuperadoresOfensiva}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#6c5ce7",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeOfensiva: {
    borderWidth: 1.5,
  },
  badgeEmoji: {
    fontSize: 16,
  },
  badgeValor: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
  },
  badgeLabel: {
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    fontSize: 12,
  },
  botaoRecuperar: {
    backgroundColor: "#f1c40f",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  botaoRecuperarTexto: {
    color: "#2d3436",
    fontWeight: "bold",
    fontSize: 15,
  },
});
