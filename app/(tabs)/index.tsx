// app/(tabs)/index.tsx
import { useSaldo } from "@/app/_layout";
import { Piggy } from "@/components/Piggy";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getTodayString(): string {
  return new Date().toDateString();
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ emoji, label, value, accent, isDark }: any) {
  return (
    <View
      style={[styles.statCard, isDark ? styles.bgDarkCard : styles.bgLight]}
    >
      <View style={[styles.statIconWrap, { backgroundColor: accent + "22" }]}>
        <Text style={styles.statEmoji}>{emoji}</Text>
      </View>
      <Text
        style={[styles.statValue, isDark ? styles.textWhite : styles.textBlack]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.statLabel,
          isDark ? styles.textMutedDark : styles.textMutedLight,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Meta Progress Card ───────────────────────────────────────────────────────

function MetaProgressCard({
  nome,
  emoji,
  guardado,
  total,
  onPress,
  isDark,
}: any) {
  const progresso = total > 0 ? Math.min(guardado / total, 1) : 0;
  const pct = Math.round(progresso * 100);
  const falta = Math.max(total - guardado, 0);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.metaCard,
        isDark ? styles.bgDarkCard : styles.bgLight,
        pressed && styles.metaCardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.metaCardHeader}>
        <View
          style={[
            styles.metaEmojiWrap,
            isDark && { backgroundColor: "#1E293B" },
          ]}
        >
          <Text style={styles.metaEmoji}>{emoji ?? "🎯"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.metaNome,
              isDark ? styles.textWhite : styles.textBlack,
            ]}
            numberOfLines={1}
          >
            {nome}
          </Text>
          <Text
            style={[
              styles.metaFalta,
              isDark ? styles.textMutedDark : styles.textMutedLight,
            ]}
          >
            Faltam {formatCurrency(falta)}
          </Text>
        </View>
        <View
          style={[styles.pctBadge, isDark && { backgroundColor: "#1E293B" }]}
        >
          <Text style={styles.pctText}>{pct}%</Text>
        </View>
      </View>

      <View
        style={[styles.progressBg, isDark && { backgroundColor: "#334155" }]}
      >
        <View
          style={[
            styles.progressFill,
            { width: `${pct}%` },
            pct >= 100 && styles.progressComplete,
          ]}
        />
      </View>

      <View style={styles.metaValoresRow}>
        <Text style={styles.metaValorLabel}>Guardado</Text>
        <Text style={styles.metaValorLabel}>Meta</Text>
      </View>
      <View style={styles.metaValoresRow}>
        <Text
          style={[
            styles.metaValorNum,
            isDark ? styles.textWhite : styles.textBlack,
          ]}
        >
          {formatCurrency(guardado)}
        </Text>
        <Text style={[styles.metaValorNum, { color: "#94A3B8" }]}>
          {formatCurrency(total)}
        </Text>
      </View>
    </Pressable>
  );
}

function MetaCarouselCard({
  nome,
  guardado,
  total,
  onPress,
  isDark,
  piggyScale,
  chapeuEquipado,
}: any) {
  const progresso = total > 0 ? Math.min(guardado / total, 1) : 0;
  const pct = Math.round(progresso * 100);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.carouselCard,
        isDark ? styles.bgDarkCard : styles.bgLight,
        pressed && styles.metaCardPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.carouselPiggyWrap, isDark && styles.carouselPiggyWrapDark]}>
        <Piggy scaleAnim={piggyScale} chapeuEquipado={chapeuEquipado ?? null} />
      </View>
      <Text
        style={[styles.carouselNome, isDark ? styles.textWhite : styles.textBlack]}
        numberOfLines={1}
      >
        {nome}
      </Text>
      <Text
        style={[
          styles.carouselSub,
          isDark ? styles.textMutedDark : styles.textMutedLight,
        ]}
      >
        {pct}% concluído
      </Text>
      <View style={[styles.progressBg, isDark && { backgroundColor: "#334155" }]}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text
        style={[
          styles.carouselValor,
          isDark ? styles.textWhite : styles.textBlack,
        ]}
      >
        {formatCurrency(guardado)} / {formatCurrency(total)}
      </Text>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();

  // Animated.Value estático para o Piggy (sem animação ativa aqui)
  const piggyScale = useRef(new Animated.Value(1)).current;

  const {
    pontos,
    ofensiva,
    metas,
    metaAtivaId,
    ultimoDeposito,
    setOfensiva,
    chapeuEquipado,
    isDark,
    alternarTema,
  } = useSaldo();

  useEffect(() => {
    if (!ultimoDeposito) return;
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    if (
      ultimoDeposito !== getTodayString() &&
      ultimoDeposito !== ontem.toDateString()
    ) {
      setOfensiva(0);
    }
  }, [ultimoDeposito, setOfensiva]);

  const { totalGuardado, totalMeta, metasCompletas } = useMemo(() => {
    const m = metas || [];
    const tg = m.reduce((acc, curr) => acc + (curr.valorAtual ?? 0), 0);
    const tm = m.reduce((acc, curr) => acc + (curr.valorMeta ?? 0), 0);
    const mc = m.filter(
      (curr) => curr.valorAtual >= curr.valorMeta && curr.valorMeta > 0,
    ).length;
    return { totalGuardado: tg, totalMeta: tm, metasCompletas: mc };
  }, [metas]);

  const metaAtiva = (metas || []).find((m) => m.id === metaAtivaId) ?? null;

  return (
    <View
      style={[
        styles.container,
        isDark ? styles.bgDarkScreen : styles.bgLightScreen,
      ]}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBanner}>
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroGreeting}>{getGreeting()}</Text>
            </View>
            <View style={styles.heroRightColumn}>
              <View style={styles.streakBadge}>
                <Text style={styles.streakFire}>🔥</Text>
                <Text style={styles.streakNum}>{ofensiva}</Text>
                <Text style={styles.streakLabel}>dias</Text>
              </View>
              <Pressable style={styles.themeBtn} onPress={alternarTema}>
                <Text style={styles.themeBtnText}>{isDark ? "☀️ Claro" : "🌙 Escuro"}</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.balanceBlock}>
            <Text style={styles.balanceLabel}>TOTAL GUARDADO</Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(totalGuardado)}
            </Text>
            <View style={styles.balancePill}>
              <Text style={styles.balancePillText}>
                de {formatCurrency(totalMeta)} em metas
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            emoji="⭐"
            label="Pontos"
            value={pontos.toLocaleString("pt-BR")}
            accent="#F59E0B"
            isDark={isDark}
          />
          <StatCard
            emoji="🎯"
            label="Metas ativas"
            value={String((metas || []).length)}
            accent="#3B82F6"
            isDark={isDark}
          />
          <StatCard
            emoji="✅"
            label="Concluídas"
            value={String(metasCompletas)}
            accent="#10B981"
            isDark={isDark}
          />
        </View>

        {(metas || []).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  isDark ? styles.textWhite : styles.textBlack,
                ]}
              >
                Meta em foco
              </Text>
              <Pressable onPress={() => router.push("/objetivo")}>
                <Text style={styles.sectionLink}>Ver todas →</Text>
              </Pressable>
            </View>
            <FlatList
              data={metas || []}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToAlignment="start"
              contentContainerStyle={styles.carouselList}
              renderItem={({ item }) => (
                <MetaCarouselCard
                  nome={item.nome}
                  guardado={item.valorAtual}
                  total={item.valorMeta}
                  isDark={isDark}
                  onPress={() => router.push("/objetivo")}
                  piggyScale={piggyScale}
                  chapeuEquipado={chapeuEquipado}
                />
              )}
            />
          </View>
        )}

        {(metas || []).length === 0 && (
          <View
            style={[
              styles.emptyState,
              isDark ? styles.bgDarkCard : styles.bgLight,
            ]}
          >
            {/* ↓ Substituído: era <Text style={styles.emptyEmoji}>🐷</Text> */}
            <View style={styles.emptyPiggyWrap}>
              <Piggy scaleAnim={piggyScale} chapeuEquipado={null} />
            </View>

            <Text
              style={[
                styles.emptyTitle,
                isDark ? styles.textWhite : styles.textBlack,
              ]}
            >
              Nenhuma meta ainda
            </Text>
            <Text
              style={[
                styles.emptyDesc,
                isDark ? styles.textMutedDark : styles.textMutedLight,
              ]}
            >
              Crie sua primeira meta e comece a guardar dinheiro hoje!
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.primaryBtnPressed,
              ]}
              onPress={() => router.push("/objetivo")}
            >
              <Text style={styles.primaryBtnText}>+ Criar primeira meta</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              isDark ? styles.textWhite : styles.textBlack,
            ]}
          ></Text>
          <View style={styles.quickRow}>
            <Pressable
              style={({ pressed }) => [
                styles.quickBtn,
                isDark ? styles.bgDarkCard : styles.bgLight,
                pressed && styles.quickBtnPressed,
              ]}
              onPress={() => router.push("/objetivo")}
            >
              <Text style={styles.quickBtnEmoji}>🎯</Text>
              <Text
                style={[
                  styles.quickBtnLabel,
                  isDark ? styles.textWhite : styles.textBlack,
                ]}
              >
                Metas
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.quickBtn,
                isDark ? styles.bgDarkCard : styles.bgLight,
                pressed && styles.quickBtnPressed,
              ]}
              onPress={() => router.push("/loja")}
            >
              <Text style={styles.quickBtnEmoji}>🛍️</Text>
              <Text
                style={[
                  styles.quickBtnLabel,
                  isDark ? styles.textWhite : styles.textBlack,
                ]}
              >
                Loja
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BRAND = "#1E3A5F";
const BRAND_MID = "#2563EB";
const BRAND_LIGHT = "#3B82F6";

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 48 },

  bgLightScreen: { backgroundColor: "#F1F5FB" },
  bgDarkScreen: { backgroundColor: "#0F172A" },
  bgLight: { backgroundColor: "#FFFFFF" },
  bgDarkCard: { backgroundColor: "#1E293B" },
  textBlack: { color: "#111827" },
  textWhite: { color: "#FFFFFF" },
  textMutedLight: { color: "#94A3B8" },
  textMutedDark: { color: "#64748B" },

  heroBanner: {
    backgroundColor: BRAND,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    overflow: "hidden",
    position: "relative",
  },
  heroCircle1: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: BRAND_MID,
    opacity: 0.25,
    top: -60,
    right: -60,
  },
  heroCircle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: BRAND_LIGHT,
    opacity: 0.15,
    bottom: -40,
    left: 20,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  heroRightColumn: { alignItems: "flex-end", gap: 8 },
  heroGreeting: { fontSize: 30, fontWeight: "700", color: "#fff" },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 3 },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 24,
    gap: 4,
  },
  streakFire: { fontSize: 16 },
  streakNum: { fontSize: 16, fontWeight: "800", color: "#FCD34D" },
  streakLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  themeBtn: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-end",
  },
  themeBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  balanceBlock: { alignItems: "flex-start" },
  balanceLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 38,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  balancePill: {
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  balancePillText: { fontSize: 12, color: "rgba(255,255,255,0.65)" },

  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginTop: -18,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  statLabel: { fontSize: 10, marginTop: 2, textAlign: "center" },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", letterSpacing: -0.2 },
  sectionLink: { fontSize: 13, color: BRAND_LIGHT, fontWeight: "600" },
  carouselList: { paddingRight: 20, gap: 12 },
  carouselCard: {
    width: 220,
    borderRadius: 20,
    padding: 14,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  carouselPiggyWrap: {
    height: 108,
    borderRadius: 16,
    backgroundColor: "#F5EDFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  carouselPiggyWrapDark: { backgroundColor: "#312E4B" },
  carouselNome: { fontSize: 15, fontWeight: "800" },
  carouselSub: { fontSize: 12, marginTop: 3, marginBottom: 8 },
  carouselValor: { fontSize: 12, fontWeight: "700", marginTop: 8 },

  metaCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  metaCardPressed: { opacity: 0.93, transform: [{ scale: 0.985 }] },
  metaCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  metaEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  metaEmoji: { fontSize: 26 },
  metaNome: { fontSize: 16, fontWeight: "700" },
  metaFalta: { fontSize: 12, marginTop: 2 },
  pctBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  pctText: { fontSize: 14, fontWeight: "800", color: BRAND_LIGHT },
  progressBg: {
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 99,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: BRAND_LIGHT,
    borderRadius: 99,
  },
  progressComplete: { backgroundColor: "#10B981" },
  metaValoresRow: { flexDirection: "row", justifyContent: "space-between" },
  metaValorLabel: {
    fontSize: 10,
    color: "#CBD5E1",
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  metaValorNum: { fontSize: 14, fontWeight: "700" },

  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  // ↓ Substituiu emptyIconWrap — dimensionado para o Piggy (120×100)
  emptyPiggyWrap: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },

  primaryBtn: {
    backgroundColor: BRAND_MID,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 16,
    elevation: 3,
    shadowColor: BRAND_MID,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  primaryBtnPressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  quickRow: { flexDirection: "row", gap: 12 },
  quickBtn: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  quickBtnPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  quickBtnEmoji: { fontSize: 28 },
  quickBtnLabel: { fontSize: 13, fontWeight: "700" },
});
