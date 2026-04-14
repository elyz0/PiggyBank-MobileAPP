import React, { useEffect } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSaldo } from "./_layout";

export default function HomeScreen() {
  const { metas, setMetas, metaAtivaId } = useSaldo();
  const metaAtiva = metas.find((m) => m.id === metaAtivaId);
  const guardado = metaAtiva ? metaAtiva.valorGuardado : 0;
  const total = metaAtiva ? metaAtiva.valorTotal : 0;

  useEffect(() => {
    if (total > 0 && guardado >= total) {
      Alert.alert("Sucesso!", "Você atingiu sua meta!");
    }
  }, [guardado, total]);

  const realizarDeposito = (valor: number) => {
    if (!metaAtivaId) return Alert.alert("Erro", "Crie uma meta!");

    const novasMetas = metas.map((m) =>
      m.id === metaAtivaId
        ? { ...m, valorGuardado: m.valorGuardado + valor }
        : m,
    );
    setMetas(novasMetas);
  };

  return (
    <View style={styles.container}>
      <Text>Meta: {metaAtiva?.nome || "Nenhuma"}</Text>
      <Text>Guardado: R$ {guardado.toFixed(2)}</Text>
      <TouchableOpacity onPress={() => realizarDeposito(10)} style={styles.btn}>
        <Text>Depositar R$ 10</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  btn: { backgroundColor: "#6c5ce7", padding: 20, marginTop: 10 },
});
