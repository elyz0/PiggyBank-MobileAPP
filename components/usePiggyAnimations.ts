import { useRef } from "react";
import { Animated, Dimensions, Easing } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
export const NUM_MOEDAS_FESTA = 15;

export function usePiggyAnimations() {
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
    }))
  ).current;

  const resetFestaAnims = () => {
    porquinhoOpacity.setValue(1);
    marteloY.setValue(-150);
    moedasFestaAnim.forEach((m) => {
      m.opacity.setValue(0);
      m.xy.setValue({ x: 0, y: 0 });
    });
  };

  const animarDeposito = (onComplete: () => void) => {
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
    ]).start(onComplete);
  };

  const animarQuebra = (onComplete: () => void) => {
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
        })
      ),
    ]).start(onComplete);
  };

  return {
    // Animated values
    moedaY,
    porquinhoScale,
    estrelasOpacity,
    marteloY,
    marteloRotate,
    porquinhoShake,
    porquinhoOpacity,
    moedasFestaAnim,
    // Actions
    animarDeposito,
    animarQuebra,
    resetFestaAnims,
  };
}
