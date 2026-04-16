import { useSaldo } from "@/app/_layout";
import { Piggy } from "@/components/Piggy";
import { Meta } from "@/models";
import { toMetaView } from "@/services/metaViewService";
import { getMetas, saveMetas } from "@/storage/metaStorage";
import { calcularPlanoOriginal } from "@/utils/Calculos";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const BRAND = "#1E3A5F";
const BRAND_MID = "#2563EB";
const BRAND_LIGHT = "#3B82F6";
const HISTORY_KEY = "@piggybank:historico_metas";

interface HistoricoItem {
  id: string;
  metaId: string;
  metaNome: string;
  tipo: "deposito" | "saque" | "criacao";
  valor: number;
  dataIso: string;
}

const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatarData = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const hojeString = () => new Date().toDateString();

function parseNumber(texto: string): number {
  return Number(texto.replace(",", "."));
}

export default function ObjetivosScreen() {
  const {
    metas,
    setMetas,
    criarMeta,
    excluirMeta,
    carregandoMetas,
    setMetaAtivaId,
    pontos,
    setPontos,
    ofensiva,
    setOfensiva,
    ultimoDeposito,
    setUltimoDeposito,
    chapeuEquipado,
  } = useSaldo();

  const [metaExpandidaId, setMetaExpandidaId] = useState<string | null>(null);
  const [nomeNovaMeta, setNomeNovaMeta] = useState("");
  const [valorMetaInput, setValorMetaInput] = useState("");
  const [dataPrazoInput, setDataPrazoInput] = useState("");
  const [valorMovInput, setValorMovInput] = useState<Record<string, string>>({});
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [abrirModalCriar, setAbrirModalCriar] = useState(false);
  const [abrirModalHistorico, setAbrirModalHistorico] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [, setTicker] = useState(0);
  const piggyScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = setInterval(() => setTicker((prev) => prev + 1), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const primeiraMeta = metas[0]?.id ?? null;
    setMetaExpandidaId((atual) => (atual && metas.some((m) => m.id === atual) ? atual : primeiraMeta));
    setMetaAtivaId((atual) => atual ?? primeiraMeta);
  }, [metas, setMetaAtivaId]);

  useEffect(() => {
    async function carregarHistorico() {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHistorico(parsed);
      } catch {
        setHistorico([]);
      }
    }
    carregarHistorico();
  }, []);

  const salvarHistorico = async (next: HistoricoItem[]) => {
    setHistorico(next);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const registrarMovimentacao = async (
    item: Omit<HistoricoItem, "id" | "dataIso">,
  ) => {
    const registro: HistoricoItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      dataIso: new Date().toISOString(),
    };
    await salvarHistorico([registro, ...historico]);
  };

  const metasView = useMemo(() => {
    return [...metas].sort((a, b) => (b.dataCriacao > a.dataCriacao ? 1 : -1)).map(toMetaView);
  }, [metas]);

  const totalGuardado = metas.reduce((acc, m) => acc + m.valorAtual, 0);
  const totalMeta = metas.reduce((acc, m) => acc + m.valorMeta, 0);
  const metasConcluidas = metasView.filter((m) => m.status === "concluida").length;
  const metasVencidas = metasView.filter((m) => m.status === "vencida").length;

  const historicoMetaAtual = metaExpandidaId
    ? historico.filter((h) => h.metaId === metaExpandidaId)
    : historico;
  const ultimas3 = historicoMetaAtual.slice(0, 3);

  const planoCriacao = useMemo(() => {
    const valor = parseNumber(valorMetaInput);
    if (!Number.isFinite(valor) || valor <= 0) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataPrazoInput.trim())) return null;
    try {
      return calcularPlanoOriginal(valor, dataPrazoInput.trim());
    } catch {
      return null;
    }
  }, [dataPrazoInput, valorMetaInput]);

  const atualizarMetaLocal = async (metaId: string, proximoValor: number) => {
    const metasSalvas = await getMetas();
    const next = metasSalvas.map((meta) =>
      meta.id === metaId ? { ...meta, valorAtual: proximoValor } : meta,
    );
    await saveMetas(next);
    setMetas(next);
  };

  const criarNovaMeta = async () => {
    if (!nomeNovaMeta.trim()) {
      Alert.alert("Nome obrigatório", "Digite um nome para a meta.");
      return;
    }
    const valorMeta = parseNumber(valorMetaInput);
    if (!Number.isFinite(valorMeta) || valorMeta <= 0) {
      Alert.alert("Valor inválido", "Digite um valor de meta válido.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataPrazoInput.trim())) {
      Alert.alert("Prazo inválido", "Use o formato YYYY-MM-DD.");
      return;
    }

    setSalvando(true);
    try {
      const meta = await criarMeta(nomeNovaMeta.trim(), valorMeta, dataPrazoInput.trim());
      setMetaExpandidaId(meta.id);
      setMetaAtivaId(meta.id);
      await registrarMovimentacao({
        metaId: meta.id,
        metaNome: meta.nome,
        tipo: "criacao",
        valor: 0,
      });
      setAbrirModalCriar(false);
      setNomeNovaMeta("");
      setValorMetaInput("");
      setDataPrazoInput("");
    } catch (e: any) {
      Alert.alert("Erro ao criar meta", e?.message ?? "Não foi possível criar a meta.");
    } finally {
      setSalvando(false);
    }
  };

  const depositar = async (meta: Meta) => {
    const valor = parseNumber(valorMovInput[meta.id] ?? "");
    if (!Number.isFinite(valor) || valor <= 0) {
      Alert.alert("Valor inválido", "Digite um valor de depósito válido.");
      return;
    }

    setSalvando(true);
    try {
      const proximoValor = meta.valorAtual + valor;
      await atualizarMetaLocal(meta.id, proximoValor);
      await registrarMovimentacao({
        metaId: meta.id,
        metaNome: meta.nome,
        tipo: "deposito",
        valor,
      });

      setPontos((prev) => prev + Math.max(1, Math.floor(valor / 5)));
      const hoje = hojeString();
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      if (ultimoDeposito !== hoje) {
        if (ultimoDeposito === ontem.toDateString()) setOfensiva((prev) => prev + 1);
        else setOfensiva(1);
        setUltimoDeposito(hoje);
      }
      setValorMovInput((prev) => ({ ...prev, [meta.id]: "" }));
    } catch (e: any) {
      Alert.alert("Erro ao depositar", e?.message ?? "Não foi possível registrar o depósito.");
    } finally {
      setSalvando(false);
    }
  };

  const sacar = async (meta: Meta) => {
    const valor = parseNumber(valorMovInput[meta.id] ?? "");
    if (!Number.isFinite(valor) || valor <= 0) {
      Alert.alert("Valor inválido", "Digite um valor de saque válido.");
      return;
    }
    if (valor > meta.valorAtual) {
      Alert.alert("Saldo insuficiente", "Você não pode sacar mais do que já guardou.");
      return;
    }

    setSalvando(true);
    try {
      const proximoValor = meta.valorAtual - valor;
      await atualizarMetaLocal(meta.id, proximoValor);
      await registrarMovimentacao({
        metaId: meta.id,
        metaNome: meta.nome,
        tipo: "saque",
        valor,
      });
      setValorMovInput((prev) => ({ ...prev, [meta.id]: "" }));
    } catch (e: any) {
      Alert.alert("Erro ao sacar", e?.message ?? "Não foi possível registrar o saque.");
    } finally {
      setSalvando(false);
    }
  };

  const removerMeta = async (meta: Meta) => {
    Alert.alert("Excluir meta", `Deseja excluir "${meta.nome}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await excluirMeta(meta.id);
          setMetaExpandidaId(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBanner}>
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
          <Text style={styles.headerTitulo}>My Goals</Text>
          <Text style={styles.headerSubtitulo}>Organize e acompanhe suas metas financeiras</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Concluídas</Text>
              <Text style={styles.statNumero}>{metasConcluidas}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Vencidas</Text>
              <Text style={styles.statNumero}>{metasVencidas}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pontos</Text>
              <Text style={styles.statNumero}>{pontos}</Text>
            </View>
          </View>
          <Text style={styles.totalTexto}>
            {formatarMoeda(totalGuardado)} de {formatarMoeda(totalMeta)}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.secaoTitulo}>Metas</Text>
          <Pressable style={styles.btnPrincipal} onPress={() => setAbrirModalCriar(true)}>
            <Text style={styles.btnPrincipalTexto}>Add Goal</Text>
          </Pressable>
        </View>

        {carregandoMetas ? (
          <Text style={styles.muted}>Carregando metas...</Text>
        ) : metasView.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🐷</Text>
            <Text style={styles.vazioTitulo}>Nenhuma meta criada ainda</Text>
            <Text style={styles.muted}>Crie sua primeira meta para começar.</Text>
          </View>
        ) : (
          <View style={styles.metasGrid}>
            {metasView.map((meta) => {
              const expandida = meta.id === metaExpandidaId;
              const statusLabel =
                meta.status === "concluida"
                  ? "Concluída"
                  : meta.status === "vencida"
                    ? "Vencida"
                    : "Em andamento";
              return (
                <Pressable
                  key={meta.id}
                  onPress={() => {
                    setMetaExpandidaId((prev) => (prev === meta.id ? null : meta.id));
                    setMetaAtivaId(meta.id);
                  }}
                  style={[
                    styles.metaCard,
                    expandida && styles.metaCardAtiva,
                    meta.status === "vencida" && styles.metaCardVencida,
                  ]}
                >
                  <View style={styles.metaTop}>
                    <View style={styles.piggyWrap}>
                      <Piggy
                        scaleAnim={piggyScale}
                        chapeuEquipado={chapeuEquipado || null}
                      />
                    </View>
                    <View
                      style={[
                        styles.statusTag,
                        meta.status === "concluida"
                          ? styles.statusConcluida
                          : meta.status === "vencida"
                            ? styles.statusVencida
                            : styles.statusAndamento,
                      ]}
                    >
                      <Text style={styles.statusText}>{statusLabel}</Text>
                    </View>
                  </View>

                  <Text style={styles.metaNome}>{meta.nome}</Text>
                  <Text style={styles.metaValores}>
                    {formatarMoeda(meta.valorAtual)} / {formatarMoeda(meta.valorMeta)}
                  </Text>
                  <View style={styles.barraFundo}>
                    <View style={[styles.barraPreenchida, { width: `${Math.round(meta.progresso)}%` }]} />
                  </View>
                  <Text style={styles.metaPct}>{Math.round(meta.progresso)}% left</Text>

                  <View style={styles.planCard}>
                    <Text style={styles.planTitle}>Plano Original x Ajustado</Text>
                    <Text style={styles.planLine}>
                      Diária: {formatarMoeda(meta.planoOriginal.diario)} | {formatarMoeda(meta.planoAjustado.diario)}
                    </Text>
                    <Text style={styles.planLine}>
                      Semanal: {formatarMoeda(meta.planoOriginal.semanal)} | {formatarMoeda(meta.planoAjustado.semanal)}
                    </Text>
                    <Text style={styles.planLine}>
                      Mensal: {formatarMoeda(meta.planoOriginal.mensal)} | {formatarMoeda(meta.planoAjustado.mensal)}
                    </Text>
                  </View>

                  {expandida && (
                    <View style={styles.expandArea}>
                      <TextInput
                        style={styles.input}
                        keyboardType="decimal-pad"
                        placeholder="Valor para movimentar"
                        value={valorMovInput[meta.id] ?? ""}
                        onChangeText={(txt) =>
                          setValorMovInput((prev) => ({ ...prev, [meta.id]: txt }))
                        }
                      />
                      <View style={styles.actionsRow}>
                        <Pressable style={[styles.btnPrincipal, styles.flex1]} onPress={() => depositar(meta)} disabled={salvando}>
                          <Text style={styles.btnPrincipalTexto}>Add Money</Text>
                        </Pressable>
                        <Pressable style={[styles.btnSecundario, styles.flex1]} onPress={() => sacar(meta)} disabled={salvando}>
                          <Text style={styles.btnSecundarioTexto}>Sacar</Text>
                        </Pressable>
                      </View>
                      <Pressable onPress={() => removerMeta(meta)}>
                        <Text style={styles.btnDeleteTexto}>Excluir meta</Text>
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.historicoCabecalho}>
          <Text style={styles.secaoTitulo}>Recent Activities</Text>
          <Pressable onPress={() => setAbrirModalHistorico(true)}>
            <Text style={styles.verTudo}>View More</Text>
          </Pressable>
        </View>
        <View style={styles.historyCard}>
          {ultimas3.map((item) => (
            <View key={item.id} style={styles.itemTransacao}>
              <View>
                <Text style={styles.itemTitulo}>
                  {item.tipo === "deposito" ? "Added to Goal" : item.tipo === "saque" ? "Saque" : "Goal Created"} · {item.metaNome}
                </Text>
                <Text style={styles.itemSub}>{formatarData(item.dataIso)}</Text>
              </View>
              <Text style={[styles.itemValor, item.tipo === "saque" ? styles.valorNegativo : styles.valorPositivo]}>
                {item.tipo === "criacao" ? "-" : `${item.tipo === "saque" ? "-" : "+"}${formatarMoeda(item.valor)}`}
              </Text>
            </View>
          ))}
          {ultimas3.length === 0 && <Text style={styles.muted}>Ainda não há movimentações.</Text>}
        </View>
      </ScrollView>

      <Modal visible={abrirModalCriar} animationType="slide" transparent onRequestClose={() => setAbrirModalCriar(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.secaoTitulo}>Criar meta (RF01)</Text>
            <TextInput style={styles.input} placeholder="Nome da meta (ex: Viagem)" value={nomeNovaMeta} onChangeText={setNomeNovaMeta} />
            <TextInput
              style={styles.input}
              placeholder="Valor total desejado"
              keyboardType="decimal-pad"
              value={valorMetaInput}
              onChangeText={setValorMetaInput}
            />
            <TextInput
              style={styles.input}
              placeholder="Prazo (YYYY-MM-DD)"
              value={dataPrazoInput}
              onChangeText={setDataPrazoInput}
              autoCapitalize="none"
            />

            <View style={styles.planPreview}>
              <Text style={styles.planTitle}>Sugestão de economia (RF02)</Text>
              <Text style={styles.planLine}>
                Economia Diária: {planoCriacao ? formatarMoeda(planoCriacao.diario) : "-"}
              </Text>
              <Text style={styles.planLine}>
                Desafio Semanal: {planoCriacao ? formatarMoeda(planoCriacao.semanal) : "-"}
              </Text>
              <Text style={styles.planLine}>
                Corte de Gastos Mensal: {planoCriacao ? formatarMoeda(planoCriacao.mensal) : "-"}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <Pressable style={[styles.btnSecundario, styles.flex1]} onPress={() => setAbrirModalCriar(false)}>
                <Text style={styles.btnSecundarioTexto}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.btnPrincipal, styles.flex1]} onPress={criarNovaMeta} disabled={salvando}>
                <Text style={styles.btnPrincipalTexto}>Criar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={abrirModalHistorico} animationType="fade" transparent onRequestClose={() => setAbrirModalHistorico(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.secaoTitulo}>Histórico completo</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {(historicoMetaAtual.length ? historicoMetaAtual : historico).map((item) => (
                <View key={item.id} style={styles.itemTransacao}>
                  <View>
                    <Text style={styles.itemTitulo}>
                      {item.tipo === "deposito" ? "Depósito" : item.tipo === "saque" ? "Saque" : "Meta criada"} · {item.metaNome}
                    </Text>
                    <Text style={styles.itemSub}>{formatarData(item.dataIso)}</Text>
                  </View>
                  <Text style={[styles.itemValor, item.tipo === "saque" ? styles.valorNegativo : styles.valorPositivo]}>
                    {item.tipo === "criacao" ? "-" : `${item.tipo === "saque" ? "-" : "+"}${formatarMoeda(item.valor)}`}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <Pressable style={[styles.btnPrincipal, { marginTop: 12 }]} onPress={() => setAbrirModalHistorico(false)}>
              <Text style={styles.btnPrincipalTexto}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ECE7F2" },
  scroll: { paddingBottom: 36 },
  heroBanner: {
    backgroundColor: BRAND,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  heroCircle1: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: BRAND_MID,
    opacity: 0.25,
    top: -70,
    right: -70,
  },
  heroCircle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: BRAND_LIGHT,
    opacity: 0.15,
    bottom: -42,
    left: 12,
  },
  headerTitulo: { color: "#fff", fontSize: 24, fontWeight: "800" },
  headerSubtitulo: { color: "rgba(255,255,255,0.7)", marginTop: 3, marginBottom: 14 },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 10 },
  statLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  statNumero: { color: "#fff", fontWeight: "800", marginTop: 2 },
  totalTexto: { color: "#fff", marginTop: 10, fontWeight: "700" },
  sectionHeader: {
    marginTop: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  secaoTitulo: { fontSize: 17, fontWeight: "800", color: "#111827" },
  btnPrincipal: {
    backgroundColor: BRAND_MID,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnPrincipalTexto: { color: "#fff", fontWeight: "700" },
  muted: { color: "#64748B", marginTop: 8 },
  emptyCard: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    alignItems: "center",
  },
  emptyEmoji: { fontSize: 42, marginBottom: 8 },
  vazioTitulo: { color: "#111827", fontSize: 16, fontWeight: "700" },
  metasGrid: { paddingHorizontal: 20, gap: 14, marginTop: 12 },
  metaCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    minHeight: 250,
  },
  metaCardAtiva: { borderColor: BRAND_LIGHT, shadowColor: BRAND_LIGHT, shadowOpacity: 0.18, shadowRadius: 10, elevation: 4 },
  metaCardVencida: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
  metaTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  piggyWrap: {
    width: 124,
    height: 104,
    borderRadius: 20,
    backgroundColor: "#F5EDFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  statusTag: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  statusAndamento: { backgroundColor: "#EFF6FF" },
  statusConcluida: { backgroundColor: "#ECFDF5" },
  statusVencida: { backgroundColor: "#FEE2E2" },
  statusText: { fontWeight: "700", fontSize: 11, color: "#1F2937" },
  metaNome: { color: "#111827", fontWeight: "800", fontSize: 18, marginTop: 12 },
  metaValores: { color: "#64748B", marginTop: 6, marginBottom: 8, fontSize: 13 },
  barraFundo: { height: 8, backgroundColor: "#E2E8F0", borderRadius: 999, overflow: "hidden" },
  barraPreenchida: { height: "100%", backgroundColor: BRAND_LIGHT },
  metaPct: { marginTop: 7, color: "#64748B", fontSize: 12, fontWeight: "600" },
  planCard: { backgroundColor: "#F8FAFC", borderRadius: 12, padding: 10, marginTop: 10 },
  planTitle: { fontSize: 12, color: "#334155", fontWeight: "700", marginBottom: 4 },
  planLine: { fontSize: 12, color: "#475569", marginTop: 2 },
  expandArea: { marginTop: 12, gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111827",
    backgroundColor: "#fff",
  },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  flex1: { flex: 1 },
  btnSecundario: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnSecundarioTexto: { color: BRAND_MID, fontWeight: "700" },
  btnDeleteTexto: { color: "#DC2626", fontWeight: "700" },
  historicoCabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  verTudo: { color: BRAND_LIGHT, fontWeight: "700" },
  historyCard: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  itemTransacao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  itemTitulo: { color: "#111827", fontWeight: "600" },
  itemSub: { color: "#64748B", fontSize: 12, marginTop: 2 },
  itemValor: { fontWeight: "700", marginLeft: 8 },
  valorPositivo: { color: "#16A34A" },
  valorNegativo: { color: "#DC2626" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  planPreview: { marginTop: 12, backgroundColor: "#F8FAFC", borderRadius: 12, padding: 10 },
});
