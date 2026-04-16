// app/_layout.tsx
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import "react-native-reanimated";

// Importe o seu componente de animação (certifique-se que o caminho está correto)
import { Meta } from "@/models";
import {
  createMeta,
  deleteMeta,
  getAllMetas,
  updateMeta,
} from "@/services/metaService";
import AnimatedSplashScreen from "../components/AnimatedSplashScreen";

// Impede que a Splash Screen nativa do Expo se esconda automaticamente
SplashScreen.preventAutoHideAsync();

const PONTOS_KEY = "@piggybank:pontos";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface SaldoContextData {
  pontos: number;
  setPontos: React.Dispatch<React.SetStateAction<number>>;
  chapeusComprados: string[];
  setChapeusComprados: React.Dispatch<React.SetStateAction<string[]>>;
  chapeuEquipado: string;
  setChapeuEquipado: React.Dispatch<React.SetStateAction<string>>;
  ofensiva: number;
  setOfensiva: React.Dispatch<React.SetStateAction<number>>;
  ultimoDeposito: string | null;
  setUltimoDeposito: React.Dispatch<React.SetStateAction<string | null>>;
  recuperadoresOfensiva: number;
  setRecuperadoresOfensiva: React.Dispatch<React.SetStateAction<number>>;
  carregandoMetas: boolean;
  criarMeta: (nome: string, valorMeta: number, dataPrazo: string) => Promise<Meta>;
  editarMeta: (metaAtualizada: Meta) => Promise<void>;
  excluirMeta: (id: string) => Promise<void>;
  metas: Meta[];
  setMetas: React.Dispatch<React.SetStateAction<Meta[]>>;
  metaAtivaId: string | null;
  setMetaAtivaId: React.Dispatch<React.SetStateAction<string | null>>;
  tema: "light" | "dark";
  isDark: boolean;
  alternarTema: () => Promise<void>;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const SaldoContext = createContext<SaldoContextData | undefined>(undefined);

export function useSaldo(): SaldoContextData {
  const context = useContext(SaldoContext);
  if (!context) {
    throw new Error("useSaldo deve ser usado dentro de um SaldoProvider");
  }
  return context;
}

// ─── Layout Raiz ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Estados para controle da Splash Screen e Carregamento
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);

  // Estados globais de Saldo e Metas
  const [pontos, setPontos] = useState<number>(0);
  const [chapeusComprados, setChapeusComprados] = useState<string[]>([]);
  const [chapeuEquipado, setChapeuEquipado] = useState<string>("");
  const [ofensiva, setOfensiva] = useState<number>(0);
  const [ultimoDeposito, setUltimoDeposito] = useState<string | null>(null);
  const [recuperadoresOfensiva, setRecuperadoresOfensiva] = useState<number>(0);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [metaAtivaId, setMetaAtivaId] = useState<string | null>(null);
  const [carregandoMetas, setCarregandoMetas] = useState(true);
  const [tema, setTema] = useState<"light" | "dark">(
    colorScheme === "dark" ? "dark" : "light",
  );

  // Carrega metas do armazenamento e prepara o app
  useEffect(() => {
    async function prepare() {
      try {
        const temaSalvo = await AsyncStorage.getItem("@piggybank:tema");
        if (temaSalvo === "light" || temaSalvo === "dark") {
          setTema(temaSalvo);
        }

        const pontosSalvos = await AsyncStorage.getItem(PONTOS_KEY);
        if (pontosSalvos != null) {
          const parsed = Number(pontosSalvos);
          if (Number.isFinite(parsed) && parsed >= 0) setPontos(parsed);
        }

        const metasSalvas = await getAllMetas();
        setMetas(metasSalvas);
        setMetaAtivaId((current) => current ?? metasSalvas[0]?.id ?? null);
      } catch (e) {
        console.warn("Erro ao carregar metas:", e);
      } finally {
        setCarregandoMetas(false);
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  // Persistência de pontos (evita reset ao fechar o app)
  useEffect(() => {
    AsyncStorage.setItem(PONTOS_KEY, String(pontos)).catch(() => {
      // evita quebrar UI por erro de storage
    });
  }, [pontos]);

  // Garante flush ao ir para background (fechar app)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        AsyncStorage.setItem(PONTOS_KEY, String(pontos)).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [pontos]);

  const alternarTema = async () => {
    const proximo: "light" | "dark" = tema === "dark" ? "light" : "dark";
    setTema(proximo);
    await AsyncStorage.setItem("@piggybank:tema", proximo);
  };

  const refreshMetas = async () => {
    const metasSalvas = await getAllMetas();
    setMetas(metasSalvas);
    setMetaAtivaId((current) => current ?? metasSalvas[0]?.id ?? null);
    return metasSalvas;
  };

  const criarMeta = async (nome: string, valorMeta: number, dataPrazo: string) => {
    const novaMeta = await createMeta(nome, valorMeta, dataPrazo);
    setMetas((prev) => [...prev, novaMeta]);
    setMetaAtivaId((current) => current ?? novaMeta.id);
    return novaMeta;
  };

  const editarMeta = async (metaAtualizada: Meta) => {
    await updateMeta(metaAtualizada);
    await refreshMetas();
  };

  const excluirMeta = async (id: string) => {
    await deleteMeta(id);
    setMetas((prev) => {
      const next = prev.filter((meta) => meta.id !== id);
      if (metaAtivaId === id) {
        setMetaAtivaId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  // Esconde a splash nativa assim que o componente estiver pronto para renderizar a animada
  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // Enquanto o app não estiver pronto OU a animação da moeda não terminar
  if (!appIsReady || !splashAnimationFinished) {
    return (
      <AnimatedSplashScreen
        onAnimationFinish={() => setSplashAnimationFinished(true)}
      />
    );
  }

  // Renderização final do aplicativo
  return (
    <ThemeProvider value={tema === "dark" ? DarkTheme : DefaultTheme}>
      <SaldoContext.Provider
        value={{
          pontos,
          setPontos,
          chapeusComprados,
          setChapeusComprados,
          chapeuEquipado,
          setChapeuEquipado,
          ofensiva,
          setOfensiva,
          ultimoDeposito,
          setUltimoDeposito,
          recuperadoresOfensiva,
          setRecuperadoresOfensiva,
          carregandoMetas,
          criarMeta,
          editarMeta,
          excluirMeta,
          metas,
          setMetas,
          metaAtivaId,
          setMetaAtivaId,
          tema,
          isDark: tema === "dark",
          alternarTema,
        }}
      >
        <Stack initialRouteName="(tabs)">
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="loja"
            options={{ presentation: "card", headerShown: false }}
          />
          <Stack.Screen
            name="objetivo"
            options={{ presentation: "modal", headerShown: false }}
          />
        </Stack>
      </SaldoContext.Provider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
