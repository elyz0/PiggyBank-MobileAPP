// ─────────────────────────────────────────────────────────────────────────────
// ADICIONE estes campos ao seu contexto existente em _layout.tsx
// ─────────────────────────────────────────────────────────────────────────────

// 1. Tipos novos — adicione na interface/type do contexto:
/*
  ofensiva: number;
  setOfensiva: React.Dispatch<React.SetStateAction<number>>;
  ultimoDeposito: string | null;
  setUltimoDeposito: React.Dispatch<React.SetStateAction<string | null>>;
  recuperadoresOfensiva: number;
  setRecuperadoresOfensiva: React.Dispatch<React.SetStateAction<number>>;
*/

// 2. Estados novos — adicione dentro do componente de layout:
/*
  const [ofensiva, setOfensiva] = useState<number>(0);
  const [ultimoDeposito, setUltimoDeposito] = useState<string | null>(null);
  const [recuperadoresOfensiva, setRecuperadoresOfensiva] = useState<number>(0);
*/

// 3. Passe pelo valor do contexto junto com os demais:
/*
  ofensiva,
  setOfensiva,
  ultimoDeposito,
  setUltimoDeposito,
  recuperadoresOfensiva,
  setRecuperadoresOfensiva,
*/

// ─────────────────────────────────────────────────────────────────────────────
// ADICIONE este item à COLECAO_CHAPEUS em loja.tsx (ou crie uma seção separada)
// ─────────────────────────────────────────────────────────────────────────────

export const ITEM_RECUPERADOR = {
  id: "recuperador_ofensiva",
  nome: "Recuperador de Ofensiva",
  preco: 200,
  descricao: "Salva sua sequência em dia ruim.",
  icone: "🛡️",
};

// ─────────────────────────────────────────────────────────────────────────────
// TRECHO ATUALIZADO de gerenciarChapeu para loja.tsx
// Substitua a função gerenciarChapeu existente por esta:
// ─────────────────────────────────────────────────────────────────────────────

/*
const gerenciarItem = (item: typeof COLECAO_ITENS[0]) => {
  // Recuperador de ofensiva — consumível, não equipa
  if (item.id === "recuperador_ofensiva") {
    if (pontos >= item.preco) {
      setPontos((prev) => prev - item.preco);
      setRecuperadoresOfensiva((prev) => prev + 1);
      alert(`🛡️ Recuperador adquirido! Você tem ${recuperadoresOfensiva + 1} recuperador(es).`);
    } else {
      alert("Pontos insuficientes! Continue batendo suas metas! ⭐️");
    }
    return;
  }

  // Chapéus — lógica original
  if (chapeusComprados.includes(item.id)) {
    setChapeuEquipado(chapeuEquipado === item.id ? "" : item.id);
    return;
  }
  if (pontos >= item.preco) {
    setPontos((prev) => prev - item.preco);
    setChapeusComprados((prev) => [...prev, item.id]);
    setChapeuEquipado(item.id);
  } else {
    alert("Pontos insuficientes! Continue batendo suas metas! ⭐️");
  }
};
*/
