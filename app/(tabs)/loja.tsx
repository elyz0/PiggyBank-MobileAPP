// app/loja.tsx ─── Loja de itens para o porquinho
import { useSaldo } from "@/app/_layout";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ─── Catálogo ─────────────────────────────────────────────────────────────────

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  emoji: string;
  preco: number;
  categoria: "chapeu" | "recuperador" | "bonus";
  destaque?: boolean;
}

const PRODUTOS: Produto[] = [
  // Chapéus
  {
    id: "chapeu_cowboy",
    nome: "Chapéu Cowboy",
    descricao: "Um clássico do Oeste para seu porquinho aventureiro.",
    emoji: "🤠",
    preco: 50,
    categoria: "chapeu",
  },
  {
    id: "chapeu_festa",
    nome: "Chapéu de Festa",
    descricao: "Celebre cada meta conquistada com estilo!",
    emoji: "🎉",
    preco: 40,
    categoria: "chapeu",
    destaque: true,
  },
  {
    id: "chapeu_mago",
    nome: "Chapéu de Mago",
    descricao: "Magicamente economize mais a cada dia.",
    emoji: "🧙",
    preco: 80,
    categoria: "chapeu",
  },
  {
    id: "chapeu_chef",
    nome: "Chapéu de Chef",
    descricao: "Cozinhe uma receita perfeita de poupança.",
    emoji: "👨‍🍳",
    preco: 60,
    categoria: "chapeu",
  },
  {
    id: "chapeu_coroa",
    nome: "Coroa Real",
    descricao: "Para o poupador que merece reinar.",
    emoji: "👑",
    preco: 150,
    categoria: "chapeu",
    destaque: true,
  },
  {
    id: "chapeu_astronauta",
    nome: "Capacete Lunar",
    descricao: "Sua poupança vai chegar à Lua!",
    emoji: "🚀",
    preco: 120,
    categoria: "chapeu",
  },
  // Recuperadores
  {
    id: "rec_1",
    nome: "Escudo de Sequência",
    descricao: "Protege sua ofensiva por 1 dia sem depósito.",
    emoji: "🛡️",
    preco: 30,
    categoria: "recuperador",
    destaque: true,
  },
  {
    id: "rec_3",
    nome: "Pack de Escudos",
    descricao: "3 escudos de sequência pelo preço de 2.",
    emoji: "⚔️",
    preco: 60,
    categoria: "recuperador",
  },
];

const CATEGORIAS = [
  { id: "todos", label: "Tudo", emoji: "🛍️" },
  { id: "chapeu", label: "Chapéus", emoji: "🎩" },
  { id: "recuperador", label: "Escudos", emoji: "🛡️" },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COR = {
  bg: "#0F0F1A",
  card: "#1A1A2E",
  cardBorder: "#2A2A4A",
  accent: "#7C6FE0",
  accentLight: "#A89CF0",
  gold: "#FFD700",
  green: "#4ADE80",
  red: "#F87171",
  text: "#F0EEFF",
  textMuted: "#9090B0",
  tag: "#2A2A4A",
};

// ─── Componente de card de produto ───────────────────────────────────────────

function ProdutoCard({
  produto,
  comprado,
  equipado,
  podeComprar,
  onComprar,
  onEquipar,
}: {
  produto: Produto;
  comprado: boolean;
  equipado: boolean;
  podeComprar: boolean;
  onComprar: () => void;
  onEquipar: () => void;
}) {
  const categoriaLabel =
    produto.categoria === "chapeu"
      ? "Chapéu"
      : produto.categoria === "recuperador"
        ? "Escudo"
        : "Bônus";

  return (
    <View
      style={[
        styles.card,
        produto.destaque && styles.cardDestaque,
        equipado && styles.cardEquipado,
      ]}
    >
      {produto.destaque && (
        <View style={styles.destaqueTag}>
          <Text style={styles.destaqueTagText}>⭐ Popular</Text>
        </View>
      )}

      <View style={styles.cardTop}>
        <View style={styles.emojiBox}>
          <Text style={styles.cardEmoji}>{produto.emoji}</Text>
        </View>
        <View style={styles.categoriaTag}>
          <Text style={styles.categoriaTagText}>{categoriaLabel}</Text>
        </View>
      </View>

      <Text style={styles.cardNome}>{produto.nome}</Text>
      <Text style={styles.cardDesc}>{produto.descricao}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.precoRow}>
          <Text style={styles.precoCoin}>⭐</Text>
          <Text style={styles.precoValor}>{produto.preco}</Text>
        </View>

        {equipado ? (
          <View style={styles.btnEquipado}>
            <Text style={styles.btnEquipadoText}>✓ Equipado</Text>
          </View>
        ) : comprado && produto.categoria === "chapeu" ? (
          <Pressable style={styles.btnEquipar} onPress={onEquipar}>
            <Text style={styles.btnEquiparText}>Equipar</Text>
          </Pressable>
        ) : comprado ? (
          <View style={styles.btnComprado}>
            <Text style={styles.btnCompradoText}>✓ Obtido</Text>
          </View>
        ) : (
          <Pressable
            style={[
              styles.btnComprar,
              !podeComprar && styles.btnComprarDisabled,
            ]}
            onPress={onComprar}
          >
            <Text style={styles.btnComprarText}>
              {podeComprar ? "Comprar" : "Sem pontos"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Tela da Loja ─────────────────────────────────────────────────────────────

export default function LojaScreen() {
  const router = useRouter();
  const {
    pontos,
    setPontos,
    chapeusComprados,
    setChapeusComprados,
    chapeuEquipado,
    setChapeuEquipado,
    recuperadoresOfensiva,
    setRecuperadoresOfensiva,
  } = useSaldo();

  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("todos");
  const [modalItem, setModalItem] = useState<Produto | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // ── Filtro ────────────────────────────────────────────────────────────────
  const produtosFiltrados =
    categoriaAtiva === "todos"
      ? PRODUTOS
      : PRODUTOS.filter((p) => p.categoria === categoriaAtiva);

  // ── Ações ─────────────────────────────────────────────────────────────────
  const mostrarToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const confirmarCompra = (produto: Produto) => {
    // AVISO DE PONTOS INSUFICIENTES
    if (pontos < produto.preco) {
      mostrarToast(`❌ Pontos insuficientes para comprar ${produto.nome}!`);
      setModalItem(null);
      return;
    }

    setPontos((prev) => prev - produto.preco);

    if (produto.categoria === "chapeu") {
      setChapeusComprados((prev) => [...prev, produto.id]);
      setChapeuEquipado(produto.id);
      mostrarToast(`${produto.emoji} ${produto.nome} equipado!`);
    } else if (produto.categoria === "recuperador") {
      const qtd = produto.id === "rec_3" ? 3 : 1;
      setRecuperadoresOfensiva((prev: number) => prev + qtd);
      mostrarToast(
        `🛡️ +${qtd} escudo${qtd > 1 ? "s" : ""} adicionado${qtd > 1 ? "s" : ""}!`,
      );
    }

    setModalItem(null);
  };

  const equipar = (id: string) => {
    setChapeuEquipado(id);
    mostrarToast("✨ Chapéu equipado com sucesso!");
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Loja</Text>
          <Text style={styles.headerSub}>Gaste seus pontos com sabedoria</Text>
        </View>
        <View style={styles.pontosChip}>
          <Text style={styles.pontosEmoji}>⭐</Text>
          <Text style={styles.pontosValor}>{pontos}</Text>
        </View>
      </View>

      {/* ── Filtros ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtrosRow}
      >
        {CATEGORIAS.map((cat) => (
          <Pressable
            key={cat.id}
            style={[
              styles.filtroBtn,
              categoriaAtiva === cat.id && styles.filtroBtnAtivo,
            ]}
            onPress={() => setCategoriaAtiva(cat.id)}
          >
            <Text style={styles.filtroEmoji}>{cat.emoji}</Text>
            <Text
              style={[
                styles.filtroLabel,
                categoriaAtiva === cat.id && styles.filtroLabelAtivo,
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Grid de produtos ── */}
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridInner}>
          {produtosFiltrados.map((produto) => (
            <ProdutoCard
              key={produto.id}
              produto={produto}
              comprado={chapeusComprados.includes(produto.id)}
              equipado={chapeuEquipado === produto.id}
              podeComprar={pontos >= produto.preco}
              onComprar={() => setModalItem(produto)}
              onEquipar={() => equipar(produto.id)}
            />
          ))}
        </View>
      </ScrollView>

      {/* ── Modal de confirmação ── */}
      <Modal
        visible={!!modalItem}
        transparent
        animationType="fade"
        onRequestClose={() => setModalItem(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalItem(null)}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalEmoji}>{modalItem?.emoji}</Text>
            <Text style={styles.modalNome}>{modalItem?.nome}</Text>
            <Text style={styles.modalDesc}>{modalItem?.descricao}</Text>

            <View style={styles.modalPrecoRow}>
              <Text style={styles.modalPrecoLabel}>Custo:</Text>
              <Text style={styles.modalPreco}>⭐ {modalItem?.preco}</Text>
            </View>
            <View style={styles.modalPrecoRow}>
              <Text style={styles.modalPrecoLabel}>Seus pontos:</Text>
              <Text
                style={[
                  styles.modalPreco,
                  (modalItem?.preco ?? 0) > pontos
                    ? { color: COR.red }
                    : { color: COR.green },
                ]}
              >
                ⭐ {pontos}
              </Text>
            </View>

            <View style={styles.modalBtns}>
              <Pressable
                style={styles.modalBtnCancelar}
                onPress={() => setModalItem(null)}
              >
                <Text style={styles.modalBtnCancelarText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalBtnConfirmar,
                  (modalItem?.preco ?? 0) > pontos &&
                    styles.modalBtnConfirmarDisabled,
                ]}
                onPress={() => modalItem && confirmarCompra(modalItem)}
              >
                <Text style={styles.modalBtnConfirmarText}>
                  {(modalItem?.preco ?? 0) > pontos
                    ? "Pontos Insuficientes"
                    : "Confirmar Compra"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* ── Toast com estilo de erro condicional ── */}
      {toastMsg && (
        <View
          style={[
            styles.toast,
            toastMsg.includes("❌") && {
              borderColor: COR.red,
              backgroundColor: "#2A1010",
            },
          ]}
        >
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COR.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    backgroundColor: COR.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COR.cardBorder,
  },
  backBtnText: { color: COR.accentLight, fontWeight: "600", fontSize: 13 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COR.text,
    textAlign: "center",
  },
  headerSub: { fontSize: 11, color: COR.textMuted, textAlign: "center" },
  pontosChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2A2A00",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#4A4A00",
  },
  pontosEmoji: { fontSize: 15 },
  pontosValor: { fontSize: 16, fontWeight: "800", color: COR.gold },
  filtrosRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 16,
  },
  filtroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 125,
    height: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COR.card,
    borderWidth: 1,
    borderColor: COR.cardBorder,
  },
  filtroBtnAtivo: { backgroundColor: COR.accent, borderColor: COR.accent },
  filtroEmoji: { fontSize: 14 },
  filtroLabel: { fontSize: 13, color: COR.textMuted, fontWeight: "600" },
  filtroLabelAtivo: { color: "#fff" },
  grid: { paddingBottom: 40, paddingHorizontal: 16 },
  gridInner: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  card: {
    width: "47.5%",
    backgroundColor: COR.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COR.cardBorder,
    position: "relative",
  },
  cardDestaque: {
    borderColor: COR.accent,
    shadowColor: COR.accent,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  cardEquipado: {
    borderColor: COR.green,
    shadowColor: COR.green,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  destaqueTag: {
    position: "absolute",
    top: -1,
    right: 12,
    backgroundColor: COR.accent,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  destaqueTagText: { fontSize: 9, fontWeight: "700", color: "#fff" },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    marginTop: 8,
  },
  emojiBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#252540",
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: { fontSize: 28 },
  categoriaTag: {
    backgroundColor: COR.tag,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoriaTagText: { fontSize: 9, color: COR.textMuted, fontWeight: "600" },
  cardNome: {
    fontSize: 13,
    fontWeight: "800",
    color: COR.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: COR.textMuted,
    lineHeight: 16,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  precoRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  precoCoin: { fontSize: 12 },
  precoValor: { fontSize: 14, fontWeight: "800", color: COR.gold },
  btnComprar: {
    backgroundColor: COR.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  btnComprarDisabled: { backgroundColor: "#333", opacity: 0.6 },
  btnComprarText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  btnEquipar: {
    backgroundColor: "transparent",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: COR.accentLight,
  },
  btnEquiparText: { color: COR.accentLight, fontSize: 11, fontWeight: "700" },
  btnEquipado: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#0D2B1A",
  },
  btnEquipadoText: { color: COR.green, fontSize: 11, fontWeight: "700" },
  btnComprado: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#1A2B0D",
  },
  btnCompradoText: { color: COR.green, fontSize: 11, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: COR.card,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: COR.cardBorder,
    alignItems: "center",
  },
  modalEmoji: { fontSize: 52, marginBottom: 12 },
  modalNome: {
    fontSize: 20,
    fontWeight: "800",
    color: COR.text,
    marginBottom: 6,
    textAlign: "center",
  },
  modalDesc: {
    fontSize: 13,
    color: COR.textMuted,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  modalPrecoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 6,
  },
  modalPrecoLabel: { fontSize: 13, color: COR.textMuted },
  modalPreco: { fontSize: 14, fontWeight: "800", color: COR.gold },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 24, width: "100%" },
  modalBtnCancelar: {
    flex: 1,
    backgroundColor: COR.tag,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalBtnCancelarText: {
    color: COR.textMuted,
    fontWeight: "700",
    fontSize: 14,
  },
  modalBtnConfirmar: {
    flex: 1,
    backgroundColor: COR.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalBtnConfirmarDisabled: { backgroundColor: "#333", opacity: 0.5 },
  modalBtnConfirmarText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  toast: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#222240",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COR.accent,
    shadowColor: COR.accent,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  toastText: {
    color: COR.text,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});
