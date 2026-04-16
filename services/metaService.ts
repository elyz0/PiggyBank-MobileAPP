import { Meta } from "../models";
import { getMetas, saveMetas } from "../storage/metaStorage";
import { calcularPlanoOriginal } from "../utils/Calculos";

// 🔹 gerar id simples
function gerarId() {
  return Date.now().toString();
}

function parseDataIso(data: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new Error("Data do prazo inválida. Use o formato YYYY-MM-DD.");
  }

  const [ano, mes, dia] = data.split("-").map(Number);
  const prazo = new Date(ano, mes - 1, dia);

  const dataInvalida =
    prazo.getFullYear() !== ano ||
    prazo.getMonth() !== mes - 1 ||
    prazo.getDate() !== dia;

  if (dataInvalida) {
    throw new Error("Data do prazo inválida.");
  }

  return prazo;
}

// 🔹 RN01 - validar data
function validarDataFutura(data: string) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const prazo = parseDataIso(data);
  prazo.setHours(0, 0, 0, 0);

  if (prazo <= hoje) {
    throw new Error("A data do prazo deve ser futura.");
  }
}

function validarValorAporte(valor: number) {
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error("O valor do aporte deve ser maior que zero.");
  }
}

// 🔹 CRIAR META (RF01 + RF02 + RN01)
export async function createMeta(
  nome: string,
  valorMeta: number,
  dataPrazo: string
): Promise<Meta> {
  validarDataFutura(dataPrazo);

  const planoOriginal = calcularPlanoOriginal(valorMeta, dataPrazo);

  const novaMeta: Meta = {
    id: gerarId(),
    nome,
    valorMeta,
    valorAtual: 0,
    dataPrazo,
    dataCriacao: new Date().toISOString(),
    chapeuEquipadoId: null,
    planoOriginal,
  };

  const metas = await getMetas();
  metas.push(novaMeta);

  await saveMetas(metas);

  return novaMeta;
}

// 🔹 LISTAR METAS
export async function getAllMetas(): Promise<Meta[]> {
  return await getMetas();
}

// 🔹 BUSCAR META POR ID
export async function getMetaById(id: string): Promise<Meta | undefined> {
  const metas = await getMetas();
  return metas.find((m) => m.id === id);
}

// 🔹 EDITAR META (RF08)
export async function updateMeta(metaAtualizada: Meta): Promise<void> {
  validarDataFutura(metaAtualizada.dataPrazo);

  const metas = await getMetas();

  const index = metas.findIndex((m) => m.id === metaAtualizada.id);

  if (index === -1) throw new Error("Meta não encontrada");

  // se prazo mudou → novo plano original (RF08)
  metas[index] = {
    ...metaAtualizada,
    planoOriginal: calcularPlanoOriginal(
      metaAtualizada.valorMeta,
      metaAtualizada.dataPrazo
    ),
  };

  await saveMetas(metas);
}

// 🔹 DELETAR META
export async function deleteMeta(id: string): Promise<void> {
  const metas = await getMetas();

  const novas = metas.filter((m) => m.id !== id);

  await saveMetas(novas);
}

// 🔹 ADICIONAR APORTE (RF04 + RN03)
export async function addAporte(
  metaId: string,
  valor: number
): Promise<{ excesso?: number }> {
  validarValorAporte(valor);

  const metas = await getMetas();

  const meta = metas.find((m) => m.id === metaId);
  if (!meta) throw new Error("Meta não encontrada");

  const restante = meta.valorMeta - meta.valorAtual;

  // RN03 - excesso
  if (valor > restante) {
    return {
      excesso: valor - restante,
    };
  }

  meta.valorAtual += valor;

  await saveMetas(metas);

  return {};
}

// 🔹 FORÇAR APORTE COM EXCESSO (quando usuário aceita)
export async function addAporteComExcesso(
  metaId: string,
  valor: number
): Promise<void> {
  validarValorAporte(valor);

  const metas = await getMetas();

  const meta = metas.find((m) => m.id === metaId);
  if (!meta) throw new Error("Meta não encontrada");

  meta.valorAtual += valor;

  await saveMetas(metas);
}
