import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSaldo } from "./_layout";

export default function HomeScreen() {
  const router = useRouter();
  const { pontos, chapeuEquipado } = useSaldo();

  return (
    <View style={styles.containerPrincipal}>
      <View style={styles.areaControles}>
        <Text style={styles.titulo}>Economia para Minha Meta</Text>
        <Text style={styles.saldo}>R$ 0,00</Text>
        <View style={styles.badgePontos}>
          <Text style={styles.textoPontos}>✨ {pontos} Pontos</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.conteudoScroll}>
        <View style={styles.conteudoInterno}>
          <View style={styles.areaPorquinho}>
            {/* Porquinho Estático para Layout */}
            <View style={styles.porquinho}>
              {chapeuEquipado === "chapeu_topo" && (
                <View style={styles.posicaoCartola}>
                  <View style={styles.cartolaTopo} />
                  <View style={styles.cartolaBase} />
                </View>
              )}
              <View style={styles.corpoLado} />
              <View style={styles.focinhoLado} />
              <View style={styles.olhoLado} />
            </View>
          </View>

          <View style={styles.gridBotoes}>
            <TouchableOpacity style={styles.botaoPeq}>
              <Text style={styles.botaoText}>+ R$ 1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.botaoPeq}>
              <Text style={styles.botaoText}>+ R$ 5</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Mantenha apenas os estilos de layout aqui...
  containerPrincipal: { flex: 1, backgroundColor: "#fff" },
  areaControles: {
    alignItems: "center",
    height: 280,
    backgroundColor: "#6c5ce7",
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    justifyContent: "center",
  },
  titulo: { fontSize: 14, color: "#fff", opacity: 0.8 },
  saldo: { fontSize: 54, fontWeight: "900", color: "#fff" },
  // ... (restante dos estilos visuais)
});
