import React from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Piggy } from "./Piggy";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
export const NUM_MOEDAS_FESTA = 15;

interface PiggyAreaProps {
  moedaY: Animated.Value;
  porquinhoScale: Animated.Value;
  estrelasOpacity: Animated.Value;
  marteloY: Animated.Value;
  marteloRotate: Animated.Value;
  porquinhoShake: Animated.Value;
  porquinhoOpacity: Animated.Value;
  moedasFestaAnim: Array<{ xy: Animated.ValueXY; opacity: Animated.Value }>;
  chapeuEquipado: string | null;
  objetivoAlcancado: boolean;
  animacaoFestaRodando: boolean;
  onRecomecar: () => void;
  onDeposit: (valor: number) => void;
}

const DEPOSIT_VALUES = [1, 5, 10, 20, 50];

export function PiggyArea({
  moedaY,
  porquinhoScale,
  estrelasOpacity,
  marteloY,
  marteloRotate,
  porquinhoShake,
  porquinhoOpacity,
  moedasFestaAnim,
  chapeuEquipado,
  objetivoAlcancado,
  animacaoFestaRodando,
  onRecomecar,
  onDeposit,
}: PiggyAreaProps) {
  const marteloRotationInterpolate = marteloRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-45deg"],
  });

  return (
    <View>
      <View style={styles.areaPorquinho}>
        {/* Hammer */}
        <Animated.View
          style={[
            styles.martelo,
            {
              transform: [
                { translateY: marteloY },
                { rotate: marteloRotationInterpolate },
              ],
            },
          ]}
        />

        {/* Festa coins */}
        {moedasFestaAnim.map((moeda, index) => (
          <Animated.View
            key={index}
            style={[
              styles.moedaFesta,
              {
                opacity: moeda.opacity,
                transform: moeda.xy.getTranslateTransform(),
              },
            ]}
          />
        ))}

        {/* Pig + coin + stars */}
        <Animated.View
          style={[
            styles.areaAnimacao,
            {
              opacity: porquinhoOpacity,
              transform: [{ translateX: porquinhoShake }],
            },
          ]}
        >
          <Animated.View
            style={[styles.moeda, { transform: [{ translateY: moedaY }] }]}
          />
          <Animated.View
            style={[styles.containerEstrelas, { opacity: estrelasOpacity }]}
          >
            <View style={[styles.estrela, { top: -10, left: 20 }]} />
            <View style={[styles.estrela, { top: -25, left: 55 }]} />
            <View style={[styles.estrela, { top: -10, right: 20 }]} />
          </Animated.View>
          <Piggy scaleAnim={porquinhoScale} chapeuEquipado={chapeuEquipado} />
        </Animated.View>

        {/* Goal reached overlay */}
        {objetivoAlcancado && !animacaoFestaRodando && (
          <View style={styles.containerFestaTextos}>
            <Text style={styles.textoParabens}>🎉 META ALCANÇADA! 🎉</Text>
            <TouchableOpacity
              style={styles.botaoRecomecar}
              onPress={onRecomecar}
            >
              <Text style={styles.botaoTextRecomecar}>Nova Meta</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Deposit button — single large button */}
      {!objetivoAlcancado && !animacaoFestaRodando && (
        <View style={styles.depositoArea}>
          <Text style={styles.depositoLabel}>Registrar depósito</Text>
          <View style={styles.gridBotoes}>
            {DEPOSIT_VALUES.map((valor) => (
              <TouchableOpacity
                key={valor}
                style={styles.botaoPeq}
                onPress={() => onDeposit(valor)}
              >
                <Text style={styles.botaoText}>R${valor}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  areaPorquinho: {
    height: 320,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    position: "relative",
  },
  areaAnimacao: {
    width: 120,
    height: 120,
    justifyContent: "flex-end",
    alignItems: "center",
    position: "absolute",
    bottom: 130,
  },
  moeda: {
    width: 25,
    height: 25,
    backgroundColor: "#f1c40f",
    borderRadius: 12.5,
    borderWidth: 2,
    borderColor: "#d4ac0d",
    position: "absolute",
    zIndex: 5,
    top: -20,
  },
  containerEstrelas: {
    position: "absolute",
    width: 120,
    height: 100,
    top: -20,
    zIndex: 6,
  },
  estrela: {
    width: 8,
    height: 8,
    backgroundColor: "#f1c40f",
    borderRadius: 4,
    position: "absolute",
  },
  martelo: {
    width: 60,
    height: 40,
    backgroundColor: "#e63900",
    borderRadius: 5,
    borderWidth: 3,
    borderColor: "#fff",
    position: "absolute",
    top: 80,
    zIndex: 10,
  },
  moedaFesta: {
    width: 20,
    height: 20,
    backgroundColor: "#f1c40f",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d4ac0d",
    position: "absolute",
    bottom: 160,
    zIndex: 5,
  },
  containerFestaTextos: {
    alignItems: "center",
    width: "100%",
    position: "absolute",
    bottom: 20,
    zIndex: 11,
  },
  textoParabens: { fontSize: 24, fontWeight: "900", color: "#6c5ce7" },
  botaoRecomecar: {
    backgroundColor: "#fff",
    borderColor: "#6c5ce7",
    borderWidth: 2,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  botaoTextRecomecar: { color: "#6c5ce7", fontWeight: "bold" },

  // Deposit section
  depositoArea: {
    marginTop: 4,
    alignItems: "center",
  },
  depositoLabel: {
    fontSize: 13,
    color: "#aaa",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  gridBotoes: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  botaoPeq: {
    backgroundColor: "#6c5ce7",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    alignItems: "center",
    elevation: 3,
  },
  botaoText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
