import AsyncStorage from "@react-native-async-storage/async-storage";
import { Meta } from "../models";

const KEY = "metas";

export async function getMetas(): Promise<Meta[]> {
  const data = await AsyncStorage.getItem(KEY);
  if (!data) return [];

  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveMetas(metas: Meta[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(metas));
}
