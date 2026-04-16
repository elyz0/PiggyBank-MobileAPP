import { Meta, StatusMeta } from "../models";

function parseIsoDateOnly(data: string): Date {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

export function getStatusMeta(meta: Meta, agora: Date = new Date()): StatusMeta {
  if (meta.valorAtual >= meta.valorMeta) {
    return "concluida";
  }

  const hoje = new Date(agora);
  hoje.setHours(0, 0, 0, 0);

  const prazo = parseIsoDateOnly(meta.dataPrazo);
  prazo.setHours(0, 0, 0, 0);

  if (prazo < hoje) {
    return "vencida";
  }

  return "em_andamento";
}
