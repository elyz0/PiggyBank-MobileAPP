// app/loja.tsx

import { useRouter } from "expo-router";
import React from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSaldo } from "./_layout";

// Lista ATUALIZADA apenas com Chapéus e IDs corretos
const COLECAO_CHAPEUS = [
  {
    id: "chapeu_topo",
    nome: "Cartola Especial",
    preco: 100,
    descricao: "Para porquinhos de classe.",
    icone: "🎩",
  },
  {
    id: "chapeu_bone",
    nome: "Boné Casual Azul",
    preco: 50,
    descricao: "Estilo despojado para o dia a dia.",
    icone: "🧢",
  }, // Ícone provisório
];

export default function ChapelariaScreen() {
  // Consumindo os estados renomeados do contexto
  const {
    pontos,
    setPontos,
    chapeusComprados,
    setChapeusComprados,
    chapeuEquipado,
    setChapeuEquipado,
  } = useSaldo();
  const router = useRouter();

  const gerenciarChapeu = (chapeu: (typeof COLECAO_CHAPEUS)[0]) => {
    // Se já comprou, equipa ou desequipa
    if (chapeusComprados.includes(chapeu.id)) {
      if (chapeuEquipado === chapeu.id) {
        setChapeuEquipado(""); // Desequipa se já estiver equipado
      } else {
        setChapeuEquipado(chapeu.id); // Equipa
      }
      return;
    }

    // Lógica de Compra
    if (pontos >= chapeu.preco) {
      setPontos((prev) => prev - chapeu.preco);
      setChapeusComprados((prev) => [...prev, chapeu.id]);
      setChapeuEquipado(chapeu.id); // Equipa automaticamente ao comprar
    } else {
      alert("Pontos insuficientes! Mais metas concluídas = mais chapéus! ⭐️");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.btnVoltar}>← Cofrinho</Text>
        </TouchableOpacity>
        <Text style={styles.pontoText}>{pontos} ⭐️</Text>
      </View>

      <Text style={styles.tituloLoja}>Chapelaria Real 🐷</Text>
      <Text style={styles.subtituloLoja}>
        Estilize seu companheiro de economias
      </Text>

      <FlatList
        data={COLECAO_CHAPEUS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => {
          const jaComprado = chapeusComprados.includes(item.id);
          const equipado = chapeuEquipado === item.id;

          return (
            <TouchableOpacity
              style={[styles.card, equipado && styles.cardEquipado]}
              onPress={() => gerenciarChapeu(item)}
            >
              {/* Ícone provisório em emoji, o desenho real está na Home */}
              <Text style={styles.icone}>{item.icone}</Text>
              <View style={styles.infoItem}>
                <Text style={styles.nomeItem}>{item.nome}</Text>
                <Text style={styles.descricaoItem}>{item.descricao}</Text>
                <Text
                  style={[
                    styles.statusItem,
                    jaComprado && styles.statusComprado,
                  ]}
                >
                  {equipado
                    ? "Equipado ✅"
                    : jaComprado
                      ? "Disponível (Toque para equipar)"
                      : `Comprar por ${item.preco} pts`}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

// Estilos da Chapelaria (pequenos ajustes para ficar mais temático)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa", padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
  },
  btnVoltar: { color: "#6c5ce7", fontWeight: "bold", fontSize: 16 },
  pontoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f1c40f",
    backgroundColor: "#333",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tituloLoja: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
  },
  subtituloLoja: { fontSize: 14, color: "#666", marginBottom: 20 },
  lista: { paddingBottom: 30 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 15,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardEquipado: { borderColor: "#6c5ce7" },
  icone: { fontSize: 40, marginRight: 15 },
  infoItem: { flex: 1 },
  nomeItem: { fontSize: 18, fontWeight: "bold", color: "#333" },
  descricaoItem: { fontSize: 12, color: "#888", marginVertical: 3 },
  statusItem: {
    fontSize: 13,
    color: "#6c5ce7",
    fontWeight: "600",
    marginTop: 2,
  },
  statusComprado: { color: "#2ecc71" }, // Verde para indicar que já possui
});
