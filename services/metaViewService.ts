import { Meta, Plano, StatusMeta } from "@/models";
import { calcularPlanoAjustado, calcularProgresso } from "@/utils/Calculos";

export interface MetaView extends Meta {
  status: StatusMeta;
  progresso: number;
  planoAjustado: Plano;
}

export function toMetaView(meta: Meta): MetaView {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prazo = new Date(meta.dataPrazo);
  prazo.setHours(0, 0, 0, 0);

  const status: StatusMeta =
    meta.valorAtual >= meta.valorMeta && meta.valorMeta > 0
      ? "concluida"
      : prazo < today
      ? "vencida"
      : "em_andamento";

  return {
    ...meta,
    status,
    progresso: calcularProgresso(meta),
    planoAjustado: calcularPlanoAjustado(meta),
  };
}
