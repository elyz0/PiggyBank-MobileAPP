// components/AnimatedSplashScreen.tsx
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

const C = {
  bg: "#0B0F1A",
  bgGlow: "#1A1F35",
  pink: "#FF80AB",
  pinkDark: "#F06292",
  pinkLight: "#FFB3CC",
  gold: "#F59E0B",
  goldLight: "#FCD34D",
  text: "#F9FAFB",
  textSub: "#94A3B8",
  shadow: "#FF80AB44",
};

// ─── Partícula de estrela ─────────────────────────────────────────────────────
interface StarParticleProps {
  angle: number;
  distance: number;
  delay: number;
  size: number;
  triggered: boolean;
}

function StarParticle({
  angle,
  distance,
  delay,
  size,
  triggered,
}: StarParticleProps) {
  const rad = (angle * Math.PI) / 180;
  const tx = Math.cos(rad) * distance;
  const ty = Math.sin(rad) * distance;

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (!triggered) return;

    // Aparecer
    opacity.value = withDelay(delay, withTiming(1, { duration: 80 }));

    // Escala com spring para dar vida
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1, { damping: 5, stiffness: 400 }),
        withDelay(
          350,
          withTiming(0, { duration: 250, easing: Easing.in(Easing.quad) }),
        ),
      ),
    );

    // Rotação suave durante o voo
    rotate.value = withDelay(
      delay,
      withTiming(angle > 0 ? 360 : -360, {
        duration: 600,
        easing: Easing.linear,
      }),
    );

    // Trajetória: arremesso com leve gravidade
    x.value = withDelay(
      delay,
      withTiming(tx, { duration: 550, easing: Easing.out(Easing.cubic) }),
    );
    y.value = withDelay(
      delay,
      withSequence(
        withTiming(ty - 18, { duration: 280, easing: Easing.out(Easing.quad) }),
        withTiming(ty + 24, { duration: 270, easing: Easing.in(Easing.quad) }),
      ),
    );
  }, [triggered]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.particle, style]}>
      <Text style={{ fontSize: size }}>⭐</Text>
    </Animated.View>
  );
}

// ─── Anel de brilho (halo) ────────────────────────────────────────────────────
function GlowRing({ triggered }: { triggered: boolean }) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!triggered) return;
    opacity.value = withSequence(
      withTiming(0.6, { duration: 100 }),
      withTiming(0, { duration: 500 }),
    );
    scale.value = withTiming(2.2, {
      duration: 600,
      easing: Easing.out(Easing.quad),
    });
  }, [triggered]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.glowRing, style]} />;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AnimatedSplashScreen({
  onAnimationFinish,
}: {
  onAnimationFinish: () => void;
}) {
  const coinX = useSharedValue(-width * 0.48);
  const coinY = useSharedValue(-height * 0.28);
  const coinRotate = useSharedValue(-30);
  const coinOpacity = useSharedValue(1);
  const coinScale = useSharedValue(1);
  const coinScaleY = useSharedValue(1); // para efeito de squash

  const piggyScale = useSharedValue(1);
  const piggySquish = useSharedValue(1); // para efeito de squash
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const subOpacity = useSharedValue(0);

  const [starsTriggered, setStarsTriggered] = React.useState(false);

  // 12 estrelas ao redor do porquinho em ângulos variados
  const particles = [
    { angle: -90, distance: 85, delay: 0, size: 18 },
    { angle: -60, distance: 95, delay: 30, size: 14 },
    { angle: -30, distance: 80, delay: 15, size: 20 },
    { angle: 0, distance: 90, delay: 45, size: 14 },
    { angle: 30, distance: 85, delay: 20, size: 18 },
    { angle: 60, distance: 95, delay: 35, size: 16 },
    { angle: 90, distance: 80, delay: 10, size: 20 },
    { angle: 120, distance: 90, delay: 50, size: 14 },
    { angle: 150, distance: 85, delay: 25, size: 16 },
    { angle: 180, distance: 95, delay: 40, size: 18 },
    { angle: -120, distance: 80, delay: 5, size: 14 },
    { angle: -150, distance: 90, delay: 55, size: 16 },
  ];

  // Posição Y de destino da moeda (relativo ao centro da tela)
  // O porquinho tem marginTop:100 + body height 100 → slot fica ~30px abaixo do centro
  const COIN_LAND_Y = height * 0.07;
  const COIN_PEAK_Y = -height * 0.18;
  const RISE_MS = 550;
  const FALL_MS = 850;

  useEffect(() => {
    // Movimento horizontal linear
    coinX.value = withTiming(0, {
      duration: RISE_MS + FALL_MS,
      easing: Easing.linear,
    });

    // Rotação da moeda durante o voo (como uma moeda girando)
    coinRotate.value = withTiming(360 * 2, {
      duration: RISE_MS + FALL_MS,
      easing: Easing.linear,
    });

    // Parábola Y
    coinY.value = withSequence(
      withTiming(COIN_PEAK_Y, {
        duration: RISE_MS,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(
        COIN_LAND_Y,
        { duration: FALL_MS, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(triggerImpact)();
        },
      ),
    );
  }, []);

  function triggerImpact() {
    // Moeda comprime ao entrar no slot e some
    coinScale.value = withSequence(
      withTiming(0.8, { duration: 60 }), // impacto leve
      withTiming(1.0, { duration: 40 }), // normaliza X
    );

    coinScaleY.value = withSequence(
      withTiming(1.15, { duration: 60 }), // mesma pancada no Y
      withTiming(0, { duration: 130, easing: Easing.in(Easing.quad) }), // achata ↕ e some
    );
    coinOpacity.value = withDelay(
      80,
      withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) }),
    );

    // Porquinho: squash & stretch profissional
    piggyScale.value = withSequence(
      withSpring(1.28, { damping: 3, stiffness: 500 }),
      withSpring(0.92, { damping: 5, stiffness: 300 }),
      withSpring(1.08, { damping: 6, stiffness: 250 }),
      withSpring(1, { damping: 8, stiffness: 200 }),
    );

    // Partículas e halo
    setStarsTriggered(true);

    // Título aparece após o impacto
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    titleY.value = withDelay(
      300,
      withSpring(0, { damping: 14, stiffness: 180 }),
    );
    subOpacity.value = withDelay(550, withTiming(1, { duration: 400 }));

    // Fim da splash
    setTimeout(onAnimationFinish, 1200);
  }

  const coinStyle = useAnimatedStyle(() => ({
    opacity: coinOpacity.value,
    transform: [
      { translateX: coinX.value },
      { translateY: coinY.value },
      { rotate: `${coinRotate.value}deg` },
      { scaleX: coinScale.value },
      { scaleY: coinScaleY.value }, // ← novo
    ],
  }));

  const piggyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: piggyScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const subStyle = useAnimatedStyle(() => ({
    opacity: subOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Gradiente de fundo sutil */}
      <View style={styles.bgGlow} />

      {/* Moeda — absolutamente centrada na tela, animada por translate */}
      <Animated.View style={[styles.coin, coinStyle]}>
        <Text style={styles.coinEmoji}>🪙</Text>
      </Animated.View>

      {/* Porquinho + partículas */}
      <View style={styles.piggySection}>
        {/* Halo de impacto */}
        <GlowRing triggered={starsTriggered} />

        {/* Estrelas */}
        {particles.map((p, i) => (
          <StarParticle key={i} {...p} triggered={starsTriggered} />
        ))}

        {/* Porquinho */}
        <Animated.View style={[styles.piggyContainer, piggyStyle]}>
          {/* Sombra sob o porco */}
          <View style={styles.piggyShadow} />

          {/* Orelhas */}
          <View style={[styles.ear, styles.earLeft]} />
          <View style={[styles.ear, styles.earRight]} />

          {/* Corpo */}
          <View style={styles.piggyBody}>
            {/* Slot da moeda */}
            <View style={styles.slot} />

            {/* Olhos com brilho */}
            <View style={styles.eyesRow}>
              <View style={styles.eyeOuter}>
                <View style={styles.eyeInner} />
                <View style={styles.eyeGlint} />
              </View>
              <View style={styles.eyeOuter}>
                <View style={styles.eyeInner} />
                <View style={styles.eyeGlint} />
              </View>
            </View>

            {/* Focinho */}
            <View style={styles.snout}>
              <View style={styles.nostril} />
              <View style={styles.nostril} />
            </View>

            {/* Bochecha */}
            <View style={[styles.cheek, { left: 14 }]} />
            <View style={[styles.cheek, { right: 14 }]} />
          </View>

          {/* Pernas */}
          <View style={styles.legsRow}>
            <View style={styles.leg} />
            <View style={styles.leg} />
          </View>
        </Animated.View>
      </View>

      {/* Textos com entrada animada */}
      <Animated.View style={[styles.textContainer, titleStyle]}>
        <Text style={styles.appTitle}>Porquinho</Text>
        <Animated.Text style={[styles.appSub, subStyle]}>
          Se divirta poupando! 🎉
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },

  bgGlow: {
    position: "absolute",
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: C.bgGlow,
    top: height * 0.15,
    opacity: 0.6,
  },

  // ── Moeda ──
  coin: {
    position: "absolute",
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  coinEmoji: {
    fontSize: 38,
  },

  // ── Seção do porquinho ──
  piggySection: {
    marginTop: 80,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Halo de brilho ──
  glowRing: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: C.gold,
    zIndex: 1,
  },

  // ── Partículas ──
  particle: {
    position: "absolute",
    zIndex: 30,
  },

  // ── Sombra do porquinho ──
  piggyShadow: {
    position: "absolute",
    bottom: -8,
    width: 100,
    height: 16,
    backgroundColor: "#000",
    borderRadius: 50,
    opacity: 0.2,
    zIndex: 0,
  },

  // ── Porquinho ──
  piggyContainer: {
    alignItems: "center",
    width: 160,
    zIndex: 10,
  },
  piggyBody: {
    width: 130,
    height: 105,
    backgroundColor: C.pink,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    // Sombra interna simulada com borda
    borderWidth: 2,
    borderColor: C.pinkLight,
    borderBottomWidth: 4,
    borderBottomColor: C.pinkDark,
  },

  slot: {
    width: 36,
    height: 7,
    backgroundColor: "#00000033",
    borderRadius: 4,
    position: "absolute",
    top: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },

  eyesRow: {
    flexDirection: "row",
    gap: 28,
    marginBottom: 8,
  },
  eyeOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#1A0A0A",
    alignItems: "center",
    justifyContent: "center",
  },
  eyeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3D1A1A",
  },
  eyeGlint: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#fff",
    top: 1,
    right: 1,
  },

  snout: {
    width: 42,
    height: 28,
    backgroundColor: C.pinkDark,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#E05580",
  },
  nostril: {
    width: 5,
    height: 7,
    borderRadius: 3,
    backgroundColor: "#00000022",
  },

  cheek: {
    position: "absolute",
    bottom: 22,
    width: 20,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#FF4081",
    opacity: 0.35,
  },

  ear: {
    width: 34,
    height: 34,
    backgroundColor: C.pink,
    borderRadius: 10,
    position: "absolute",
    top: -6,
    transform: [{ rotate: "45deg" }],
    borderWidth: 2,
    borderColor: C.pinkLight,
    zIndex: 1,
  },
  earLeft: { left: 8 },
  earRight: { right: 8 },

  legsRow: {
    flexDirection: "row",
    gap: 46,
    marginTop: -12,
    zIndex: 1,
  },
  leg: {
    width: 22,
    height: 28,
    backgroundColor: C.pinkDark,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E05580",
  },

  // ── Textos ──
  textContainer: {
    marginTop: 52,
    alignItems: "center",
  },
  appTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -1.5,
    textShadowColor: C.shadow,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  appSub: {
    fontSize: 15,
    color: C.textSub,
    fontWeight: "600",
    marginTop: 6,
    letterSpacing: 0.3,
  },
});
