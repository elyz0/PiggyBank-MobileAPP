import { Stack } from "expo-router";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Aporte, Meta } from "../../models";
import {
  addAporte,
  addAporteComExcesso,
  createMeta,
  deleteAporte,
  deleteMeta,
  getAllMetas,
  getAportesByMeta,
  updateAporte,
  updateMeta,
} from "../../services/metaService";

interface AddAporteResult {
  excesso?: number;
}

interface SaldoContextData {
  metas: Meta[];
  aportes: Aporte[];
  metaAtivaId: string | null;
  carregandoMetas: boolean;
  pontos: number;
  setPontos: React.Dispatch<React.SetStateAction<number>>;
  chapeusComprados: string[];
  setChapeusComprados: React.Dispatch<React.SetStateAction<string[]>>;
  chapeuEquipado: string;
  setChapeuEquipado: React.Dispatch<React.SetStateAction<string>>;
  setMetaAtivaId: React.Dispatch<React.SetStateAction<string | null>>;
  recarregarMetas: () => Promise<void>;
  criarMeta: (nome: string, valorMeta: number, dataPrazo: string) => Promise<Meta>;
  editarMeta: (meta: Meta) => Promise<void>;
  excluirMeta: (metaId: string) => Promise<void>;
  registrarAporte: (metaId: string, valor: number, permitirExcesso?: boolean) => Promise<AddAporteResult>;
  editarAporte: (aporteId: string, valor: number) => Promise<void>;
  excluirAporte: (aporteId: string) => Promise<void>;
  recarregarAportesMetaAtiva: () => Promise<void>;
}

const SaldoContext = createContext<SaldoContextData>({} as SaldoContextData);
export const useSaldo = () => useContext(SaldoContext);

export default function RootLayout() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [aportes, setAportes] = useState<Aporte[]>([]);
  const [metaAtivaId, setMetaAtivaId] = useState<string | null>(null);
  const [carregandoMetas, setCarregandoMetas] = useState(true);

  const [pontos, setPontos] = useState(0);
  const [chapeusComprados, setChapeusComprados] = useState<string[]>([]);
  const [chapeuEquipado, setChapeuEquipado] = useState("");

  const recarregarAportesMetaAtiva = async () => {
    if (!metaAtivaId) {
      setAportes([]);
      return;
    }
    const lista = await getAportesByMeta(metaAtivaId);
    setAportes(lista);
  };

  const recarregarMetas = async () => {
    setCarregandoMetas(true);
    const lista = await getAllMetas();
    setMetas(lista);

    setMetaAtivaId((atual) => {
      if (atual && lista.some((meta) => meta.id === atual)) return atual;
      return lista[0]?.id ?? null;
    });
    setCarregandoMetas(false);
  };

  useEffect(() => {
    recarregarMetas().catch(() => setCarregandoMetas(false));
  }, []);

  useEffect(() => {
    recarregarAportesMetaAtiva().catch(() => setAportes([]));
  }, [metaAtivaId]);

  const criarMeta = async (nome: string, valorMeta: number, dataPrazo: string) => {
    const novaMeta = await createMeta(nome, valorMeta, dataPrazo);
    await recarregarMetas();
    setMetaAtivaId(novaMeta.id);
    return novaMeta;
  };

  const editarMeta = async (meta: Meta) => {
    await updateMeta(meta);
    await recarregarMetas();
  };

  const excluirMeta = async (metaId: string) => {
    await deleteMeta(metaId);
    await recarregarMetas();
  };

  const registrarAporte = async (metaId: string, valor: number, permitirExcesso = false) => {
    const resultado = permitirExcesso
      ? await addAporteComExcesso(metaId, valor)
      : await addAporte(metaId, valor);

    if (resultado.excesso !== undefined && !permitirExcesso) {
      return { excesso: resultado.excesso };
    }

    await recarregarMetas();
    await recarregarAportesMetaAtiva();
    return { excesso: resultado.excesso };
  };

  const editarAporte = async (aporteId: string, valor: number) => {
    await updateAporte(aporteId, valor);
    await recarregarMetas();
    await recarregarAportesMetaAtiva();
  };

  const excluirAporte = async (aporteId: string) => {
    await deleteAporte(aporteId);
    await recarregarMetas();
    await recarregarAportesMetaAtiva();
  };

  const value = useMemo(
    () => ({
      metas,
      aportes,
      metaAtivaId,
      carregandoMetas,
      pontos,
      setPontos,
      chapeusComprados,
      setChapeusComprados,
      chapeuEquipado,
      setChapeuEquipado,
      setMetaAtivaId,
      recarregarMetas,
      criarMeta,
      editarMeta,
      excluirMeta,
      registrarAporte,
      editarAporte,
      excluirAporte,
      recarregarAportesMetaAtiva,
    }),
    [metas, aportes, metaAtivaId, carregandoMetas, pontos, chapeusComprados, chapeuEquipado],
  );

  return (
    <SaldoContext.Provider value={value}>
      <Stack screenOptions={{ headerShown: false }} />
    </SaldoContext.Provider>
  );
}
