import { Plano } from "./Plano"; 

export interface Meta {
  id: string;
  nome: string;
  valorMeta: number;
  valorAtual: number; //ValorAtual ficará na Meta poderia ser em aportes, mas manter salvo = mais simples e rápido
  dataPrazo: string;     //ISO (YYYY-MM-DD)
  dataCriacao: string;

  planoOriginal: Plano;  //Salvo na criação (RF02)
}