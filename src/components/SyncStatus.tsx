import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useOfflineSync } from "../hooks/useOfflineSync";

export const SyncStatus: React.FC = () => {
  const { isOnline, isSyncing, getOfflineCount, forceSync } = useOfflineSync();
  const [offlineCount, setOfflineCount] = useState({
    notas: 0,
    paletes: 0,
    total: 0,
  });

  useEffect(() => {
    const fetchOfflineCount = async () => {
      try {
        const count = await getOfflineCount();
        setOfflineCount(count);
      } catch (error) {
        console.error("Erro ao buscar contagem offline:", error);
      }
    };

    fetchOfflineCount();

    if (!isSyncing) {
      fetchOfflineCount();
    }
  }, [isSyncing, getOfflineCount]);

  const getStatusText = () => {
    if (!isOnline) return "Offline";
    if (isSyncing) return "Sincronizando...";
    if (offlineCount.total > 0)
      return `${offlineCount.total} item(s) pendente(s)`;
    return "Sincronizado";
  };

  const getStatusColor = () => {
    if (!isOnline) return "#ff6b6b";
    if (isSyncing) return "#4ecdc4";
    if (offlineCount.total > 0) return "#ffa726";
    return "#51cf66";
  };

  const handleSyncPress = () => {
    if (isOnline && !isSyncing && offlineCount.total > 0) {
      forceSync();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View
          style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
        />
        <Text style={styles.statusText}>{getStatusText()}</Text>

        {offlineCount.total > 0 && isOnline && !isSyncing && (
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleSyncPress}
            disabled={isSyncing}
          >
            <Text style={styles.syncButtonText}>Sincronizar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    marginTop: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#fff",
    flex: 1,
  },
  syncButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  syncButtonText: {
    color: "#2b7ed7",
    fontSize: 10,
    fontWeight: "500",
  },
});
