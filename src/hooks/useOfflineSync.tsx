import { useCallback, useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { createNota, createPalete } from "../services/api";

type NotaType = {
  numeroRota: number;
  numeroNota: number;
  tipologia: "resfriado" | "congelado" | "seco";
  conferidoPor: string;
  avaria: "sim" | "nao";
  avarias?: Array<{
    tipoErro: string;
    codProduto?: string;
    descProduto?: string;
    quantidade?: string;
    unidadeMedida?: string;
  }>;
};

type PaleteType = {
  numeroRota: number;
  numeroPallet: string;
  tipologia: "resfriado" | "congelado" | "seco";
  remontado: "sim" | "nao";
  conferido: "sim" | "nao";
};

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  const syncOfflineData = useCallback(async () => {
    if (isSyncingRef.current) return;

    isSyncingRef.current = true;
    setIsSyncing(true);

    try {
      const offlineNotas = await AsyncStorage.getItem("offline_notas");
      if (offlineNotas) {
        const notas = JSON.parse(offlineNotas) as NotaType[];

        for (const nota of notas) {
          try {
            await createNota(nota);
          } catch (error) {
            console.error(`❌ Erro ao sincronizar nota:`, error);
          }
        }

        await AsyncStorage.removeItem("offline_notas");
      }

      const offlinePaletes = await AsyncStorage.getItem("offline_paletes");
      if (offlinePaletes) {
        const paletes = JSON.parse(offlinePaletes) as PaleteType[];

        for (const palete of paletes) {
          try {
            await createPalete(palete);
          } catch (error) {
            console.error(`❌ Erro ao sincronizar palete:`, error);
          }
        }

        await AsyncStorage.removeItem("offline_paletes");
      }
    } catch (error) {
      console.error("❌ Erro na sincronização:", error);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsOnline(connected);

      if (connected && !isSyncingRef.current) {
        syncOfflineData();
      }
    });

    return unsubscribe;
  }, [syncOfflineData]);

  const saveNotaOffline = useCallback(async (nota: NotaType) => {
    try {
      const offlineNotas = await AsyncStorage.getItem("offline_notas");
      const notas = offlineNotas ? JSON.parse(offlineNotas) : [];
      notas.push(nota);
      await AsyncStorage.setItem("offline_notas", JSON.stringify(notas));
    } catch (error) {
      console.error("❌ Erro ao salvar nota offline:", error);
    }
  }, []);

  const savePaleteOffline = useCallback(async (palete: PaleteType) => {
    try {
      const offlinePaletes = await AsyncStorage.getItem("offline_paletes");
      const paletes = offlinePaletes ? JSON.parse(offlinePaletes) : [];
      paletes.push(palete);
      await AsyncStorage.setItem("offline_paletes", JSON.stringify(paletes));
    } catch (error) {
      console.error("❌ Erro ao salvar palete offline:", error);
    }
  }, []);

  const forceSync = useCallback(() => {
    if (isOnline && !isSyncingRef.current) {
      syncOfflineData();
    }
  }, [isOnline, syncOfflineData]);

  const getOfflineCount = useCallback(async () => {
    try {
      const offlineNotas = await AsyncStorage.getItem("offline_notas");
      const offlinePaletes = await AsyncStorage.getItem("offline_paletes");

      const notasCount = offlineNotas ? JSON.parse(offlineNotas).length : 0;
      const paletesCount = offlinePaletes
        ? JSON.parse(offlinePaletes).length
        : 0;

      return {
        notas: notasCount,
        paletes: paletesCount,
        total: notasCount + paletesCount,
      };
    } catch (error) {
      console.error("❌ Erro ao obter contagem offline:", error);
      return { notas: 0, paletes: 0, total: 0 };
    }
  }, []);

  const getOfflineNotas = useCallback(async () => {
    try {
      const offlineNotas = await AsyncStorage.getItem("offline_notas");
      return offlineNotas ? JSON.parse(offlineNotas) : [];
    } catch (error) {
      console.error("❌ Erro ao obter notas offline:", error);
      return [];
    }
  }, []);

  const getOfflinePaletes = useCallback(async () => {
    try {
      const offlinePaletes = await AsyncStorage.getItem("offline_paletes");
      return offlinePaletes ? JSON.parse(offlinePaletes) : [];
    } catch (error) {
      console.error("❌ Erro ao obter paletes offline:", error);
      return [];
    }
  }, []);

  return {
    isOnline,
    isSyncing,
    saveNotaOffline,
    savePaleteOffline,
    forceSync,
    getOfflineCount,
    getOfflineNotas,
    getOfflinePaletes,
  };
};
