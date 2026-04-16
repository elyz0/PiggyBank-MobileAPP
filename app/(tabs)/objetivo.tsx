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
import { Meta } from "../../models";
import { toMetaView } from "../../services/metaViewService";
import { calcularPlanoOriginal } from "../../utils/Calculos";
import { useSaldo } from "./_layout";

function dataPadraoPrazo(): string {
  const data = new Date();
  data.setDate(data.getDate() + 30);
  return data.toISOString().slice(0, 10);
}

function textoStatus(status: string): string {
  if (status === "concluida") return "Concluida";
  if (status === "vencida") return "Vencida";
  return "Em andamento";
}

export default function ObjetivoScreen() {
  const {
    metas,
    metaAtivaId,
    carregandoMetas,
    setMetaAtivaId,
    criarMeta,
    editarMeta,
    excluirMeta,
  } = useSaldo();

  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [dataPrazo, setDataPrazo] = useState(dataPadraoPrazo());
  const [editandoMetaId, setEditandoMetaId] = useState<string | null>(null);

  const valorNumero = Number(valor.replace(",", "."));

  const planoPreview = useMemo(() => {
    if (!Number.isFinite(valorNumero) || valorNumero <= 0) return null;
    try {
      return calcularPlanoOriginal(valorNumero, dataPrazo);
    } catch {
      return null;
    }
  }, [dataPrazo, valorNumero]);

  const limparFormulario = () => {
    setNome("");
    setValor("");
    setDataPrazo(dataPadraoPrazo());
    setEditandoMetaId(null);
  };

  const validarEntrada = () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "Informe o nome da meta.");
      return false;
    }

    if (!Number.isFinite(valorNumero) || valorNumero <= 0) {
      Alert.alert("Erro", "Informe um valor valido para a meta.");
      return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataPrazo)) {
      Alert.alert("Erro", "Use o formato de data YYYY-MM-DD.");
      return false;
    }

    return true;
  };

  const salvarMeta = async () => {
    if (!validarEntrada()) return;

    try {
      if (editandoMetaId) {
        const atual = metas.find((meta) => meta.id === editandoMetaId);
        if (!atual) {
          Alert.alert("Erro", "Meta para edicao nao encontrada.");
          return;
        }

        await editarMeta({
          ...atual,
          nome: nome.trim(),
          valorMeta: valorNumero,
          dataPrazo,
        });
        Alert.alert("Sucesso", "Meta atualizada com sucesso.");
      } else {
        await criarMeta(nome.trim(), valorNumero, dataPrazo);
        Alert.alert("Sucesso", "Meta criada com sucesso.");
      }
      limparFormulario();
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao salvar meta.");
    }
  };

  const prepararEdicao = (meta: Meta) => {
    setEditandoMetaId(meta.id);
    setNome(meta.nome);
    setValor(String(meta.valorMeta));
    setDataPrazo(meta.dataPrazo);
  };

  const confirmarExclusao = (meta: Meta) => {
    Alert.alert("Excluir meta", `Deseja excluir "${meta.nome}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await excluirMeta(meta.id);
          if (editandoMetaId === meta.id) limparFormulario();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Metas</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nome da meta</Text>
        <TextInput
          style={styles.input}
          value={nome}
          onChangeText={setNome}
          placeholder="Ex: Viagem"
        />

        <Text style={styles.label}>Valor total</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={valor}
          onChangeText={setValor}
          placeholder="0.00"
        />

        <Text style={styles.label}>Prazo (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={dataPrazo}
          onChangeText={setDataPrazo}
          placeholder="2026-12-31"
          autoCapitalize="none"
        />

        {planoPreview && (
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>Plano original (previa)</Text>
            <Text style={styles.previewItem}>Diario: R$ {planoPreview.diario.toFixed(2)}</Text>
            <Text style={styles.previewItem}>Semanal: R$ {planoPreview.semanal.toFixed(2)}</Text>
            <Text style={styles.previewItem}>Mensal: R$ {planoPreview.mensal.toFixed(2)}</Text>
          </View>
        )}

        <View style={styles.row}>
          <TouchableOpacity style={styles.botaoSalvar} onPress={salvarMeta}>
            <Text style={styles.botaoSalvarTexto}>
              {editandoMetaId ? "Salvar alteracoes" : "Criar meta"}
            </Text>
          </TouchableOpacity>
          {editandoMetaId && (
            <TouchableOpacity style={styles.botaoSecundario} onPress={limparFormulario}>
              <Text style={styles.botaoSecundarioTexto}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.subtitulo}>Suas metas</Text>
      {carregandoMetas ? (
        <Text style={styles.vazio}>Carregando metas...</Text>
      ) : metas.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma meta criada.</Text>
      ) : (
        metas.map((meta) => {
          const view = toMetaView(meta);
          const ativa = meta.id === metaAtivaId;
          return (
            <View key={meta.id} style={[styles.metaCard, ativa && styles.metaCardAtiva]}>
              <View style={styles.metaHeader}>
                <Text style={styles.metaNome}>{meta.nome}</Text>
                <Text
                  style={[
                    styles.status,
                    view.status === "concluida" && styles.statusConcluida,
                    view.status === "vencida" && styles.statusVencida,
                  ]}
                >
                  {textoStatus(view.status)}
                </Text>
              </View>

              <Text style={styles.metaTexto}>
                R$ {meta.valorAtual.toFixed(2)} de R$ {meta.valorMeta.toFixed(2)}
              </Text>
              <Text style={styles.metaTexto}>Prazo: {meta.dataPrazo}</Text>
              <Text style={styles.metaTexto}>Progresso: {view.progresso.toFixed(1)}%</Text>

              <Text style={styles.secao}>Plano original</Text>
              <Text style={styles.metaTexto}>Diario: R$ {view.planoOriginal.diario.toFixed(2)}</Text>
              <Text style={styles.metaTexto}>Semanal: R$ {view.planoOriginal.semanal.toFixed(2)}</Text>
              <Text style={styles.metaTexto}>Mensal: R$ {view.planoOriginal.mensal.toFixed(2)}</Text>

              <Text style={styles.secao}>Plano ajustado</Text>
              <Text style={styles.metaTexto}>Diario: R$ {view.planoAjustado.diario.toFixed(2)}</Text>
              <Text style={styles.metaTexto}>Semanal: R$ {view.planoAjustado.semanal.toFixed(2)}</Text>
              <Text style={styles.metaTexto}>Mensal: R$ {view.planoAjustado.mensal.toFixed(2)}</Text>

              <View style={styles.row}>
                <TouchableOpacity style={styles.chip} onPress={() => setMetaAtivaId(meta.id)}>
                  <Text style={styles.chipText}>{ativa ? "Meta ativa" : "Definir foco"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chip} onPress={() => prepararEdicao(meta)}>
                  <Text style={styles.chipText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.chip, styles.chipDanger]} onPress={() => confirmarExclusao(meta)}>
                  <Text style={styles.chipText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, backgroundColor: "#f5f6fa" },
  titulo: { fontSize: 26, fontWeight: "700", color: "#222", marginBottom: 12, textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#d7dbe0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#222",
    backgroundColor: "#fff",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" },
  botaoSalvar: { backgroundColor: "#2e7d32", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  botaoSalvarTexto: { color: "#fff", fontWeight: "700" },
  botaoSecundario: { backgroundColor: "#eceff1", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  botaoSecundarioTexto: { color: "#333", fontWeight: "600" },
  previewBox: { backgroundColor: "#f1f7ff", borderRadius: 10, padding: 10, marginTop: 12 },
  previewTitle: { fontWeight: "700", color: "#153f6f", marginBottom: 4 },
  previewItem: { color: "#153f6f", fontSize: 13 },
  subtitulo: { fontSize: 20, fontWeight: "700", color: "#222", marginBottom: 10 },
  vazio: { color: "#687280", textAlign: "center", fontStyle: "italic", marginVertical: 12 },
  metaCard: { backgroundColor: "#fff", borderRadius: 14, padding: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: "#cfd8dc" },
  metaCardAtiva: { borderLeftColor: "#3949ab", backgroundColor: "#f7f8ff" },
  metaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  metaNome: { fontSize: 17, fontWeight: "700", color: "#222", flex: 1, paddingRight: 8 },
  status: { fontSize: 12, fontWeight: "700", color: "#5d6d7e" },
  statusConcluida: { color: "#2e7d32" },
  statusVencida: { color: "#c62828" },
  metaTexto: { color: "#37474f", fontSize: 13, marginTop: 2 },
  secao: { marginTop: 8, fontSize: 13, fontWeight: "700", color: "#263238" },
  chip: { backgroundColor: "#e8eaf6", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  chipDanger: { backgroundColor: "#ffebee" },
  chipText: { color: "#283593", fontWeight: "700", fontSize: 12 },
});
