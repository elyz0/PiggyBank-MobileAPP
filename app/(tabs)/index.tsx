import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { toMetaView } from "../../services/metaViewService";
import { useSaldo } from "./_layout";

function textoStatus(status: string): string {
  if (status === "concluida") return "Concluida";
  if (status === "vencida") return "Vencida";
  return "Em andamento";
}

export default function HomeScreen() {
  const {
    metas,
    aportes,
    metaAtivaId,
    setMetaAtivaId,
    registrarAporte,
    editarAporte,
    excluirAporte,
  } = useSaldo();

  const [valorAporte, setValorAporte] = useState("");
  const [aporteEditandoId, setAporteEditandoId] = useState<string | null>(null);
  const [novoValorAporte, setNovoValorAporte] = useState("");

  const metaAtiva = useMemo(
    () => metas.find((meta) => meta.id === metaAtivaId) ?? null,
    [metaAtivaId, metas],
  );
  const view = metaAtiva ? toMetaView(metaAtiva) : null;

  const salvarAporte = async (permitirExcesso = false) => {
    if (!metaAtiva) {
      Alert.alert("Atenção", "Selecione uma meta para registrar o aporte.");
      return;
    }

    const valor = Number(valorAporte.replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0) {
      Alert.alert("Erro", "Informe um valor de aporte valido.");
      return;
    }

    try {
      const resultado = await registrarAporte(metaAtiva.id, valor, permitirExcesso);
      if (resultado.excesso !== undefined && !permitirExcesso) {
        Alert.alert(
          "Aporte acima do restante",
          `Excesso de R$ ${resultado.excesso.toFixed(2)}. Deseja prosseguir mesmo assim?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Prosseguir",
              onPress: async () => {
                const final = await registrarAporte(metaAtiva.id, valor, true);
                setValorAporte("");
                if (final.excesso !== undefined && final.excesso > 0) {
                  Alert.alert(
                    "Meta concluida",
                    `Sobrou R$ ${final.excesso.toFixed(2)}. Sugestao: criar uma nova meta para esse valor.`,
                  );
                }
              },
            },
          ],
        );
        return;
      }

      setValorAporte("");
      if (resultado.excesso !== undefined && resultado.excesso > 0) {
        Alert.alert(
          "Meta concluida",
          `Sobrou R$ ${resultado.excesso.toFixed(2)}. Sugestao: criar uma nova meta para esse valor.`,
        );
      }
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao salvar aporte.");
    }
  };

  const salvarEdicaoAporte = async () => {
    if (!aporteEditandoId) return;
    const valor = Number(novoValorAporte.replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0) {
      Alert.alert("Erro", "Informe um valor valido.");
      return;
    }

    try {
      await editarAporte(aporteEditandoId, valor);
      setAporteEditandoId(null);
      setNovoValorAporte("");
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao editar aporte.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Resumo da meta</Text>

      {metas.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metaPicker}>
          {metas.map((meta) => {
            const ativo = meta.id === metaAtivaId;
            return (
              <TouchableOpacity
                key={meta.id}
                style={[styles.metaChip, ativo && styles.metaChipAtivo]}
                onPress={() => setMetaAtivaId(meta.id)}
              >
                <Text style={[styles.metaChipText, ativo && styles.metaChipTextAtivo]}>{meta.nome}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {!metaAtiva || !view ? (
        <Text style={styles.vazio}>Crie uma meta na tela Objetivo para comecar.</Text>
      ) : (
        <View style={styles.card}>
          <Text style={styles.metaNome}>{metaAtiva.nome}</Text>
          <Text style={styles.info}>Status: {textoStatus(view.status)}</Text>
          <Text style={styles.info}>
            Guardado: R$ {metaAtiva.valorAtual.toFixed(2)} de R$ {metaAtiva.valorMeta.toFixed(2)}
          </Text>
          <Text style={styles.info}>Restante: R$ {view.restante.toFixed(2)}</Text>
          <Text style={styles.info}>Progresso: {view.progresso.toFixed(1)}%</Text>

          <View style={styles.barraFundo}>
            <View style={[styles.barraFrente, { width: `${view.progresso}%` }]} />
          </View>

          <Text style={styles.secao}>Plano ajustado</Text>
          <Text style={styles.info}>Diario: R$ {view.planoAjustado.diario.toFixed(2)}</Text>
          <Text style={styles.info}>Semanal: R$ {view.planoAjustado.semanal.toFixed(2)}</Text>
          <Text style={styles.info}>Mensal: R$ {view.planoAjustado.mensal.toFixed(2)}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.secao}>Registrar aporte</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={valorAporte}
          onChangeText={setValorAporte}
          placeholder="Ex: 50.00"
        />
        <TouchableOpacity style={styles.botaoPrimario} onPress={() => salvarAporte(false)}>
          <Text style={styles.botaoPrimarioTexto}>Salvar aporte</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.secao}>Historico de aportes</Text>
        {aportes.length === 0 ? (
          <Text style={styles.vazio}>Nenhum aporte registrado para a meta ativa.</Text>
        ) : (
          aportes.map((aporte) => (
            <View key={aporte.id} style={styles.aporteLinha}>
              <View style={{ flex: 1 }}>
                <Text style={styles.info}>R$ {aporte.valor.toFixed(2)}</Text>
                <Text style={styles.data}>{new Date(aporte.data).toLocaleDateString("pt-BR")}</Text>
              </View>

              <TouchableOpacity
                style={styles.chip}
                onPress={() => {
                  setAporteEditandoId(aporte.id);
                  setNovoValorAporte(String(aporte.valor));
                }}
              >
                <Text style={styles.chipText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.chip, styles.chipDanger]} onPress={() => excluirAporte(aporte.id)}>
                <Text style={styles.chipText}>Excluir</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {aporteEditandoId && (
          <View style={styles.edicaoBox}>
            <Text style={styles.info}>Novo valor do aporte</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={novoValorAporte}
              onChangeText={setNovoValorAporte}
            />
            <View style={styles.row}>
              <TouchableOpacity style={styles.botaoPrimario} onPress={salvarEdicaoAporte}>
                <Text style={styles.botaoPrimarioTexto}>Salvar edicao</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botaoSecundario}
                onPress={() => {
                  setAporteEditandoId(null);
                  setNovoValorAporte("");
                }}
              >
                <Text style={styles.botaoSecundarioTexto}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f5f6fa", paddingBottom: 40 },
  titulo: { fontSize: 26, fontWeight: "700", color: "#222", textAlign: "center", marginBottom: 12 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 12 },
  metaPicker: { marginBottom: 10 },
  metaChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: "#eceff1", marginRight: 8 },
  metaChipAtivo: { backgroundColor: "#3949ab" },
  metaChipText: { color: "#455a64", fontWeight: "600" },
  metaChipTextAtivo: { color: "#fff" },
  metaNome: { fontSize: 20, fontWeight: "700", color: "#222", marginBottom: 6 },
  secao: { fontSize: 16, fontWeight: "700", color: "#263238", marginBottom: 8 },
  info: { color: "#37474f", fontSize: 13, marginBottom: 2 },
  vazio: { color: "#687280", textAlign: "center", fontStyle: "italic", marginVertical: 8 },
  barraFundo: { marginTop: 8, height: 10, borderRadius: 5, backgroundColor: "#dfe6e9", overflow: "hidden" },
  barraFrente: { height: "100%", backgroundColor: "#26a69a" },
  input: {
    borderWidth: 1,
    borderColor: "#d7dbe0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#222",
    backgroundColor: "#fff",
  },
  botaoPrimario: { marginTop: 10, backgroundColor: "#2e7d32", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, alignSelf: "flex-start" },
  botaoPrimarioTexto: { color: "#fff", fontWeight: "700" },
  aporteLinha: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  chip: { backgroundColor: "#e8eaf6", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  chipDanger: { backgroundColor: "#ffebee" },
  chipText: { fontWeight: "700", color: "#283593", fontSize: 12 },
  data: { color: "#78909c", fontSize: 12 },
  edicaoBox: { marginTop: 8, borderTopWidth: 1, borderTopColor: "#eceff1", paddingTop: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  botaoSecundario: { marginTop: 10, backgroundColor: "#eceff1", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  botaoSecundarioTexto: { fontWeight: "700", color: "#37474f" },
});
