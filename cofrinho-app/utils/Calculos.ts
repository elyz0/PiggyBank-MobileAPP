import { Meta, Plano } from "../models";

//Calcula quantos dias faltam para o prazo da meta
function diasRestantes(dataPrazo: string): number {
  const hoje = new Date();
  const prazo = new Date(dataPrazo);

  const diff = prazo.getTime() - hoje.getTime();

  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

//Para convertes os dias
function semanasRestantes(dias: number): number {
  return Math.max(1, dias / 7);
}

function mesesRestantes(dias: number): number {
  return Math.max(1, dias / 30);
}

//Calculo base usado em tudo
export function calcularPlanoBase(valor: number, dias: number): Plano {
  return {
    diario: valor / dias,
    semanal: valor / semanasRestantes(dias),
    mensal: valor / mesesRestantes(dias),
  };
}

//RF02 - PLANO ORIGINAL
export function calcularPlanoOriginal(
  valorMeta: number,
  dataPrazo: string
): Plano {
  const dias = diasRestantes(dataPrazo);

  return calcularPlanoBase(valorMeta, dias);
}

//PLANO AJUSTADO (RF02 + RN02)
export function calcularPlanoAjustado(meta: Meta): Plano {
  const dias = diasRestantes(meta.dataPrazo);

  const restante = Math.max(0, meta.valorMeta - meta.valorAtual);

  return calcularPlanoBase(restante, dias);
}

//PORCENTAGEM DE PROGRESSO (RF06)
export function calcularProgresso(meta: Meta): number {
  if (meta.valorMeta === 0) return 0;

  return Math.min(100, (meta.valorAtual / meta.valorMeta) * 100);
}