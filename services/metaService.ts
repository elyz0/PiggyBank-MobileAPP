import { Aporte, Meta } from "../models";
import { calcularPlanoOriginal } from "../utils/Calculos";
import { getAportes, saveAportes } from "../storage/aporteStorage";
import { getMetas, saveMetas } from "../storage/metaStorage";

function gerarId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 8);
}

function parseDataIso(data: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new Error("Data do prazo invalida. Use o formato YYYY-MM-DD.");
  }

  const [ano, mes, dia] = data.split("-").map(Number);
  const prazo = new Date(ano, mes - 1, dia);

  const dataInvalida =
    prazo.getFullYear() !== ano ||
    prazo.getMonth() !== mes - 1 ||
    prazo.getDate() !== dia;

  if (dataInvalida) {
    throw new Error("Data do prazo invalida.");
  }

  return prazo;
}

function validarNome(nome: string): void {
  if (!nome.trim()) {
    throw new Error("Informe um nome para a meta.");
  }
}

function validarValorMeta(valor: number): void {
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error("O valor da meta deve ser maior que zero.");
  }
}

function validarDataFutura(data: string): void {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const prazo = parseDataIso(data);
  prazo.setHours(0, 0, 0, 0);

  if (prazo <= hoje) {
    throw new Error("A data do prazo deve ser futura.");
  }
}

function validarValorAporte(valor: number): void {
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error("O valor do aporte deve ser maior que zero.");
  }
}

function calcularTotalAportes(aportes: Aporte[], metaId: string): number {
  return aportes
    .filter((aporte) => aporte.metaId === metaId)
    .reduce((total, aporte) => total + aporte.valor, 0);
}

async function sincronizarValorAtual(metaId: string): Promise<void> {
  const [metas, aportes] = await Promise.all([getMetas(), getAportes()]);
  const index = metas.findIndex((meta) => meta.id === metaId);
  if (index === -1) return;

  metas[index] = {
    ...metas[index],
    valorAtual: calcularTotalAportes(aportes, metaId),
  };

  await saveMetas(metas);
}

export async function createMeta(
  nome: string,
  valorMeta: number,
  dataPrazo: string,
): Promise<Meta> {
  validarNome(nome);
  validarValorMeta(valorMeta);
  validarDataFutura(dataPrazo);

  const planoOriginal = calcularPlanoOriginal(valorMeta, dataPrazo);

  const novaMeta: Meta = {
    id: gerarId(),
    nome: nome.trim(),
    valorMeta,
    valorAtual: 0,
    dataPrazo,
    dataCriacao: new Date().toISOString(),
    planoOriginal,
  };

  const metas = await getMetas();
  metas.push(novaMeta);
  await saveMetas(metas);

  return novaMeta;
}

export async function getAllMetas(): Promise<Meta[]> {
  return getMetas();
}

export async function getMetaById(id: string): Promise<Meta | undefined> {
  const metas = await getMetas();
  return metas.find((meta) => meta.id === id);
}

export async function updateMeta(metaAtualizada: Meta): Promise<void> {
  validarNome(metaAtualizada.nome);
  validarValorMeta(metaAtualizada.valorMeta);
  validarDataFutura(metaAtualizada.dataPrazo);

  const metas = await getMetas();
  const index = metas.findIndex((meta) => meta.id === metaAtualizada.id);
  if (index === -1) throw new Error("Meta nao encontrada.");

  const planoOriginal = calcularPlanoOriginal(
    metaAtualizada.valorMeta,
    metaAtualizada.dataPrazo,
  );

  metas[index] = {
    ...metaAtualizada,
    nome: metaAtualizada.nome.trim(),
    planoOriginal,
  };

  await saveMetas(metas);
}

export async function deleteMeta(id: string): Promise<void> {
  const [metas, aportes] = await Promise.all([getMetas(), getAportes()]);
  await saveMetas(metas.filter((meta) => meta.id !== id));
  await saveAportes(aportes.filter((aporte) => aporte.metaId !== id));
}

export async function getAportesByMeta(metaId: string): Promise<Aporte[]> {
  const aportes = await getAportes();
  return aportes
    .filter((aporte) => aporte.metaId === metaId)
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

export async function addAporte(
  metaId: string,
  valor: number,
): Promise<{ excesso?: number; aporte?: Aporte }> {
  validarValorAporte(valor);

  const meta = await getMetaById(metaId);
  if (!meta) throw new Error("Meta nao encontrada.");

  const restante = Math.max(0, meta.valorMeta - meta.valorAtual);
  if (valor > restante) {
    return { excesso: valor - restante };
  }

  const aporte: Aporte = {
    id: gerarId(),
    metaId,
    valor,
    data: new Date().toISOString(),
  };

  const aportes = await getAportes();
  aportes.push(aporte);
  await saveAportes(aportes);
  await sincronizarValorAtual(metaId);

  return { aporte };
}

export async function addAporteComExcesso(
  metaId: string,
  valor: number,
): Promise<{ aporte: Aporte; excesso: number }> {
  validarValorAporte(valor);

  const meta = await getMetaById(metaId);
  if (!meta) throw new Error("Meta nao encontrada.");

  const restante = Math.max(0, meta.valorMeta - meta.valorAtual);
  const excesso = Math.max(0, valor - restante);

  const aporte: Aporte = {
    id: gerarId(),
    metaId,
    valor,
    data: new Date().toISOString(),
  };

  const aportes = await getAportes();
  aportes.push(aporte);
  await saveAportes(aportes);
  await sincronizarValorAtual(metaId);

  return { aporte, excesso };
}

export async function updateAporte(
  aporteId: string,
  novoValor: number,
): Promise<void> {
  validarValorAporte(novoValor);

  const aportes = await getAportes();
  const index = aportes.findIndex((aporte) => aporte.id === aporteId);
  if (index === -1) throw new Error("Aporte nao encontrado.");

  const metaId = aportes[index].metaId;
  aportes[index] = { ...aportes[index], valor: novoValor };
  await saveAportes(aportes);
  await sincronizarValorAtual(metaId);
}

export async function deleteAporte(aporteId: string): Promise<void> {
  const aportes = await getAportes();
  const aporte = aportes.find((item) => item.id === aporteId);
  if (!aporte) return;

  await saveAportes(aportes.filter((item) => item.id !== aporteId));
  await sincronizarValorAtual(aporte.metaId);
}
