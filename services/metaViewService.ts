import { Meta, Plano, StatusMeta } from "../models";
import { calcularPlanoAjustado, calcularProgresso } from "../utils/Calculos";
import { getStatusMeta } from "../utils/Status";

export interface MetaView {
  meta: Meta;
  status: StatusMeta;
  progresso: number;
  restante: number;
  planoOriginal: Plano;
  planoAjustado: Plano;
}

export function toMetaView(meta: Meta): MetaView {
  const restante = Math.max(0, meta.valorMeta - meta.valorAtual);

  return {
    meta,
    status: getStatusMeta(meta),
    progresso: calcularProgresso(meta),
    restante,
    planoOriginal: meta.planoOriginal,
    planoAjustado: calcularPlanoAjustado(meta),
  };
}
