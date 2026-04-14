import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSaldo } from "./_layout";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_MOEDAS_FESTA = 15;

export default function HomeScreen() {
  const router = useRouter();

  const { metas, setMetas, metaAtivaId, pontos, setPontos, chapeuEquipado } =
    useSaldo();

  // 1. Lógica para isolar a meta ativa
  const metaAtiva = metas.find((m) => m.id === metaAtivaId);
  const nomeMetaAtiva = metaAtiva ? metaAtiva.nome : "Nenhuma Meta";
  const valorMetaAtiva = metaAtiva ? metaAtiva.valorTotal : 0;
  const guardadoMetaAtiva = metaAtiva ? metaAtiva.valorGuardado : 0;

  // 2. Cálculo de quanto falta
  const quantoFalta = Math.max(valorMetaAtiva - guardadoMetaAtiva, 0);

  const [objetivoAlcancado, setObjetivoAlcancado] = useState(false);
  const [animacaoFestaRodando, setAnimacaoFestaRodando] = useState(false);

  // Referências de animação
  const moedaY = useRef(new Animated.Value(-100)).current;
  const porquinhoScale = useRef(new Animated.Value(1)).current;
  const estrelasOpacity = useRef(new Animated.Value(0)).current;
  const marteloY = useRef(new Animated.Value(-150)).current;
  const marteloRotate = useRef(new Animated.Value(0)).current;
  const porquinhoShake = useRef(new Animated.Value(0)).current;
  const porquinhoOpacity = useRef(new Animated.Value(1)).current;

  const moedasFestaAnim = useRef(
    [...Array(NUM_MOEDAS_FESTA)].map(() => ({
      xy: new Animated.ValueXY({ x: 0, y: 0 }),
      opacity: new Animated.Value(0),
    })),
  ).current;

  // Monitorar alcance da meta ativa
  useEffect(() => {
    if (
      valorMetaAtiva > 0 &&
      guardadoMetaAtiva >= valorMetaAtiva &&
      !objetivoAlcancado &&
      !animacaoFestaRodando
    ) {
      iniciarAnimacaoQuebra();
    }
  }, [guardadoMetaAtiva, valorMetaAtiva]);

  const iniciarAnimacaoQuebra = () => {
    setAnimacaoFestaRodando(true);
    marteloY.setValue(-150);
    marteloRotate.setValue(0);
    porquinhoShake.setValue(0);
    porquinhoOpacity.setValue(1);
    moedasFestaAnim.forEach((m) => {
      m.xy.setValue({ x: 0, y: 0 });
      m.opacity.setValue(0);
    });

    Animated.sequence([
      Animated.parallel([
        Animated.timing(marteloY, {
          toValue: 20,
          duration: 400,
          easing: Easing.back(1),
          useNativeDriver: true,
        }),
        Animated.timing(marteloRotate, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(porquinhoShake, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(porquinhoShake, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(porquinhoShake, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(porquinhoOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(marteloY, {
          toValue: -150,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel(
        moedasFestaAnim.map((moeda) => {
          const randomX = (Math.random() - 0.5) * (SCREEN_WIDTH * 0.8);
          const randomY = 150 + Math.random() * 50;
          return Animated.sequence([
            Animated.timing(moeda.opacity, {
              toValue: 1,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(moeda.xy, {
              toValue: { x: randomX, y: randomY },
              duration: 800 + Math.random() * 400,
              easing: Easing.out(Easing.back(1.5)),
              useNativeDriver: true,
            }),
          ]);
        }),
      ),
    ]).start(() => {
      setObjetivoAlcancado(true);
      setAnimacaoFestaRodando(false);
      setPontos((prev) => prev + 50);
    });
  };

  const marteloRotationInterpolate = marteloRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-45deg"],
  });

  const realizarDeposito = (valor: number) => {
    if (!metaAtivaId) {
      Alert.alert(
        "Atenção",
        "Selecione ou crie uma meta prioritária primeiro!",
      );
      return;
    }
    if (objetivoAlcancado || animacaoFestaRodando) return;

    moedaY.setValue(-100);
    porquinhoScale.setValue(1);
    estrelasOpacity.setValue(0);

    Animated.sequence([
      Animated.timing(moedaY, {
        toValue: 0,
        duration: 600,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(porquinhoScale, {
            toValue: 1.15,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(porquinhoScale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(estrelasOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(estrelasOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 3. Atualiza apenas o saldo da meta ativa
      const metasAtualizadas = metas.map((m) => {
        if (m.id === metaAtivaId) {
          return { ...m, valorGuardado: m.valorGuardado + valor };
        }
        return m;
      });
      setMetas(metasAtualizadas);
    });
  };

  const recomecarPoupança = () => {
    setObjetivoAlcancado(false);
    setAnimacaoFestaRodando(false);
    porquinhoOpacity.setValue(1);
    marteloY.setValue(-150);
    moedasFestaAnim.forEach((m) => {
      m.opacity.setValue(0);
      m.xy.setValue({ x: 0, y: 0 });
    });
    router.push("/objetivo");
  };

  return (
    <View style={styles.containerPrincipal}>
      <View style={styles.areaControles}>
        <Text style={styles.titulo}>Economia para {nomeMetaAtiva}</Text>
        <Text style={styles.saldo}>R$ {guardadoMetaAtiva.toFixed(2)}</Text>

        {metaAtiva && quantoFalta > 0 ? (
          <Text style={styles.subtituloMeta}>
            Faltam{" "}
            <Text style={{ fontWeight: "900" }}>
              R$ {quantoFalta.toFixed(2)}
            </Text>{" "}
            para atingir o objetivo
          </Text>
        ) : metaAtiva && quantoFalta === 0 ? (
          <Text style={styles.subtituloMeta}>Objetivo alcançado! 🎊</Text>
        ) : (
          <Text style={styles.subtituloMeta}>Crie uma meta no menu 🎯</Text>
        )}

        <View style={styles.badgePontos}>
          <Text style={styles.textoPontos}>✨ {pontos} Pontos</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.conteudoScroll}>
        <View style={styles.conteudoInterno}>
          <View style={styles.areaPorquinho}>
            <Animated.View
              style={[
                styles.martelo,
                {
                  transform: [
                    { translateY: marteloY },
                    { rotate: marteloRotationInterpolate },
                  ],
                },
              ]}
            />

            {moedasFestaAnim.map((moeda, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.moedaFesta,
                  {
                    opacity: moeda.opacity,
                    transform: moeda.xy.getTranslateTransform(),
                  },
                ]}
              />
            ))}

            <Animated.View
              style={[
                styles.areaAnimacao,
                {
                  opacity: porquinhoOpacity,
                  transform: [{ translateX: porquinhoShake }],
                },
              ]}
            >
              <Animated.View
                style={[styles.moeda, { transform: [{ translateY: moedaY }] }]}
              />
              <Animated.View
                style={[styles.containerEstrelas, { opacity: estrelasOpacity }]}
              >
                <View style={[styles.estrela, { top: -10, left: 20 }]} />
                <View style={[styles.estrela, { top: -25, left: 55 }]} />
                <View style={[styles.estrela, { top: -10, right: 20 }]} />
              </Animated.View>

              <Animated.View
                style={[
                  styles.porquinho,
                  { transform: [{ scale: porquinhoScale }] },
                ]}
              >
                {chapeuEquipado === "chapeu_topo" && (
                  <View style={styles.posicaoCartola}>
                    <View style={styles.cartolaTopo} />
                    <View style={styles.cartolaBase} />
                    <View style={styles.cartolaFaixa} />
                  </View>
                )}
                {chapeuEquipado === "chapeu_bone" && (
                  <View style={styles.posicaoBone}>
                    <View style={styles.boneCorpo} />
                    <View style={styles.boneAba} />
                    <View style={styles.boneBotao} />
                  </View>
                )}
                <View style={styles.orelhaLado} />
                <View style={styles.corpoLado} />
                <View style={styles.focinhoLado} />
                <View style={styles.olhoLado} />
                <View style={styles.pata} />
                <View style={styles.pataTras} />
                <View style={styles.rabo} />
              </Animated.View>
            </Animated.View>

            {objetivoAlcancado && !animacaoFestaRodando && (
              <View style={styles.containerFestaTextos}>
                <Text style={styles.textoParabens}>🎉 META ALCANÇADA! 🎉</Text>
                <TouchableOpacity
                  style={styles.botaoRecomecar}
                  onPress={recomecarPoupança}
                >
                  <Text style={styles.botaoTextRecomecar}>Nova Meta</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {!objetivoAlcancado && !animacaoFestaRodando && (
            <View style={styles.gridBotoes}>
              <TouchableOpacity
                style={styles.botaoPeq}
                onPress={() => realizarDeposito(1)}
              >
                <Text style={styles.botaoText}>+ R$ 1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botaoPeq}
                onPress={() => realizarDeposito(5)}
              >
                <Text style={styles.botaoText}>+ R$ 5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botaoPeq}
                onPress={() => realizarDeposito(10)}
              >
                <Text style={styles.botaoText}>+ R$ 10</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.gridNavegacao}>
            <TouchableOpacity
              style={styles.botaoNavegar}
              onPress={() => router.push("/loja")}
            >
              <Text style={styles.emojiNav}>🛍️</Text>
              <Text style={styles.txtNav}>Loja</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.botaoNavegar}
              onPress={() => router.push("/objetivo")}
            >
              <Text style={styles.emojiNav}>🎯</Text>
              <Text style={styles.txtNav}>Metas</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Mantenha seus estilos anteriores...
  containerPrincipal: { flex: 1, backgroundColor: "#fff" },
  areaControles: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 280,
    backgroundColor: "#6c5ce7",
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    elevation: 8,
    paddingTop: 40,
  },
  titulo: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  saldo: { fontSize: 54, fontWeight: "900", color: "#fff" },
  subtituloMeta: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    marginTop: 5,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  badgePontos: {
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 10,
  },
  textoPontos: { color: "#f1c40f", fontWeight: "bold" },
  conteudoScroll: { paddingBottom: 40 },
  conteudoInterno: { paddingHorizontal: 20 },
  areaPorquinho: {
    height: 350,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    position: "relative",
  },
  areaAnimacao: {
    width: 120,
    height: 120,
    justifyContent: "flex-end",
    alignItems: "center",
    position: "absolute",
    bottom: 150,
  },
  porquinho: { width: 120, height: 100, alignItems: "center" },
  corpoLado: {
    width: 110,
    height: 75,
    backgroundColor: "#ff9ff3",
    borderRadius: 50,
    zIndex: 2,
  },
  focinhoLado: {
    width: 12,
    height: 22,
    backgroundColor: "#f368e0",
    borderRadius: 5,
    position: "absolute",
    left: -4,
    top: 30,
    zIndex: 3,
  },
  olhoLado: {
    width: 6,
    height: 6,
    backgroundColor: "#333",
    borderRadius: 3,
    position: "absolute",
    left: 18,
    top: 30,
    zIndex: 4,
  },
  orelhaLado: {
    width: 20,
    height: 25,
    backgroundColor: "#f368e0",
    borderRadius: 10,
    position: "absolute",
    left: 35,
    top: -10,
    transform: [{ rotate: "-10deg" }],
    zIndex: 1,
  },
  pata: {
    width: 12,
    height: 20,
    backgroundColor: "#f368e0",
    position: "absolute",
    left: 30,
    bottom: 12,
    borderRadius: 5,
  },
  pataTras: {
    width: 12,
    height: 20,
    backgroundColor: "#f368e0",
    position: "absolute",
    right: 30,
    bottom: 12,
    borderRadius: 5,
  },
  rabo: {
    width: 15,
    height: 15,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderColor: "#f368e0",
    position: "absolute",
    right: -4,
    top: 35,
    borderTopRightRadius: 10,
    transform: [{ rotate: "45deg" }],
  },
  posicaoCartola: {
    position: "absolute",
    top: -40,
    left: 25,
    zIndex: 10,
    alignItems: "center",
  },
  cartolaTopo: {
    width: 40,
    height: 35,
    backgroundColor: "#2d3436",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  cartolaBase: {
    width: 60,
    height: 8,
    backgroundColor: "#2d3436",
    borderRadius: 4,
    marginTop: -2,
  },
  cartolaFaixa: {
    width: 40,
    height: 8,
    backgroundColor: "#e84393",
    position: "absolute",
    top: 20,
  },
  posicaoBone: {
    position: "absolute",
    top: -30,
    left: 30,
    zIndex: 10,
    alignItems: "center",
    transform: [{ rotate: "-5deg" }],
  },
  boneCorpo: {
    width: 50,
    height: 30,
    backgroundColor: "#0984e3",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  boneAba: {
    width: 40,
    height: 8,
    backgroundColor: "#0984e3",
    borderRadius: 4,
    position: "absolute",
    bottom: -2,
    right: -25,
    transform: [{ rotate: "15deg" }],
  },
  boneBotao: {
    width: 8,
    height: 8,
    backgroundColor: "#fff",
    borderRadius: 4,
    position: "absolute",
    top: -2,
  },
  moeda: {
    width: 25,
    height: 25,
    backgroundColor: "#f1c40f",
    borderRadius: 12.5,
    borderWidth: 2,
    borderColor: "#d4ac0d",
    position: "absolute",
    zIndex: 5,
    top: -20,
  },
  containerEstrelas: {
    position: "absolute",
    width: 120,
    height: 100,
    top: -20,
    zIndex: 6,
  },
  estrela: {
    width: 8,
    height: 8,
    backgroundColor: "#f1c40f",
    borderRadius: 4,
    position: "absolute",
  },
  gridBotoes: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    justifyContent: "center",
  },
  botaoPeq: {
    backgroundColor: "#6c5ce7",
    paddingVertical: 15,
    flex: 1,
    borderRadius: 20,
    alignItems: "center",
    elevation: 4,
  },
  botaoText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  gridNavegacao: {
    width: "100%",
    flexDirection: "row",
    gap: 15,
    marginTop: 30,
  },
  botaoNavegar: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 2,
  },
  emojiNav: { fontSize: 24 },
  txtNav: { fontWeight: "bold", color: "#333", marginTop: 5 },
  martelo: {
    width: 60,
    height: 40,
    backgroundColor: "#e63900",
    borderRadius: 5,
    borderWidth: 3,
    borderColor: "#fff",
    position: "absolute",
    top: 100,
    zIndex: 10,
  },
  moedaFesta: {
    width: 20,
    height: 20,
    backgroundColor: "#f1c40f",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d4ac0d",
    position: "absolute",
    bottom: 180,
    zIndex: 5,
  },
  containerFestaTextos: {
    alignItems: "center",
    width: "100%",
    position: "absolute",
    bottom: 30,
    zIndex: 11,
  },
  textoParabens: { fontSize: 24, fontWeight: "900", color: "#6c5ce7" },
  botaoRecomecar: {
    backgroundColor: "#fff",
    borderColor: "#6c5ce7",
    borderWidth: 2,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  botaoTextRecomecar: { color: "#6c5ce7", fontWeight: "bold" },
});
