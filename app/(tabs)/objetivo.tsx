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
  AppState,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
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

const formatarDataBr = (isoDate: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [ano, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}/${ano}`;
};

const hojeString = () => new Date().toDateString();

function parseNumber(texto: string): number {
  return Number(texto.replace(",", "."));
}

function StatCard({ emoji, label, value, accent, isDark }: any) {
  return (
    <View style={[styles.statCardGrid, isDark ? styles.bgDarkCard : styles.bgLight]}>
      <View style={[styles.statIconWrap, { backgroundColor: accent + "22" }]}>
        <Text style={styles.statEmoji}>{emoji}</Text>
      </View>
      <Text style={[styles.statValue, isDark ? styles.textWhite : styles.textBlack]}>
        {value}
      </Text>
      <Text
        style={[
          styles.statLabelGrid,
          isDark ? styles.textMutedDark : styles.textMutedLight,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ObjetivosScreen() {
  const { height: screenHeight } = useWindowDimensions();
  const {
    metas,
    setMetas,
    criarMeta,
    editarMeta,
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
    isDark,
    alternarTema,
  } = useSaldo();

  const [metaExpandidaId, setMetaExpandidaId] = useState<string | null>(null);
  const [nomeNovaMeta, setNomeNovaMeta] = useState("");
  const [valorMetaInput, setValorMetaInput] = useState("");
  const [dataPrazoInput, setDataPrazoInput] = useState("");
  const [valorMovInput, setValorMovInput] = useState<Record<string, string>>({});
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [abrirModalCriar, setAbrirModalCriar] = useState(false);
  const [abrirModalEditar, setAbrirModalEditar] = useState(false);
  const [abrirModalHistorico, setAbrirModalHistorico] = useState(false);
  const [metaEditando, setMetaEditando] = useState<Meta | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [, setTicker] = useState(0);
  const piggyScaleCard = useRef(new Animated.Value(0.9)).current;
  const theme = {
    screenBg: isDark ? "#0F172A" : "#ECE7F2",
    cardBg: isDark ? "#1E293B" : "#FFFFFF",
    cardBorder: isDark ? "#334155" : "#E2E8F0",
    textPrimary: isDark ? "#F8FAFC" : "#111827",
    textMuted: isDark ? "#94A3B8" : "#64748B",
    planBg: isDark ? "#0F172A" : "#F8FAFC",
    inputBg: isDark ? "#0F172A" : "#FFFFFF",
    inputBorder: isDark ? "#475569" : "#CBD5E1",
    piggyBg: isDark ? "#312E4B" : "#F5EDFF",
    secondaryBtnBg: isDark ? "#1E3A5F" : "#EFF6FF",
  };

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

  // Persistência robusta do histórico (salva em mudanças e ao fechar app)
  useEffect(() => {
    const t = setTimeout(() => {
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(historico)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [historico]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(historico)).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [historico]);

  const registrarMovimentacao = async (
    item: Omit<HistoricoItem, "id" | "dataIso">,
  ) => {
    const registro: HistoricoItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      dataIso: new Date().toISOString(),
    };
    setHistorico((prev) => {
      const next = [registro, ...prev];
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const metasView = useMemo(() => {
    const views = [...metas]
      .sort((a, b) => (b.dataCriacao > a.dataCriacao ? 1 : -1))
      .map(toMetaView);

    // Metas concluídas no final (UX)
    return views.sort((a, b) => {
      const aDone = a.status === "concluida" ? 1 : 0;
      const bDone = b.status === "concluida" ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone; // não concluídas primeiro
      return b.dataCriacao > a.dataCriacao ? 1 : -1;
    });
  }, [metas]);

  const totalGuardado = metas.reduce((acc, m) => acc + m.valorAtual, 0);
  const totalMeta = metas.reduce((acc, m) => acc + m.valorMeta, 0);
  const metasConcluidas = metasView.filter((m) => m.status === "concluida").length;

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

  const abrirEditarMeta = (meta: Meta) => {
    setMetaEditando(meta);
    setNomeNovaMeta(meta.nome);
    setValorMetaInput(String(meta.valorMeta));
    setDataPrazoInput(meta.dataPrazo);
    setAbrirModalEditar(true);
  };

  const salvarEdicaoMeta = async () => {
    if (!metaEditando) return;
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
      await editarMeta({
        ...metaEditando,
        nome: nomeNovaMeta.trim(),
        valorMeta,
        dataPrazo: dataPrazoInput.trim(),
      });
      setAbrirModalEditar(false);
      setMetaEditando(null);
      setNomeNovaMeta("");
      setValorMetaInput("");
      setDataPrazoInput("");
    } catch (e: any) {
      Alert.alert("Erro ao editar meta", e?.message ?? "Não foi possível salvar a meta.");
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.screenBg }]}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBanner}>
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
          <View style={styles.heroTopRow}>
            <View style={styles.heroLeft}>
              <Text style={styles.headerTitulo}>Metas</Text>
              <Text style={styles.headerSubtitulo}>Organize e acompanhe suas metas financeiras</Text>
            </View>
            <View style={styles.heroRightColumn}>
              <View style={styles.streakBadge}>
                <Text style={styles.streakLabel}>🔥 {ofensiva} dias</Text>
              </View>
              <Pressable style={styles.themeBtn} onPress={alternarTema}>
                <Text style={styles.themeBtnText}>{isDark ? "☀️ Claro" : "🌙 Escuro"}</Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.totalTexto}>
            {formatarMoeda(totalGuardado)} de {formatarMoeda(totalMeta)}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            emoji="⭐"
            label="Pontos"
            value={pontos.toLocaleString("pt-BR")}
            accent="#F59E0B"
            isDark={isDark}
          />
          <StatCard
            emoji="🎯"
            label="Metas ativas"
            value={String(metasView.length)}
            accent="#3B82F6"
            isDark={isDark}
          />
          <StatCard
            emoji="✅"
            label="Concluídas"
            value={String(metasConcluidas)}
            accent="#10B981"
            isDark={isDark}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.secaoTitulo, { color: theme.textPrimary }]}>Metas</Text>
          <Pressable style={styles.btnPrincipal} onPress={() => setAbrirModalCriar(true)}>
            <Text style={styles.btnPrincipalTexto}>+ Nova meta</Text>
          </Pressable>
        </View>

        {carregandoMetas ? (
          <Text style={styles.muted}>Carregando metas...</Text>
        ) : metasView.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={styles.emptyEmoji}>🐷</Text>
            <Text style={[styles.vazioTitulo, { color: theme.textPrimary }]}>Nenhuma meta criada ainda</Text>
            <Text style={[styles.muted, { color: theme.textMuted }]}>Crie sua primeira meta para começar.</Text>
          </View>
        ) : (
          <View
            style={[
              styles.metasListContainer,
              { maxHeight: Math.min(720, Math.max(360, Math.round(screenHeight * 0.62))) },
            ]}
          >
            <FlatList
              data={metasView}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator
              persistentScrollbar
              indicatorStyle={isDark ? "white" : "black"}
              nestedScrollEnabled
              style={styles.metasList}
              contentContainerStyle={styles.metasListContent}
              renderItem={({ item: meta, index }) => {
                const expandida = meta.id === metaExpandidaId;
                const comecouConcluidas =
                  meta.status === "concluida" &&
                  (index === 0 || metasView[index - 1]?.status !== "concluida");
                const statusLabel =
                  meta.status === "concluida"
                    ? "Concluída"
                    : meta.status === "vencida"
                      ? "Vencida"
                      : "Em andamento";

                return (
                  <View>
                    {comecouConcluidas && (
                      <View style={styles.concluidasDivider}>
                        <View style={styles.concluidasLine} />
                        <Text
                          style={[
                            styles.concluidasLabel,
                            { color: theme.textMuted },
                          ]}
                        >
                          Concluídas
                        </Text>
                        <View style={styles.concluidasLine} />
                      </View>
                    )}

                    <View
                      style={[
                        styles.metaCard,
                        { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
                        expandida && styles.metaCardAtiva,
                        meta.status === "vencida" && styles.metaCardVencida,
                        meta.status === "concluida" && styles.metaCardConcluida,
                      ]}
                    >
                    <View style={styles.metaHeader}>
                      <View style={[styles.piggyWrap, { backgroundColor: theme.piggyBg }]}>
                        <Piggy
                          scaleAnim={piggyScaleCard}
                          chapeuEquipado={meta.chapeuEquipadoId ?? chapeuEquipado ?? null}
                        />
                      </View>

                      <View style={styles.metaInfoCol}>
                        <Text style={[styles.metaNome, { color: theme.textPrimary }]} numberOfLines={2}>
                          {meta.nome}
                        </Text>

                        <View style={styles.metaBadgeRow}>
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
                        <Text style={[styles.metaPrazo, { color: theme.textMuted }]}>
                          Prazo: {formatarDataBr(meta.dataPrazo)}
                        </Text>
                      </View>

                      <Pressable
                        onPress={() =>
                          Alert.alert("Ações", `O que deseja fazer com "${meta.nome}"?`, [
                            { text: "Cancelar", style: "cancel" },
                            { text: "Editar", onPress: () => abrirEditarMeta(meta) },
                            { text: "Excluir", style: "destructive", onPress: () => removerMeta(meta) },
                          ])
                        }
                        style={[styles.moreBtn, { backgroundColor: isDark ? "#0F172A" : "#F8FAFC" }]}
                      >
                        <Text style={[styles.moreBtnText, { color: theme.textPrimary }]}>⋯</Text>
                      </Pressable>
                    </View>

                    <View style={styles.metaProgressBlock}>
                      <View style={styles.progressTopRow}>
                        <Text
                          style={[styles.progressTopText, { color: theme.textMuted }]}
                          numberOfLines={1}
                        >
                          {formatarMoeda(meta.valorAtual)} / {formatarMoeda(meta.valorMeta)}
                        </Text>
                        <Text style={[styles.progressTopPct, { color: theme.textMuted }]}>
                          {Math.round(meta.progresso)}%
                        </Text>
                      </View>
                      <View style={styles.barraFundo}>
                        <View style={[styles.barraPreenchida, { width: `${Math.round(meta.progresso)}%` }]} />
                      </View>
                    </View>

                    <View style={styles.cardFooterRow}>
                      <Pressable
                        onPress={() => {
                          setMetaExpandidaId((prev) => (prev === meta.id ? null : meta.id));
                          setMetaAtivaId(meta.id);
                        }}
                        style={[styles.expandToggleBtn, { backgroundColor: isDark ? "#0F172A" : "#F8FAFC" }]}
                      >
                        <Text style={[styles.expandToggleText, { color: theme.textPrimary }]}>
                          {expandida ? "Ocultar ações" : "Abrir ações"}
                        </Text>
                      </Pressable>
                    </View>

                    {expandida && (
                      <View style={styles.expandArea}>
                        <View style={[styles.planCard, { backgroundColor: theme.planBg }]}>
                          <Text style={[styles.planTitle, { color: theme.textPrimary }]}>
                            Plano Original x Ajustado
                          </Text>
                          <Text style={[styles.planLine, { color: theme.textMuted }]}>
                            Diária: {formatarMoeda(meta.planoOriginal.diario)} | {formatarMoeda(meta.planoAjustado.diario)}
                          </Text>
                          <Text style={[styles.planLine, { color: theme.textMuted }]}>
                            Semanal: {formatarMoeda(meta.planoOriginal.semanal)} | {formatarMoeda(meta.planoAjustado.semanal)}
                          </Text>
                          <Text style={[styles.planLine, { color: theme.textMuted }]}>
                            Mensal: {formatarMoeda(meta.planoOriginal.mensal)} | {formatarMoeda(meta.planoAjustado.mensal)}
                          </Text>
                        </View>

                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: theme.inputBg,
                              borderColor: theme.inputBorder,
                              color: theme.textPrimary,
                            },
                          ]}
                          keyboardType="decimal-pad"
                          placeholder="Valor para movimentar"
                          placeholderTextColor={theme.textMuted}
                          value={valorMovInput[meta.id] ?? ""}
                          onChangeText={(txt) =>
                            setValorMovInput((prev) => ({ ...prev, [meta.id]: txt }))
                          }
                        />
                        <View style={styles.actionsRow}>
                          <Pressable
                            style={[styles.btnPrincipal, styles.flex1]}
                            onPress={() => depositar(meta)}
                            disabled={salvando}
                          >
                            <Text style={styles.btnPrincipalTexto}>Depositar</Text>
                          </Pressable>
                          <Pressable
                            style={[
                              styles.btnSecundario,
                              styles.flex1,
                              { backgroundColor: theme.secondaryBtnBg },
                            ]}
                            onPress={() => sacar(meta)}
                            disabled={salvando}
                          >
                            <Text style={styles.btnSecundarioTexto}>Sacar</Text>
                          </Pressable>
                        </View>
                        <Pressable onPress={() => removerMeta(meta)}>
                          <Text style={styles.btnDeleteTexto}>Excluir meta</Text>
                        </Pressable>
                      </View>
                    )}
                    </View>
                  </View>
                );
              }}
            />
          </View>
        )}

        <View style={styles.historicoCabecalho}>
          <Text style={[styles.secaoTitulo, { color: theme.textPrimary }]}>
            Histórico
          </Text>
          <Pressable onPress={() => setAbrirModalHistorico(true)}>
            <Text style={styles.verTudo}>Ver tudo</Text>
          </Pressable>
        </View>
        <View style={[styles.historyCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          {ultimas3.map((item) => (
            <View key={item.id} style={styles.itemTransacao}>
              <View>
                <Text style={[styles.itemTitulo, { color: theme.textPrimary }]}>
                  {item.tipo === "deposito"
                    ? "Adicionado à meta"
                    : item.tipo === "saque"
                      ? "Saque"
                      : "Meta criada"}{" "}
                  · {item.metaNome}
                </Text>
                <Text style={[styles.itemSub, { color: theme.textMuted }]}>{formatarData(item.dataIso)}</Text>
              </View>
              <Text style={[styles.itemValor, item.tipo === "saque" ? styles.valorNegativo : styles.valorPositivo]}>
                {item.tipo === "criacao" ? "-" : `${item.tipo === "saque" ? "-" : "+"}${formatarMoeda(item.valor)}`}
              </Text>
            </View>
          ))}
          {ultimas3.length === 0 && <Text style={[styles.muted, { color: theme.textMuted }]}>Ainda não há movimentações.</Text>}
        </View>
      </ScrollView>

      <Modal visible={abrirModalCriar} animationType="slide" transparent onRequestClose={() => setAbrirModalCriar(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.secaoTitulo, { color: theme.textPrimary }]}>Criar meta (RF01)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
              placeholder="Nome da meta (ex: Viagem)"
              placeholderTextColor={theme.textMuted}
              value={nomeNovaMeta}
              onChangeText={setNomeNovaMeta}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
              placeholder="Valor total desejado"
              placeholderTextColor={theme.textMuted}
              keyboardType="decimal-pad"
              value={valorMetaInput}
              onChangeText={setValorMetaInput}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
              placeholder="Prazo (YYYY-MM-DD)"
              placeholderTextColor={theme.textMuted}
              value={dataPrazoInput}
              onChangeText={setDataPrazoInput}
              autoCapitalize="none"
            />

            <View style={[styles.planPreview, { backgroundColor: theme.planBg, borderColor: theme.cardBorder }]}>
              <Text style={[styles.planTitle, { color: theme.textPrimary }]}>Sugestão de economia (RF02)</Text>
              <Text style={[styles.planLine, { color: theme.textMuted }]}>
                Economia Diária: {planoCriacao ? formatarMoeda(planoCriacao.diario) : "-"}
              </Text>
              <Text style={[styles.planLine, { color: theme.textMuted }]}>
                Desafio Semanal: {planoCriacao ? formatarMoeda(planoCriacao.semanal) : "-"}
              </Text>
              <Text style={[styles.planLine, { color: theme.textMuted }]}>
                Corte de Gastos Mensal: {planoCriacao ? formatarMoeda(planoCriacao.mensal) : "-"}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <Pressable style={[styles.btnSecundario, styles.flex1, { backgroundColor: theme.secondaryBtnBg }]} onPress={() => setAbrirModalCriar(false)}>
                <Text style={styles.btnSecundarioTexto}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.btnPrincipal, styles.flex1]} onPress={criarNovaMeta} disabled={salvando}>
                <Text style={styles.btnPrincipalTexto}>Criar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={abrirModalEditar} animationType="slide" transparent onRequestClose={() => setAbrirModalEditar(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.secaoTitulo, { color: theme.textPrimary }]}>Editar meta</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
              placeholder="Nome da meta"
              placeholderTextColor={theme.textMuted}
              value={nomeNovaMeta}
              onChangeText={setNomeNovaMeta}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
              placeholder="Valor total desejado"
              placeholderTextColor={theme.textMuted}
              keyboardType="decimal-pad"
              value={valorMetaInput}
              onChangeText={setValorMetaInput}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.textPrimary }]}
              placeholder="Prazo (YYYY-MM-DD)"
              placeholderTextColor={theme.textMuted}
              value={dataPrazoInput}
              onChangeText={setDataPrazoInput}
              autoCapitalize="none"
            />
            <View style={styles.actionsRow}>
              <Pressable style={[styles.btnSecundario, styles.flex1, { backgroundColor: theme.secondaryBtnBg }]} onPress={() => setAbrirModalEditar(false)}>
                <Text style={styles.btnSecundarioTexto}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.btnPrincipal, styles.flex1]} onPress={salvarEdicaoMeta} disabled={salvando}>
                <Text style={styles.btnPrincipalTexto}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={abrirModalHistorico} animationType="fade" transparent onRequestClose={() => setAbrirModalHistorico(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[styles.secaoTitulo, { color: theme.textPrimary }]}>Histórico completo</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {(historicoMetaAtual.length ? historicoMetaAtual : historico).map((item) => (
                <View key={item.id} style={styles.itemTransacao}>
                  <View>
                    <Text style={[styles.itemTitulo, { color: theme.textPrimary }]}>
                      {item.tipo === "deposito" ? "Depósito" : item.tipo === "saque" ? "Saque" : "Meta criada"} · {item.metaNome}
                    </Text>
                    <Text style={[styles.itemSub, { color: theme.textMuted }]}>{formatarData(item.dataIso)}</Text>
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
  bgLight: { backgroundColor: "#FFFFFF" },
  bgDarkCard: { backgroundColor: "#1E293B" },
  textBlack: { color: "#111827" },
  textWhite: { color: "#FFFFFF" },
  textMutedLight: { color: "#94A3B8" },
  textMutedDark: { color: "#64748B" },
  heroBanner: {
    backgroundColor: BRAND,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
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
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  heroLeft: { flex: 1, paddingRight: 12 },
  heroRightColumn: { alignItems: "flex-end", gap: 8 },
  headerTitulo: { color: "#fff", fontSize: 30, fontWeight: "700" },
  streakBadge: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  streakLabel: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  themeBtn: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  themeBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  headerSubtitulo: { color: "rgba(255,255,255,0.7)", marginTop: 3 },
  totalTexto: { color: "#fff", marginTop: 10, fontWeight: "700" },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginTop: -18,
    marginBottom: 8,
  },
  statCardGrid: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  statLabelGrid: { fontSize: 10, marginTop: 2, textAlign: "center" },
  sectionHeader: {
    marginTop: 24,
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
  metasListContainer: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  metasList: { paddingRight: 2 },
  metasListContent: { gap: 12, paddingBottom: 12 },
  metaCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    minHeight: 192,
    gap: 10,
  },
  metaCardConcluida: { opacity: 0.92 },
  metaCardAtiva: { borderColor: BRAND_LIGHT, shadowColor: BRAND_LIGHT, shadowOpacity: 0.18, shadowRadius: 10, elevation: 4 },
  metaCardVencida: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
  metaHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  metaInfoCol: { flex: 1, gap: 4 },
  piggyWrap: {
    width: 112,
    height: 110,
    borderRadius: 14,
    backgroundColor: "#F5EDFF",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 18,
    marginTop: 2,
    overflow: "visible",
  },
  moreBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  moreBtnText: { fontSize: 18, fontWeight: "700", lineHeight: 18, marginTop: -4 },
  metaBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  statusTag: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  statusAndamento: { backgroundColor: "#EFF6FF" },
  statusConcluida: { backgroundColor: "#ECFDF5" },
  statusVencida: { backgroundColor: "#FEE2E2" },
  statusText: { fontWeight: "700", fontSize: 11, color: "#1F2937" },
  pctBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  pctBadgeText: { color: BRAND_MID, fontWeight: "800", fontSize: 12 },
  metaNome: { color: "#111827", fontWeight: "800", fontSize: 16, lineHeight: 20 },
  metaPrazo: { fontSize: 11, fontWeight: "600" },
  metaProgressBlock: { gap: 8 },
  progressTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressTopText: { fontSize: 12, fontWeight: "700", flex: 1, paddingRight: 10 },
  progressTopPct: { fontSize: 11, fontWeight: "700" },
  barraFundo: { height: 8, backgroundColor: "#E2E8F0", borderRadius: 999, overflow: "hidden" },
  barraPreenchida: { height: "100%", backgroundColor: BRAND_LIGHT },
  cardFooterRow: { flexDirection: "row", justifyContent: "flex-end" },
  expandToggleBtn: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  expandToggleText: { fontSize: 12, fontWeight: "700" },
  planCard: { backgroundColor: "#F8FAFC", borderRadius: 12, padding: 10 },
  planTitle: { fontSize: 12, color: "#334155", fontWeight: "700", marginBottom: 4 },
  planLine: { fontSize: 12, color: "#475569", marginTop: 2 },
  expandArea: { gap: 10 },
  concluidasDivider: {
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  concluidasLine: { flex: 1, height: 1, backgroundColor: "#CBD5E1", opacity: 0.6 },
  concluidasLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
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
    marginTop: 24,
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
  planPreview: {
    marginTop: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
});
