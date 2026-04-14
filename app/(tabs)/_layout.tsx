import { Stack } from "expo-router";
import React, { createContext, useContext, useState } from "react";

// 1. Definição do objeto de uma Meta
interface Meta {
  id: string;
  nome: string;
  valorTotal: number;
  valorGuardado: number; // Saldo acumulado específico desta meta
  salarioRef: number; // Salário registrado no momento da criação
  diasPrazo: number; // Em quantos dias quer alcançar
  dataCriacao: number;
}

// 2. Interface do Contexto Global
interface SaldoContextData {
  saldo: number;
  setSaldo: React.Dispatch<React.SetStateAction<number>>;

  // Gerenciamento de Múltiplas Metas
  metas: Meta[];
  setMetas: React.Dispatch<React.SetStateAction<Meta[]>>;
  metaAtivaId: string | null;
  setMetaAtivaId: React.Dispatch<React.SetStateAction<string | null>>;

  // Loja e Pontos
  pontos: number;
  setPontos: React.Dispatch<React.SetStateAction<number>>;
  chapeusComprados: string[];
  setChapeusComprados: React.Dispatch<React.SetStateAction<string[]>>;
  chapeuEquipado: string;
  setChapeuEquipado: React.Dispatch<React.SetStateAction<string>>;
}

const SaldoContext = createContext<SaldoContextData>({} as SaldoContextData);

export const useSaldo = () => useContext(SaldoContext);

export default function RootLayout() {
  // Estado do Porquinho
  const [saldo, setSaldo] = useState(0);

  // Estados da Lista de Metas
  const [metas, setMetas] = useState<Meta[]>([]);
  const [metaAtivaId, setMetaAtivaId] = useState<string | null>(null);

  // Estados da Loja
  const [pontos, setPontos] = useState(0);
  const [chapeusComprados, setChapeusComprados] = useState<string[]>([]);
  const [chapeuEquipado, setChapeuEquipado] = useState("");

  return (
    <SaldoContext.Provider
      value={{
        saldo,
        setSaldo,
        metas,
        setMetas,
        metaAtivaId,
        setMetaAtivaId,
        pontos,
        setPontos,
        chapeusComprados,
        setChapeusComprados,
        chapeuEquipado,
        setChapeuEquipado,
      }}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </SaldoContext.Provider>
  );
}
