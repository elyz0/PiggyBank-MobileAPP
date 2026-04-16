import { useSaldo } from "@/app/_layout";
import { Piggy } from "@/components/Piggy";
import { Meta } from "@/models";
import { toMetaView } from "@/services/metaViewService";
import { getMetas, saveMetas } from "@/storage/metaStorage";
import { calcularPlanoOriginal } from "@/utils/Calculos";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
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
const CONFETTI_COUNT = 28;
const COINS_COUNT = 10;
const CONFETTI_COLORS = ["#F59E0B", "#EF4444", "#3B82F6", "#10B981", "#A855F7", "#F97316", "#22C55E", "#38BDF8"];

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

const StatCard = React.forwardRef<View, any>(function StatCard(
  { emoji, label, value, accent, isDark }: any,
  ref,
) {
  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.statCardGrid, isDark ? styles.bgDarkCard : styles.bgLight]}
    >
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
});

export default function ObjetivosScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
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
  const [acoesMenuOpen, setAcoesMenuOpen] = useState(false);
  const [acoesMeta, setAcoesMeta] = useState<Meta | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [, setTicker] = useState(0);
  const piggyScaleCard = useRef(new Animated.Value(0.9)).current;
  const [celebracaoVisivel, setCelebracaoVisivel] = useState(false);
  const [celebracaoPayload, setCelebracaoPayload] = useState<{
    metaId: string;
    nome: string;
    excedente?: number;
    dataPrazo: string;
    pontosRecompensa: number;
  } | null>(null);

  const [coletandoPontos, setColetandoPontos] = useState(false);
  const [pontosExibidos, setPontosExibidos] = useState(pontos);
  const pontosCardRef = useRef<View | null>(null);
  const celebracaoRootRef = useRef<View | null>(null);
  const celebracaoPanelRef = useRef<View | null>(null);
  const pontosTween = useRef(new Animated.Value(pontos)).current;

  const COINS_FLY = 10;
  const moedasColetandoAnim = useRef(
    [...Array(COINS_FLY)].map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(1),
    })),
  ).current;

  const celebracaoAnim = useRef(new Animated.Value(0)).current;
  const burstAnim = useRef(new Animated.Value(0)).current;

  const confetesAnim = useRef(
    [...Array(CONFETTI_COUNT)].map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
    })),
  ).current;

  const moedasAnim = useRef(
    [...Array(COINS_COUNT)].map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
    })),
  ).current;

  const celebracaoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  useEffect(() => {
    const listenerId = pontosTween.addListener(({ value }) => {
      setPontosExibidos(Math.round(value));
    });

    return () => {
      pontosTween.removeListener(listenerId);
    };
  }, [pontosTween]);

  useEffect(() => {
    pontosTween.stopAnimation();
    pontosTween.setValue(pontos);
    setPontosExibidos(pontos);
  }, [pontos, pontosTween]);

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
    const statusRank = (status: string) =>
      status === "em_andamento" ? 0 : status === "vencida" ? 1 : 2;

    const views = metas.map(toMetaView);

    // UX: Ativas -> Vencidas -> Concluídas, sempre com dataCriacao desc dentro do grupo.
    return views.sort((a, b) => {
      const ra = statusRank(a.status);
      const rb = statusRank(b.status);
      if (ra !== rb) return ra - rb;
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

  const iniciarCelebracao = (payload: {
    metaId: string;
    nome: string;
    excedente?: number;
    dataPrazo: string;
    pontosRecompensa: number;
  }) => {
    if (celebracaoTimeoutRef.current) clearTimeout(celebracaoTimeoutRef.current);

    setCelebracaoPayload(payload);
    setCelebracaoVisivel(true);

    celebracaoAnim.setValue(0);
    burstAnim.setValue(0);

    // Reset confetes/coins para permitir múltiplas celebrações sem “sujar” animações anteriores.
    confetesAnim.forEach((c) => {
      c.x.setValue(0);
      c.y.setValue(-40 - Math.random() * 80);
      c.opacity.setValue(0);
    });
    moedasAnim.forEach((m) => {
      m.x.setValue(0);
      m.y.setValue(18 + Math.random() * 24);
      m.opacity.setValue(0);
    });

    Animated.parallel([
      Animated.timing(celebracaoAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.timing(burstAnim, { toValue: 1, duration: 520, useNativeDriver: true }),
    ]).start();

    // Confetes caindo.
    confetesAnim.forEach((conf) => {
      const randomX = (Math.random() - 0.5) * screenWidth * 0.85;
      const targetY = screenHeight + 60 + Math.random() * 140;
      const delay = Math.random() * 240;
      const duration = 980 + Math.random() * 780;

      const anim = Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(conf.opacity, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.timing(conf.x, { toValue: randomX, duration, useNativeDriver: true }),
          Animated.timing(conf.y, { toValue: targetY, duration, useNativeDriver: true }),
        ]),
      ]);

      anim.start();
    });

    // Moedas “subindo” do centro.
    moedasAnim.forEach((coin) => {
      const randomX = (Math.random() - 0.5) * screenWidth * 0.18;
      const targetY = -120 - Math.random() * 90;
      const delay = Math.random() * 180;
      const duration = 720 + Math.random() * 520;

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(coin.opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.timing(coin.x, { toValue: randomX, duration, useNativeDriver: true }),
          Animated.timing(coin.y, { toValue: targetY, duration, useNativeDriver: true }),
        ]),
      ]).start();
    });

    // Não auto-fechar: o usuário coleta os pontos via botão do overlay.
  };

  const coletarPontos = (after?: () => void) => {
    if (coletandoPontos) return;

    const payload = celebracaoPayload;
    const recompensa = payload?.pontosRecompensa ?? 0;

    if (!payload || recompensa <= 0) {
      setCelebracaoVisivel(false);
      setCelebracaoPayload(null);
      after?.();
      return;
    }

    setColetandoPontos(true);

    moedasColetandoAnim.forEach((coin) => {
      coin.x.setValue(0);
      coin.y.setValue(0);
      coin.opacity.setValue(0);
      coin.scale.setValue(1);
    });

    let finishCalled = false;
    let pontosAplicados = false;
    const safeFinish = () => {
      if (finishCalled) return;
      finishCalled = true;
      // Se a medição/layout falhar, ainda precisamos atualizar os pontos.
      if (!pontosAplicados) {
        pontosAplicados = true;
        setPontos((prev) => prev + recompensa);
      }
      setColetandoPontos(false);
      setCelebracaoVisivel(false);
      setCelebracaoPayload(null);
      after?.();
    };

    const root = celebracaoRootRef.current;
    const panel = celebracaoPanelRef.current;
    const card = pontosCardRef.current;

    if (!root || !panel || !card) {
      safeFinish();
      return;
    }

    root.measureInWindow((rootX, rootY) => {
      panel.measureInWindow((panelX, panelY, panelW, panelH) => {
        card.measureInWindow((cardX, cardY, cardW, cardH) => {
          const startX = panelX - rootX + panelW / 2;
          const startY = panelY - rootY + panelH / 2;
          const targetX = cardX - rootX + cardW / 2;
          const targetY = cardY - rootY + cardH / 2;

          let maxMs = 0;
          moedasColetandoAnim.forEach((coin) => {
            const spreadX = (Math.random() - 0.5) * 60;
            const spreadY = (Math.random() - 0.5) * 30;
            const destSpreadX = (Math.random() - 0.5) * 40;
            const destSpreadY = -Math.random() * 16;

            const duration = 700 + Math.random() * 260;
            maxMs = Math.max(maxMs, duration);

            coin.x.setValue(startX + spreadX);
            coin.y.setValue(startY + spreadY);
            coin.opacity.setValue(0);
            coin.scale.setValue(1);

            Animated.parallel([
              Animated.timing(coin.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
              Animated.timing(coin.x, { toValue: targetX + destSpreadX, duration, useNativeDriver: true }),
              Animated.timing(coin.y, { toValue: targetY + destSpreadY, duration, useNativeDriver: true }),
              Animated.timing(coin.scale, { toValue: 0.75, duration, useNativeDriver: true }),
            ]).start();
          });

          setTimeout(() => {
            const pontosAtuais = pontos;
            const pontosFinais = pontosAtuais + recompensa;

            Animated.timing(pontosTween, {
              toValue: pontosFinais,
              duration: 520,
              useNativeDriver: false,
            }).start(({ finished }) => {
              if (finished) {
                pontosAplicados = true;
                setPontos(pontosFinais);
              } else {
                pontosAplicados = true;
                setPontos((prev) => prev + recompensa);
              }
              safeFinish();
            });
          }, maxMs + 80);
        });
      });
    });
  };

  const depositar = async (meta: Meta) => {
    const valor = parseNumber(valorMovInput[meta.id] ?? "");
    if (!Number.isFinite(valor) || valor <= 0) {
      Alert.alert("Valor inválido", "Digite um valor de depósito válido.");
      return;
    }

    const restante = Math.max(meta.valorMeta - meta.valorAtual, 0);
    const excedente = Math.max(valor - restante, 0);
    const pontosGanhos = Math.max(1, Math.floor(valor / 5));

    // RN03: não permitir aporte maior que o restante
    if (excedente > 0) {
      Alert.alert(
        "Aporte excede a meta",
        `Faltavam ${formatarMoeda(restante)}.\nVocê informou ${formatarMoeda(valor)}.\nExcedente: ${formatarMoeda(excedente)}.\n\nDeseja prosseguir e finalizar a meta?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Prosseguir",
            style: "default",
            onPress: () => {
              setSalvando(true);
              (async () => {
                try {
                  await atualizarMetaLocal(meta.id, meta.valorMeta);
                  await registrarMovimentacao({
                    metaId: meta.id,
                    metaNome: meta.nome,
                    tipo: "deposito",
                    valor,
                  });

                  const hoje = hojeString();
                  const ontem = new Date();
                  ontem.setDate(ontem.getDate() - 1);
                  if (ultimoDeposito !== hoje) {
                    if (ultimoDeposito === ontem.toDateString()) setOfensiva((prev) => prev + 1);
                    else setOfensiva(1);
                    setUltimoDeposito(hoje);
                  }
                  setValorMovInput((prev) => ({ ...prev, [meta.id]: "" }));

                  iniciarCelebracao({
                    metaId: meta.id,
                    nome: meta.nome,
                    excedente,
                    dataPrazo: meta.dataPrazo,
                    pontosRecompensa: pontosGanhos,
                  });
                } catch (e: any) {
                  Alert.alert(
                    "Erro ao prosseguir",
                    e?.message ?? "Não foi possível finalizar a meta.",
                  );
                } finally {
                  setSalvando(false);
                }
              })();
            },
          },
        ],
      );
      return;
    }

    setSalvando(true);
    try {
      const proximoValor = meta.valorAtual + valor;
      const entrouConcluida =
        meta.valorAtual < meta.valorMeta &&
        proximoValor >= meta.valorMeta &&
        meta.valorMeta > 0;

      await atualizarMetaLocal(meta.id, proximoValor);
      await registrarMovimentacao({
        metaId: meta.id,
        metaNome: meta.nome,
        tipo: "deposito",
        valor,
      });

      const hoje = hojeString();
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      if (ultimoDeposito !== hoje) {
        if (ultimoDeposito === ontem.toDateString()) setOfensiva((prev) => prev + 1);
        else setOfensiva(1);
        setUltimoDeposito(hoje);
      }
      setValorMovInput((prev) => ({ ...prev, [meta.id]: "" }));

      if (entrouConcluida) {
        iniciarCelebracao({
          metaId: meta.id,
          nome: meta.nome,
          dataPrazo: meta.dataPrazo,
          pontosRecompensa: pontosGanhos,
        });
      } else {
        setPontos((prev) => prev + pontosGanhos);
      }
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
            ref={pontosCardRef}
            emoji="⭐"
            label="Pontos"
            value={pontosExibidos.toLocaleString("pt-BR")}
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
                const comecouVencidas =
                  meta.status === "vencida" &&
                  (index === 0 || metasView[index - 1]?.status !== "vencida");
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
                    {comecouVencidas && (
                      <View style={styles.vencidasDivider}>
                        <View style={styles.vencidasLine} />
                        <Text
                          style={[
                            styles.vencidasLabel,
                            { color: theme.textMuted },
                          ]}
                        >
                          Vencidas
                        </Text>
                        <View style={styles.vencidasLine} />
                      </View>
                    )}

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
                        <View style={styles.metaTitleRow}>
                          <Text
                            style={[styles.metaNome, { color: theme.textPrimary, textAlign: "center" }]}
                            numberOfLines={2}
                          >
                            {meta.nome}
                          </Text>

                          <Pressable
                            onPress={() => {
                              setAcoesMeta(meta);
                              setAcoesMenuOpen(true);
                            }}
                            style={[styles.moreBtn, { backgroundColor: isDark ? "#0F172A" : "#F8FAFC" }]}
                          >
                            <Text style={[styles.moreBtnText, { color: theme.textPrimary }]}>⋯</Text>
                          </Pressable>
                        </View>

                        <View style={styles.statusBadgesRow}>
                          <View
                            style={[
                              styles.statusBadge,
                              styles.statusBadgeStatus,
                              meta.status === "concluida"
                                ? styles.statusConcluida
                                : meta.status === "vencida"
                                  ? styles.statusVencida
                                  : styles.statusAndamento,
                            ]}
                          >
                            <Text style={[styles.badgeText, { color: theme.textPrimary }]} numberOfLines={2}>
                              {statusLabel}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.statusBadge,
                              styles.statusBadgeDate,
                              meta.status === "concluida"
                                ? styles.statusConcluida
                                : meta.status === "vencida"
                                  ? styles.statusVencida
                                  : styles.statusAndamento,
                            ]}
                          >
                            <Text style={[styles.badgeText, { color: theme.textMuted }]} numberOfLines={1}>
                              {formatarDataBr(meta.dataPrazo)}
                            </Text>
                          </View>
                        </View>
                      </View>

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

      {celebracaoVisivel && celebracaoPayload && (
        <View
          style={styles.celebracaoFullscreen}
          pointerEvents="auto"
          ref={celebracaoRootRef}
          collapsable={false}
        >
          <Animated.View
            style={[
              styles.celebracaoDim,
              {
                opacity: celebracaoAnim,
                backgroundColor: isDark ? "rgba(15,23,42,0.55)" : "rgba(2,6,23,0.35)",
              },
            ]}
          />

          {/* Efeitos (confetes/burst/moedas) */}
          <View style={styles.celebracaoEffectsLayer} pointerEvents="none">
            {confetesAnim.map((conf, idx) => (
              <Animated.View
                key={`conf-${idx}`}
                style={[
                  styles.confettiPiece,
                  {
                    backgroundColor: CONFETTI_COLORS[idx % CONFETTI_COLORS.length],
                    opacity: conf.opacity,
                    left: screenWidth / 2,
                    top: 0,
                    marginLeft: -4,
                    transform: [{ translateX: conf.x }, { translateY: conf.y }],
                  },
                ]}
              />
            ))}

            <Animated.View
              style={[
                styles.celebracaoBurst,
                {
                  opacity: burstAnim,
                  transform: [
                    {
                      scale: burstAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.7, 1.8],
                      }),
                    },
                  ],
                },
              ]}
            />

            {moedasAnim.map((coin, idx) => (
              <Animated.View
                key={`coin-${idx}`}
                style={[
                  styles.coinPiece,
                  {
                    opacity: coin.opacity,
                    left: screenWidth / 2,
                    top: screenHeight * 0.52,
                    marginLeft: -11,
                    transform: [{ translateX: coin.x }, { translateY: coin.y }],
                  },
                ]}
              >
                <Text style={styles.coinEmoji}>🪙</Text>
              </Animated.View>
            ))}
          </View>

          {coletandoPontos && (
            <View style={styles.pontosColetandoLayer} pointerEvents="none">
              {moedasColetandoAnim.map((coin, idx) => (
                <Animated.View
                  key={`collect-coin-${idx}`}
                  style={[
                    styles.pontosCoinPiece,
                    {
                      opacity: coin.opacity,
                      transform: [
                        { translateX: coin.x },
                        { translateY: coin.y },
                        { scale: coin.scale },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.coinEmoji}>🪙</Text>
                </Animated.View>
              ))}
            </View>
          )}

          <Animated.View
            ref={celebracaoPanelRef}
            collapsable={false}
            style={[
              styles.celebracaoPanel,
              {
                opacity: celebracaoAnim,
                transform: [
                  {
                    scale: celebracaoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.98, 1.02],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.celebracaoTitle}>🎉 Meta concluída!</Text>
            <Text style={styles.celebracaoSubtitle}>
              Você concluiu &quot;{celebracaoPayload.nome}&quot;.
            </Text>

            {typeof celebracaoPayload.excedente === "number" && celebracaoPayload.excedente > 0 && (
              <Text style={styles.celebracaoSubtitle}>
                Excedente de {formatarMoeda(celebracaoPayload.excedente)} detectado.
              </Text>
            )}

            {typeof celebracaoPayload.excedente === "number" && celebracaoPayload.excedente > 0 ? (
              <View style={styles.celebracaoActionsRow}>
                <Pressable
                  style={[styles.celebracaoBtn, styles.celebracaoBtnPrimary]}
                  onPress={() => coletarPontos()}
                >
                  <Text style={styles.celebracaoBtnText}>Coletar pontos</Text>
                </Pressable>

                <Pressable
                  style={[styles.celebracaoBtn, styles.celebracaoBtnGhost]}
                  onPress={() => {
                    const payload = celebracaoPayload;
                    if (!payload) return;

                    coletarPontos(() => {
                      setNomeNovaMeta(`Excedente da ${payload.nome}`);
                      setValorMetaInput(String(payload.excedente));
                      setDataPrazoInput(payload.dataPrazo);
                      setAbrirModalCriar(true);
                    });
                  }}
                >
                  <Text style={[styles.celebracaoBtnText, { color: theme.textPrimary }]}>
                    Criar nova meta
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.celebracaoActionsRow}>
                <Pressable
                  style={[styles.celebracaoBtn, styles.celebracaoBtnPrimary]}
                  onPress={() => coletarPontos()}
                >
                  <Text style={styles.celebracaoBtnText}>Coletar pontos</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </View>
      )}

      <Modal visible={acoesMenuOpen} animationType="fade" transparent onRequestClose={() => setAcoesMenuOpen(false)}>
        <View style={styles.acoessModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAcoesMenuOpen(false)} />

          <View
            style={[
              styles.acoessSheet,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            ]}
          >
            <Text style={[styles.acoessTitle, { color: theme.textPrimary }]}>Ações</Text>

            <Pressable
              style={[styles.acoessBtn, styles.acoessBtnPrimary]}
              onPress={() => {
                const meta = acoesMeta;
                setAcoesMenuOpen(false);
                if (meta) abrirEditarMeta(meta);
              }}
              disabled={!acoesMeta}
            >
              <Text style={styles.acoessBtnPrimaryText}>Editar</Text>
            </Pressable>

            <Pressable
              style={[styles.acoessBtn, styles.acoessBtnDanger]}
              onPress={() => {
                const meta = acoesMeta;
                setAcoesMenuOpen(false);
                if (meta) removerMeta(meta);
              }}
              disabled={!acoesMeta}
            >
              <Text style={styles.acoessBtnDangerText}>Excluir</Text>
            </Pressable>

            <Pressable
              style={[styles.acoessBtn, styles.acoessBtnGhost]}
              onPress={() => setAcoesMenuOpen(false)}
            >
              <Text style={[styles.acoessBtnGhostText, { color: theme.textMuted }]}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
    overflow: "visible",
    position: "relative",
  },
  metaCardConcluida: { opacity: 0.92 },
  metaCardAtiva: { borderColor: BRAND_LIGHT, shadowColor: BRAND_LIGHT, shadowOpacity: 0.18, shadowRadius: 10, elevation: 4 },
  metaCardVencida: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
  metaHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, overflow: "visible" },
  metaInfoCol: { flex: 1, gap: 4 },
  metaTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  piggyWrap: {
    width: 132,
    height: 150,
    borderRadius: 20,
    backgroundColor: "#F5EDFF",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 18,
    marginTop: 0,
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
  statusDateBox: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  statusBadgesRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2, justifyContent: "flex-start" },
  statusBadge: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadgeStatus: { flex: 1.0 },
  statusBadgeDate: { flex: 1.25 },
  badgeText: { fontWeight: "700", fontSize: 11, lineHeight: 13 },
  statusDateText: { fontSize: 11, fontWeight: "700" },
  pctBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  pctBadgeText: { color: BRAND_MID, fontWeight: "800", fontSize: 12 },
  metaNome: { flex: 1, color: "#111827", fontWeight: "800", fontSize: 16, lineHeight: 20 },
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
  // Overlay de celebração (metas concluídas)
  celebracaoFullscreen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  celebracaoDim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  celebracaoEffectsLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiPiece: {
    position: "absolute",
    width: 8,
    height: 3,
    borderRadius: 2,
  },
  celebracaoBurst: {
    position: "absolute",
    top: "42%",
    left: "50%",
    width: 74,
    height: 74,
    marginLeft: -37,
    marginTop: -37,
    borderRadius: 37,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.65)",
  },
  celebracaoPanel: {
    width: "86%",
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  celebracaoTitle: { fontSize: 22, fontWeight: "900", color: "#FFFFFF" },
  celebracaoSubtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.95)",
    marginTop: 6,
    textAlign: "center",
  },
  celebracaoActionsRow: { flexDirection: "row", gap: 10, marginTop: 14, width: "100%" },
  celebracaoBtn: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  celebracaoBtnPrimary: { backgroundColor: "#FFFFFF" },
  celebracaoBtnGhost: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  celebracaoBtnText: { color: "#1E3A5F", fontWeight: "900", fontSize: 13 },
  coinPiece: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FBBF24",
    borderWidth: 2,
    borderColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  coinEmoji: { fontSize: 12 },

  // Recompensa de pontos (coletar)
  pontosColetandoLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  pontosCoinPiece: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FBBF24",
    borderWidth: 2,
    borderColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 6,
  },

  // Menu (3 pontinhos) - action sheet custom
  acoessModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
    padding: 20,
  },
  acoessSheet: {
    width: "100%",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 10,
  },
  acoessTitle: { fontSize: 16, fontWeight: "900", marginBottom: 2 },
  acoessBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  acoessBtnPrimary: { backgroundColor: BRAND_MID },
  acoessBtnPrimaryText: { color: "#FFFFFF", fontWeight: "900" },
  acoessBtnDanger: { backgroundColor: "rgba(220,38,38,0.12)" },
  acoessBtnDangerText: { color: "#DC2626", fontWeight: "900" },
  acoessBtnGhost: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  acoessBtnGhostText: { fontWeight: "900" },
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
  vencidasDivider: {
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    opacity: 0.85,
  },
  vencidasLine: { flex: 1, height: 1, backgroundColor: "#CBD5E1", opacity: 0.6 },
  vencidasLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
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
