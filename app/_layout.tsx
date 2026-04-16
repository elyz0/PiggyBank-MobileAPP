// app/_layout.tsx
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { createContext, useContext, useEffect, useState } from "react";
import "react-native-reanimated";

// Importe o seu componente de animação (certifique-se que o caminho está correto)
import AnimatedSplashScreen from "../components/AnimatedSplashScreen";

// Impede que a Splash Screen nativa do Expo se esconda automaticamente
SplashScreen.preventAutoHideAsync();

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface Meta {
  id: string;
  nome: string;
  valorTotal: number;
  valorGuardado: number;
  emoji?: string;
}

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
  metas: Meta[];
  setMetas: React.Dispatch<React.SetStateAction<Meta[]>>;
  metaAtivaId: string | null;
  setMetaAtivaId: React.Dispatch<React.SetStateAction<string | null>>;
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

  // Efeito para preparar o app (carregar dados, esconder splash nativa)
  useEffect(() => {
    async function prepare() {
      try {
        // Simulação de carregamento de dados (ou busca no AsyncStorage)
        // Reduzido para 200ms para a animação da moeda aparecer logo
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (e) {
        console.warn("Erro ao preparar o app:", e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

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
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
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
          metas,
          setMetas,
          metaAtivaId,
          setMetaAtivaId,
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
