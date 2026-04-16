import React from "react";
import { StyleSheet, View } from "react-native";

interface PigHatProps {
  chapeuEquipado: string | null;
}

export function PigHat({ chapeuEquipado }: PigHatProps) {
  if (chapeuEquipado === "chapeu_topo") {
    return (
      <View style={styles.posicaoCartola}>
        <View style={styles.cartolaTopo} />
        <View style={styles.cartolaBase} />
        <View style={styles.cartolaFaixa} />
      </View>
    );
  }

  if (chapeuEquipado === "chapeu_bone") {
    return (
      <View style={styles.posicaoBone}>
        <View style={styles.boneCorpo} />
        <View style={styles.boneAba} />
        <View style={styles.boneBotao} />
      </View>
    );
  }

  if (chapeuEquipado === "chapeu_palha") {
    return (
      <View style={styles.posicaoPalha}>
        <View style={styles.palhaAba} />
        <View style={styles.palhaCorpo} />
        <View style={styles.palhaFaixa} />
      </View>
    );
  }

  if (chapeuEquipado === "chapeu_festa") {
    return (
      <View style={styles.posicaoFesta}>
        <View style={styles.festaCone} />
        <View style={styles.festaEstrela} />
        <View style={styles.festaPompon} />
      </View>
    );
  }

  if (chapeuEquipado === "chapeu_coroa") {
    return (
      <View style={styles.posicaoCoroa}>
        <View style={styles.coroaBase} />
        <View style={[styles.coroaPonta, { left: 2 }]} />
        <View style={[styles.coroaPonta, { left: 14, top: -14 }]} />
        <View style={[styles.coroaPonta, { right: 2 }]} />
        <View style={[styles.coroaGema, { left: 5 }]} />
        <View style={[styles.coroaGema, { left: 19 }]} />
        <View style={[styles.coroaGema, { right: 5 }]} />
      </View>
    );
  }

  if (chapeuEquipado === "chapeu_cowboy") {
    return (
      <View style={styles.posicaoCowboy}>
        <View style={styles.cowboyAba} />
        <View style={styles.cowboyCorpo} />
        <View style={styles.cowboyFaixa} />
        <View style={styles.cowboyFivela} />
      </View>
    );
  }

  if (chapeuEquipado === "chapeu_mago") {
    return (
      <View style={styles.posicaoMago}>
        <View style={styles.magoCone} />
        <View style={styles.magoAba} />
        <View style={styles.magoFaixa} />
        <View style={[styles.magoEstrela, { top: 10, left: 8 }]} />
        <View
          style={[
            styles.magoEstrela,
            { top: 24, left: 3, width: 5, height: 5 },
          ]}
        />
      </View>
    );
  }

  if (chapeuEquipado === "chapeu_noel") {
    return (
      <View style={styles.posicaoNoel}>
        <View style={styles.noelCone} />
        <View style={styles.noelAba} />
        <View style={styles.noelPompon} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  // ── Cartola ──────────────────────────────────────────────
  posicaoCartola: {
    position: "absolute",
    top: -40,
    left: 25,
    zIndex: 10,
    alignItems: "center",
  },
  cartolaTopo: {
    width: 40,
    height: 35,
    backgroundColor: "#2d3436",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  cartolaBase: {
    width: 60,
    height: 8,
    backgroundColor: "#2d3436",
    borderRadius: 4,
    marginTop: -2,
  },
  cartolaFaixa: {
    width: 40,
    height: 8,
    backgroundColor: "#e84393",
    position: "absolute",
    top: 20,
  },

  // ── Boné ─────────────────────────────────────────────────
  posicaoBone: {
    position: "absolute",
    top: -30,
    left: 30,
    zIndex: 10,
    alignItems: "center",
    transform: [{ rotate: "-5deg" }],
  },
  boneCorpo: {
    width: 50,
    height: 30,
    backgroundColor: "#0984e3",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  boneAba: {
    width: 40,
    height: 8,
    backgroundColor: "#0984e3",
    borderRadius: 4,
    position: "absolute",
    bottom: -2,
    right: -25,
    transform: [{ rotate: "15deg" }],
  },
  boneBotao: {
    width: 8,
    height: 8,
    backgroundColor: "#fff",
    borderRadius: 4,
    position: "absolute",
    top: -2,
  },

  // ── Chapéu de Palha ──────────────────────────────────────
  posicaoPalha: {
    position: "absolute",
    top: -35,
    left: 20,
    zIndex: 10,
    alignItems: "center",
  },
  palhaCorpo: {
    width: 44,
    height: 26,
    backgroundColor: "#d4a843",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 2,
    borderColor: "#b8882a",
  },
  palhaAba: {
    width: 68,
    height: 10,
    backgroundColor: "#d4a843",
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#b8882a",
    marginTop: -2,
    top: 28,
    zIndex: 10,
  },
  palhaFaixa: {
    width: 38,
    height: 6,
    backgroundColor: "#8B5E1A",
    position: "absolute",
    top: 16,
  },

  // ── Cone de Festa ────────────────────────────────────────
  posicaoFesta: {
    position: "absolute",
    top: -41,
    left: 38,
    zIndex: 10,
    alignItems: "center",
    transform: [{ rotate: "10deg" }],
  },
  festaCone: {
    width: 0,
    height: 0,
    borderLeftWidth: 18,
    borderRightWidth: 18,
    borderBottomWidth: 42,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#e84393",
  },
  festaEstrela: {
    width: 10,
    height: 10,
    backgroundColor: "#f1c40f",
    borderRadius: 2,
    position: "absolute",
    top: 3,
    left: 13,
    transform: [{ rotate: "45deg" }],
  },
  festaPompon: {
    width: 12,
    height: 12,
    backgroundColor: "#fff",
    borderRadius: 6,
    position: "absolute",
    top: -6,
    left: 12,
  },

  // ── Coroa ────────────────────────────────────────────────
  posicaoCoroa: {
    position: "absolute",
    top: -30,
    left: 30,
    zIndex: 10,
    width: 50,
    height: 24,
  },
  coroaBase: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 14,
    top: 10,
    backgroundColor: "#f1c40f",
    borderRadius: 3,
  },
  coroaPonta: {
    position: "absolute",
    bottom: 10,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 16,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#f1c40f",
  },
  coroaGema: {
    position: "absolute",
    bottom: 2,
    width: 7,
    height: 7,
    backgroundColor: "#e84393",
    borderRadius: 3.5,
  },

  // ── Cowboy ───────────────────────────────────────────────
  posicaoCowboy: {
    position: "absolute",
    top: -34,
    left: 18,
    zIndex: 10,
    alignItems: "center",
  },
  cowboyCorpo: {
    width: 48,
    height: 28,
    backgroundColor: "#6B3A2A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  cowboyAba: {
    width: 74,
    height: 10,
    backgroundColor: "#6B3A2A",
    borderRadius: 5,
    marginTop: -3,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    top: 28,
    zIndex: 10,
  },
  cowboyFaixa: {
    width: 48,
    height: 6,
    backgroundColor: "#2d1a0e",
    position: "absolute",
    top: 18,
  },
  cowboyFivela: {
    width: 8,
    height: 6,
    backgroundColor: "#f1c40f",
    borderRadius: 2,
    position: "absolute",
    top: 18,
    left: 20,
  },

  // ── Mago ─────────────────────────────────────────────────
  posicaoMago: {
    position: "absolute",
    top: -52,
    left: 25,
    zIndex: 10,
    alignItems: "center",
  },
  magoCone: {
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 48,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#4a0080",
  },
  magoAba: {
    width: 58,
    height: 10,
    backgroundColor: "#4a0080",
    borderRadius: 5,
    marginTop: -3,
  },
  magoFaixa: {
    width: 32,
    height: 5,
    backgroundColor: "#9b59b6",
    position: "absolute",
    bottom: 10,
  },
  magoEstrela: {
    position: "absolute",
    width: 7,
    height: 7,
    backgroundColor: "#f1c40f",
    borderRadius: 1,
    transform: [{ rotate: "45deg" }],
  },

  // ── Gorro de Natal ───────────────────────────────────────
  posicaoNoel: {
    position: "absolute",
    top: -42,
    left: 30,
    zIndex: 10,
    alignItems: "center",
    transform: [{ rotate: "15deg" }],
  },
  noelCone: {
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderBottomWidth: 46,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#e74c3c",
  },
  noelAba: {
    width: 52,
    height: 12,
    backgroundColor: "#fff",
    borderRadius: 6,
    marginTop: -4,
  },
  noelPompon: {
    width: 14,
    height: 14,
    backgroundColor: "#fff",
    borderRadius: 7,
    position: "absolute",
    top: -8,
    left: 13,
  },
});
