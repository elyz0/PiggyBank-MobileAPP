import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
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

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.72;
const CARD_MARGIN = 10;

// ─── Helpers ────────────────────────────────────────────────────────────────

function dataPadraoPrazo(): string {
  const data = new Date();
  data.setDate(data.getDate() + 30);
  return data.toISOString().slice(0, 10);
}

function textoStatus(status: string): string {
  if (status === "concluida") return "Concluída";
  if (status === "vencida") return "Vencida";
  return "Em andamento";
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Gera uma cor e emoji determinísticos por nome de meta
const PALETA = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];
const EMOJIS = ["🎯", "✈️", "🏠", "📱", "🎓", "🚗", "💰", "🌟"];
function corDaMeta(id: string) {
  const idx = id.charCodeAt(id.length - 1) % PALETA.length;
  return PALETA[idx];
}
function emojiDaMeta(id: string) {
  const idx = id.charCodeAt(0) % EMOJIS.length;
  return EMOJIS[idx];
}

// ─── Componente: Barra de Progresso ─────────────────────────────────────────

function BarraProgresso({ pct, cor }: { pct: number; cor: string }) {
  return (
    <View style={styles.barraFundo}>
      <View style={[styles.barraPreenchida, { width: `${Math.min(pct, 100)}%`, backgroundColor: cor }]} />
    </View>
  );
}

// ─── Componente: Card no Carrossel ───────────────────────────────────────────

function CardMeta({
  meta,
  ativa,
  onDefinirFoco,
  onEditar,
  onExcluir,
}: {
  meta: Meta;
  ativa: boolean;
  onDefinirFoco: () => void;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  const view = toMetaView(meta);
  const cor = corDaMeta(meta.id);
  const emoji = emojiDaMeta(meta.id);
  const pct = view.progresso;

  const corStatus =
    view.status === "concluida"
      ? "#10B981"
      : view.status === "vencida"
      ? "#EF4444"
      : "#8892A4";

  return (
    <View
      style={[
        styles.cardMeta,
        { borderColor: ativa ? cor : cor + "33" },
        ativa && { borderWidth: 2 },
      ]}
    >
      {/* Topo: emoji + badge status */}
      <View style={styles.cardTopo}>
        <View style={[styles.emojiCirculo, { backgroundColor: cor + "22" }]}>
          <Text style={styles.cardEmoji}>{emoji}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: corStatus + "22" }]}>
          <Text style={[styles.statusBadgeTexto, { color: corStatus }]}>
            {textoStatus(view.status)}
          </Text>
        </View>
      </View>

      {/* Nome */}
      <Text style={styles.cardNome} numberOfLines={1}>
        {meta.nome}
      </Text>

      {/* Valores */}
      <Text style={styles.cardValorAtual}>{formatarMoeda(meta.valorAtual)}</Text>
      <Text style={styles.cardValorMeta}>de {formatarMoeda(meta.valorMeta)}</Text>

      {/* Barra */}
      <View style={styles.barraRow}>
        <BarraProgresso pct={pct} cor={cor} />
        <Text style={[styles.pctTexto, { color: cor }]}>{pct.toFixed(0)}%</Text>
      </View>

      {/* Prazo */}
      <Text style={styles.prazoTexto}>📅 Prazo: {meta.dataPrazo}</Text>

      {/* Plano ajustado */}
      <View style={[styles.planoBox, { backgroundColor: cor + "11" }]}>
        <Text style={[styles.planoTitulo, { color: cor }]}>Plano de depósito</Text>
        <View style={styles.planoRow}>
          <View style={styles.planoItem}>
            <Text style={styles.planoLabel}>Diário</Text>
            <Text style={styles.planoValor}>{formatarMoeda(view.planoAjustado.diario)}</Text>
          </View>
          <View style={styles.planoDivisor} />
          <View style={styles.planoItem}>
            <Text style={styles.planoLabel}>Semanal</Text>
            <Text style={styles.planoValor}>{formatarMoeda(view.planoAjustado.semanal)}</Text>
          </View>
          <View style={styles.planoDivisor} />
          <View style={styles.planoItem}>
            <Text style={styles.planoLabel}>Mensal</Text>
            <Text style={styles.planoValor}>{formatarMoeda(view.planoAjustado.mensal)}</Text>
          </View>
        </View>
      </View>

      {/* Ações */}
      <View style={styles.acoesRow}>
        <TouchableOpacity
          style={[styles.chipFoco, ativa && { backgroundColor: cor }]}
          onPress={onDefinirFoco}
        >
          <Text style={[styles.chipFocoTexto, ativa && { color: "#fff" }]}>
            {ativa ? "✓ Foco ativo" : "Definir foco"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chipIcone} onPress={onEditar}>
          <Text style={styles.chipIconeTexto}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.chipIcone, styles.chipDanger]} onPress={onExcluir}>
          <Text style={styles.chipIconeTexto}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Tela Principal ──────────────────────────────────────────────────────────

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

  const [modalVisivel, setModalVisivel] = useState(false);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [dataPrazo, setDataPrazo] = useState(dataPadraoPrazo());
  const [editandoMetaId, setEditandoMetaId] = useState<string | null>(null);
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const flatRef = useRef<FlatList>(null);

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
    setModalVisivel(false);
  };

  const validarEntrada = () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "Informe o nome da meta.");
      return false;
    }
    if (!Number.isFinite(valorNumero) || valorNumero <= 0) {
      Alert.alert("Erro", "Informe um valor válido para a meta.");
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
        const atual = metas.find((m) => m.id === editandoMetaId);
        if (!atual) {
          Alert.alert("Erro", "Meta para edição não encontrada.");
          return;
        }
        await editarMeta({ ...atual, nome: nome.trim(), valorMeta: valorNumero, dataPrazo });
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
    setModalVisivel(true);
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

  // Stats
  const totalGuardado = metas.reduce((s, m) => s + m.valorAtual, 0);
  const totalMetas = metas.reduce((s, m) => s + m.valorMeta, 0);
  const concluidas = metas.filter((m) => toMetaView(m).status === "concluida").length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F1729" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitulo}>Meus Objetivos 🎯</Text>
            <Text style={styles.headerSubtitulo}>Veja sua evolução financeira</Text>
          </View>
        </View>

        {/* ── Resumo ── */}
        <View style={styles.resumoContainer}>
          <Text style={styles.resumoLabel}>TOTAL GUARDADO</Text>
          <Text style={styles.resumoValor}>{formatarMoeda(totalGuardado)}</Text>
          <View style={styles.resumoChip}>
            <Text style={styles.resumoChipTexto}>de {formatarMoeda(totalMetas)} em metas</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🎯</Text>
              <Text style={styles.statNumero}>{metas.length}</Text>
              <Text style={styles.statLabel}>Metas ativas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>✅</Text>
              <Text style={styles.statNumero}>{concluidas}</Text>
              <Text style={styles.statLabel}>Concluídas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={styles.statNumero}>
                {metas.length > 0
                  ? (metas.reduce((s, m) => s + toMetaView(m).progresso, 0) / metas.length).toFixed(0)
                  : 0}%
              </Text>
              <Text style={styles.statLabel}>Progresso médio</Text>
            </View>
          </View>
        </View>

        {/* ── Carrossel de Metas ── */}
        <Text style={styles.secaoTitulo}>Suas metas</Text>

        {carregandoMetas ? (
          <View style={styles.vazioContainer}>
            <Text style={styles.vazioEmoji}>⏳</Text>
            <Text style={styles.vazioTitulo}>Carregando metas...</Text>
          </View>
        ) : metas.length === 0 ? (
          <View style={styles.vazioContainer}>
            <Text style={styles.vazioEmoji}>🐷</Text>
            <Text style={styles.vazioTitulo}>Nenhuma meta ainda</Text>
            <Text style={styles.vazioSub}>Crie sua primeira meta e comece a guardar dinheiro hoje!</Text>
            <TouchableOpacity style={styles.btnCriarPrimeiro} onPress={() => setModalVisivel(true)}>
              <Text style={styles.btnCriarPrimeiroTexto}>+ Criar primeira meta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatRef}
              data={metas}
              horizontal
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <CardMeta
                  meta={item}
                  ativa={item.id === metaAtivaId}
                  onDefinirFoco={() => setMetaAtivaId(item.id)}
                  onEditar={() => prepararEdicao(item)}
                  onExcluir={() => confirmarExclusao(item)}
                />
              )}
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 20 }}
              onScroll={(e) => {
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_MARGIN * 2)
                );
                setIndiceAtivo(idx);
              }}
              scrollEventThrottle={16}
            />
            {/* Dots */}
            <View style={styles.dotsRow}>
              {metas.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === indiceAtivo ? styles.dotAtivo : styles.dotInativo]}
                />
              ))}
            </View>
          </>
        )}

      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisivel(true)} activeOpacity={0.85}>
        <Text style={styles.fabTexto}>＋</Text>
      </TouchableOpacity>

      {/* ── Modal: Criar / Editar Meta ── */}
      <Modal
        visible={modalVisivel}
        animationType="slide"
        transparent
        onRequestClose={limparFormulario}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitulo}>
              {editandoMetaId ? "Editar meta" : "Nova meta"}
            </Text>

            <Text style={styles.modalLabel}>Nome da meta</Text>
            <TextInput
              style={styles.modalInput}
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Viagem dos Sonhos"
              placeholderTextColor="#4A5A7A"
            />

            <Text style={styles.modalLabel}>Valor total (R$)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="decimal-pad"
              value={valor}
              onChangeText={setValor}
              placeholder="0,00"
              placeholderTextColor="#4A5A7A"
            />

            <Text style={styles.modalLabel}>Prazo (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              value={dataPrazo}
              onChangeText={setDataPrazo}
              placeholder="2026-12-31"
              placeholderTextColor="#4A5A7A"
              autoCapitalize="none"
            />

            {planoPreview && (
              <View style={styles.previewBox}>
                <Text style={styles.previewTitulo}>Prévia do plano</Text>
                <View style={styles.planoRow}>
                  <View style={styles.planoItem}>
                    <Text style={styles.planoLabel}>Diário</Text>
                    <Text style={[styles.planoValor, { color: "#3B82F6" }]}>
                      {formatarMoeda(planoPreview.diario)}
                    </Text>
                  </View>
                  <View style={styles.planoDivisor} />
                  <View style={styles.planoItem}>
                    <Text style={styles.planoLabel}>Semanal</Text>
                    <Text style={[styles.planoValor, { color: "#3B82F6" }]}>
                      {formatarMoeda(planoPreview.semanal)}
                    </Text>
                  </View>
                  <View style={styles.planoDivisor} />
                  <View style={styles.planoItem}>
                    <Text style={styles.planoLabel}>Mensal</Text>
                    <Text style={[styles.planoValor, { color: "#3B82F6" }]}>
                      {formatarMoeda(planoPreview.mensal)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.modalBotoesRow}>
              {editandoMetaId && (
                <TouchableOpacity style={styles.btnCancelar} onPress={limparFormulario}>
                  <Text style={styles.btnCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.btnSalvar, !editandoMetaId && { flex: 1 }]}
                onPress={salvarMeta}
              >
                <Text style={styles.btnSalvarTexto}>
                  {editandoMetaId ? "Salvar alterações" : "Criar meta"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalFechar} onPress={limparFormulario}>
              <Text style={styles.modalFecharTexto}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F1729" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitulo: { color: "#FFFFFF", fontSize: 22, fontWeight: "700" },
  headerSubtitulo: { color: "#8892A4", fontSize: 13, marginTop: 2 },

  // Resumo
  resumoContainer: { marginHorizontal: 20, marginTop: 8, marginBottom: 4 },
  resumoLabel: {
    color: "#8892A4", fontSize: 11, fontWeight: "600",
    letterSpacing: 1.2, marginBottom: 4,
  },
  resumoValor: { color: "#FFFFFF", fontSize: 36, fontWeight: "700", letterSpacing: -0.5 },
  resumoChip: {
    backgroundColor: "#1E2A45", alignSelf: "flex-start",
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4,
    marginTop: 6, marginBottom: 16,
  },
  resumoChipTexto: { color: "#8892A4", fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, backgroundColor: "#1A2540", borderRadius: 16,
    paddingVertical: 14, alignItems: "center",
  },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statNumero: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  statLabel: { color: "#8892A4", fontSize: 11, marginTop: 2 },

  // Seção
  secaoTitulo: {
    color: "#FFFFFF", fontSize: 17, fontWeight: "700",
    paddingHorizontal: 20, marginTop: 24, marginBottom: 14,
  },

  // Vazio
  vazioContainer: {
    marginHorizontal: 20, backgroundColor: "#1A2540",
    borderRadius: 20, padding: 32, alignItems: "center",
  },
  vazioEmoji: { fontSize: 48, marginBottom: 12 },
  vazioTitulo: { color: "#FFFFFF", fontSize: 17, fontWeight: "700", marginBottom: 8 },
  vazioSub: { color: "#8892A4", fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  btnCriarPrimeiro: { backgroundColor: "#3B82F6", borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  btnCriarPrimeiroTexto: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },

  // Card Meta
  cardMeta: {
    width: CARD_WIDTH, backgroundColor: "#1A2540", borderRadius: 20,
    padding: 18, marginHorizontal: CARD_MARGIN, borderWidth: 1,
  },
  cardTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  emojiCirculo: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  cardEmoji: { fontSize: 24 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeTexto: { fontSize: 11, fontWeight: "700" },
  cardNome: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginBottom: 4 },
  cardValorAtual: { color: "#FFFFFF", fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  cardValorMeta: { color: "#8892A4", fontSize: 12, marginBottom: 12, marginTop: 2 },

  barraRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  barraFundo: { flex: 1, height: 6, backgroundColor: "#0F1729", borderRadius: 4, overflow: "hidden" },
  barraPreenchida: { height: "100%", borderRadius: 4 },
  pctTexto: { fontSize: 12, fontWeight: "700", width: 36, textAlign: "right" },

  prazoTexto: { color: "#8892A4", fontSize: 12, marginBottom: 12 },

  planoBox: { borderRadius: 12, padding: 12, marginBottom: 14 },
  planoTitulo: { fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.5 },
  planoRow: { flexDirection: "row", alignItems: "center" },
  planoItem: { flex: 1, alignItems: "center" },
  planoDivisor: { width: 1, height: 28, backgroundColor: "#2A3A5C" },
  planoLabel: { color: "#8892A4", fontSize: 10, marginBottom: 3 },
  planoValor: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },

  acoesRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  chipFoco: {
    flex: 1, backgroundColor: "#1E2A45", borderRadius: 10,
    paddingVertical: 8, alignItems: "center", borderWidth: 1, borderColor: "#2A3A5C",
  },
  chipFocoTexto: { color: "#8892A4", fontSize: 12, fontWeight: "700" },
  chipIcone: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#1E2A45", justifyContent: "center", alignItems: "center",
  },
  chipDanger: { backgroundColor: "#2A1520" },
  chipIconeTexto: { fontSize: 16 },

  // Dots
  dotsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 14, gap: 6 },
  dot: { height: 6, borderRadius: 3 },
  dotAtivo: { width: 20, backgroundColor: "#3B82F6" },
  dotInativo: { width: 6, backgroundColor: "#2A3A5C" },

  // FAB
  fab: {
    position: "absolute", bottom: 90, right: 20,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: "#3B82F6", justifyContent: "center", alignItems: "center",
    shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 10,
  },
  fabTexto: { color: "#FFFFFF", fontSize: 28, fontWeight: "300", marginTop: -2 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#1A2540", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: "#2A3A5C",
    borderRadius: 2, alignSelf: "center", marginBottom: 20,
  },
  modalTitulo: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginBottom: 16 },
  modalLabel: { color: "#8892A4", fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 12 },
  modalInput: {
    backgroundColor: "#0F1729", borderRadius: 12, borderWidth: 1,
    borderColor: "#2A3A5C", paddingHorizontal: 14, paddingVertical: 12,
    color: "#FFFFFF", fontSize: 15,
  },
  previewBox: {
    backgroundColor: "#3B82F611", borderRadius: 12,
    padding: 14, marginTop: 16, borderWidth: 1, borderColor: "#3B82F633",
  },
  previewTitulo: { color: "#3B82F6", fontSize: 12, fontWeight: "700", marginBottom: 10, letterSpacing: 0.5 },
  modalBotoesRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  btnSalvar: {
    flex: 2, backgroundColor: "#3B82F6", borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
  },
  btnSalvarTexto: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  btnCancelar: {
    flex: 1, backgroundColor: "#1E2A45", borderRadius: 14,
    paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#2A3A5C",
  },
  btnCancelarTexto: { color: "#8892A4", fontWeight: "600", fontSize: 15 },
  modalFechar: {
    position: "absolute", top: 20, right: 20,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#0F1729", justifyContent: "center", alignItems: "center",
  },
  modalFecharTexto: { color: "#8892A4", fontSize: 16 },
});
