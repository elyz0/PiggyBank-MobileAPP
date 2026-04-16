import AsyncStorage from "@react-native-async-storage/async-storage";
import { Aporte } from "../models";

const KEY = "aportes";

export async function getAportes(): Promise<Aporte[]> {
  const data = await AsyncStorage.getItem(KEY);
  if (!data) return [];

  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveAportes(aportes: Aporte[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(aportes));
}
