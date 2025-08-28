// src/screens/ResumoDoDia.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, RouteProp, useIsFocused } from "@react-navigation/native";
import { RootStackParamList } from "../../routes/types";
import { listNotas, listPaletes } from "../../services/api";
import { useOfflineSync } from "../../hooks/useOfflineSync";

type RouteProps = RouteProp<RootStackParamList, "ResumoDoDia">;

const withHairSpaces = (s: string) =>
  Platform.OS === "android" ? s + "\u200A\u200A" : s;

function Badge({
  label,
  bg,
  color,
}: {
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text
        style={[styles.badgeText, { color }]}
        numberOfLines={1}
        allowFontScaling={false}
        textBreakStrategy="simple"
      >
        {withHairSpaces(label)}
      </Text>
    </View>
  );
}

function brToISO(br?: string) {
  if (!br) return undefined;
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return undefined;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

export default function ResumoDoDia() {
  const route = useRoute<RouteProps>();
  const isFocused = useIsFocused();
  const { data, diaISO } = (route.params || {}) as any;
  const { getOfflineCount, getOfflineNotas, getOfflinePaletes } =
    useOfflineSync();

  const diaFetch = diaISO || brToISO(data);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [fullNotas, setFullNotas] = useState<any[]>([]);
  const [fullPaletes, setFullPaletes] = useState<any[]>([]);
  const [notas, setNotas] = useState<any[]>([]);
  const [paletes, setPaletes] = useState<any[]>([]);
  const [selectedRota, setSelectedRota] = useState<number | null>(null);
  const [offlineCount, setOfflineCount] = useState({
    notas: 0,
    paletes: 0,
    total: 0,
  });
  const [offlineNotas, setOfflineNotas] = useState<any[]>([]);
  const [offlinePaletes, setOfflinePaletes] = useState<any[]>([]);

  const fetchOfflineData = useCallback(async () => {
    try {
      const [count, notas, paletes] = await Promise.all([
        getOfflineCount(),
        getOfflineNotas(),
        getOfflinePaletes(),
      ]);
      setOfflineCount(count);
      setOfflineNotas(notas);
      setOfflinePaletes(paletes);
    } catch (error) {
      console.error("Erro ao buscar dados offline:", error);
    }
  }, [getOfflineCount, getOfflineNotas, getOfflinePaletes]);

  const fetchAllOfDay = useCallback(async () => {
    setErrorMsg("");
    if (!diaFetch) {
      setFullNotas([]);
      setFullPaletes([]);
      setNotas([]);
      setPaletes([]);
      setErrorMsg("Data inválida para busca");
      return;
    }
    setLoading(true);
    try {
      const [ns, ps] = await Promise.all([
        listNotas(diaFetch),
        listPaletes(diaFetch),
      ]);
      const arrN = Array.isArray(ns) ? ns : [];
      const arrP = Array.isArray(ps) ? ps : [];
      setFullNotas(arrN);
      setFullPaletes(arrP);
      setNotas(arrN);
      setPaletes(arrP);
      setSelectedRota(null);

      // Busca dados offline após carregar dados online
      await fetchOfflineData();
    } catch (e: any) {
      setFullNotas([]);
      setFullPaletes([]);
      setNotas([]);
      setPaletes([]);
      setErrorMsg(e?.message || "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  }, [diaFetch, fetchOfflineData]);

  useEffect(() => {
    if (isFocused) {
      fetchAllOfDay();
      fetchOfflineData();
    }
  }, [isFocused, fetchAllOfDay, fetchOfflineData]);

  const rotas = useMemo(() => {
    const s = new Set<number>();
    fullNotas.forEach(
      (n) => typeof n?.numeroRota === "number" && s.add(n.numeroRota)
    );
    fullPaletes.forEach(
      (p) => typeof p?.numeroRota === "number" && s.add(p.numeroRota)
    );
    return Array.from(s).sort((a, b) => a - b);
  }, [fullNotas, fullPaletes]);

  async function onSelectRota(rota: number | null) {
    setSelectedRota(rota);
    if (!diaFetch) return;
    if (rota === null) {
      setNotas(fullNotas);
      setPaletes(fullPaletes);
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const [ns, ps] = await Promise.all([
        listNotas(diaFetch, rota),
        listPaletes(diaFetch, rota),
      ]);
      setNotas(Array.isArray(ns) ? ns : []);
      setPaletes(Array.isArray(ps) ? ps : []);
    } catch (e: any) {
      setNotas([]);
      setPaletes([]);
      setErrorMsg(e?.message || `Falha ao filtrar rota ${rota}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Resumo detalhado do dia</Text>
        <Text style={styles.subtitle}>
          Data: {data} {diaFetch ? `(${diaFetch})` : ""}
        </Text>

        <View style={{ marginBottom: 8 }}>
          {errorMsg ? (
            <Text style={{ color: "#b00020", marginTop: 4 }}>
              Erro: {errorMsg}
            </Text>
          ) : null}
          {loading ? (
            <Text style={{ color: "#555" }}>carregando...</Text>
          ) : null}
          <TouchableOpacity
            onPress={fetchAllOfDay}
            style={styles.reloadBtn}
            activeOpacity={0.8}
          >
            <Text
              style={styles.reloadBtnText}
              numberOfLines={1}
              allowFontScaling={false}
              textBreakStrategy="simple"
            >
              {withHairSpaces("Recarregar")}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>
          Notas ({notas.length}) {loading ? "• carregando..." : ""}
          {offlineCount.notas > 0 && (
            <Text style={styles.offlineIndicator}>
              {" "}
              • {offlineCount.notas} offline
            </Text>
          )}
        </Text>

        {notas.map((n, idx) => {
          const avariaSim = (n.avaria || "").toString().toLowerCase() === "sim";
          const conferida = (n.conferidoPor ?? "").toString().trim() !== "";
          return (
            <View key={`nota-${idx}`} style={styles.card}>
              {/* HEADER agora é coluna: badges primeiro, título completo abaixo */}
              <View style={styles.cardHeader}>
                <View style={styles.badgeRow}>
                  <Badge
                    label={avariaSim ? "Avaria" : "Sem avaria"}
                    bg={avariaSim ? "#ffebee" : "#e8f5e9"}
                    color={avariaSim ? "#c62828" : "#2e7d32"}
                  />
                  <Badge
                    label={conferida ? "Conferida" : "Não conferida"}
                    bg={conferida ? "#e8f5e9" : "#eeeeee"}
                    color={conferida ? "#2e7d32" : "#616161"}
                  />
                  {n.tipologia ? (
                    <Badge
                      label={String(n.tipologia)}
                      bg="#e3f2fd"
                      color="#1565c0"
                    />
                  ) : null}
                </View>

                <Text
                  style={styles.cardTitleBelow}
                >{`Nota ${n.numeroNota}`}</Text>
              </View>

              <Text>Rota: {n.numeroRota}</Text>
              {n.conferidoPor ? (
                <Text>Conferido por: {n.conferidoPor}</Text>
              ) : null}
            </View>
          );
        })}

        {/* Notas Offline */}
        {offlineNotas.length > 0 && (
          <>
            <Text style={styles.section}>
              Notas Offline ({offlineNotas.length}) • Aguardando sincronização
            </Text>

            {offlineNotas.map((n, idx) => {
              const avariaSim =
                (n.avaria || "").toString().toLowerCase() === "sim";
              const conferida = (n.conferidoPor ?? "").toString().trim() !== "";
              return (
                <View
                  key={`offline-nota-${idx}`}
                  style={[styles.card, styles.offlineCard]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.badgeRow}>
                      <Badge
                        label={avariaSim ? "Avaria" : "Sem avaria"}
                        bg={avariaSim ? "#ffebee" : "#e8f5e9"}
                        color={avariaSim ? "#c62828" : "#2e7d32"}
                      />
                      <Badge
                        label={conferida ? "Conferida" : "Não conferida"}
                        bg={conferida ? "#e8f5e9" : "#eeeeee"}
                        color={conferida ? "#2e7d32" : "#616161"}
                      />
                      {n.tipologia ? (
                        <Badge
                          label={String(n.tipologia)}
                          bg="#e3f2fd"
                          color="#1565c0"
                        />
                      ) : null}
                      <Badge label="Offline" bg="#fff3e0" color="#e65100" />
                    </View>

                    <Text
                      style={styles.cardTitleBelow}
                    >{`Nota ${n.numeroNota}`}</Text>
                  </View>

                  <Text>Rota: {n.numeroRota}</Text>
                  {n.conferidoPor ? (
                    <Text>Conferido por: {n.conferidoPor}</Text>
                  ) : null}
                </View>
              );
            })}
          </>
        )}

        <Text style={styles.section}>
          Paletes ({paletes.length}) {loading ? "• carregando..." : ""}
          {offlineCount.paletes > 0 && (
            <Text style={styles.offlineIndicator}>
              {" "}
              • {offlineCount.paletes} offline
            </Text>
          )}
        </Text>

        {paletes.map((p, idx) => {
          const remontadoSim =
            (p.remontado || "").toString().toLowerCase() === "sim";
          const conferidoSim =
            (p.conferido || "").toString().toLowerCase() === "sim";
          return (
            <View key={`pal-${idx}`} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.badgeRow}>
                  <Badge
                    label={remontadoSim ? "Remontado" : "Não remontado"}
                    bg={remontadoSim ? "#fff3e0" : "#eeeeee"}
                    color={remontadoSim ? "#ef6c00" : "#616161"}
                  />
                  <Badge
                    label={conferidoSim ? "Conferido" : "Não conferido"}
                    bg={conferidoSim ? "#e8f5e9" : "#eeeeee"}
                    color={conferidoSim ? "#2e7d32" : "#616161"}
                  />
                  {p.tipologia ? (
                    <Badge
                      label={String(p.tipologia)}
                      bg="#e3f2fd"
                      color="#1565c0"
                    />
                  ) : null}
                </View>

                <Text
                  style={styles.cardTitleBelow}
                >{`Palete ${p.numeroPallet}`}</Text>
              </View>

              <Text>Rota: {p.numeroRota}</Text>
            </View>
          );
        })}

        {/* Paletes Offline */}
        {offlinePaletes.length > 0 && (
          <>
            <Text style={styles.section}>
              Paletes Offline ({offlinePaletes.length}) • Aguardando
              sincronização
            </Text>

            {offlinePaletes.map((p, idx) => {
              const remontadoSim =
                (p.remontado || "").toString().toLowerCase() === "sim";
              const conferidoSim =
                (p.conferido || "").toString().toLowerCase() === "sim";
              return (
                <View
                  key={`offline-pal-${idx}`}
                  style={[styles.card, styles.offlineCard]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.badgeRow}>
                      <Badge
                        label={remontadoSim ? "Remontado" : "Não remontado"}
                        bg={remontadoSim ? "#fff3e0" : "#eeeeee"}
                        color={remontadoSim ? "#ef6c00" : "#616161"}
                      />
                      <Badge
                        label={conferidoSim ? "Conferido" : "Não conferido"}
                        bg={conferidoSim ? "#e8f5e9" : "#eeeeee"}
                        color={conferidoSim ? "#2e7d32" : "#616161"}
                      />
                      {p.tipologia ? (
                        <Badge
                          label={String(p.tipologia)}
                          bg="#e3f2fd"
                          color="#1565c0"
                        />
                      ) : null}
                      <Badge label="Offline" bg="#fff3e0" color="#e65100" />
                    </View>

                    <Text
                      style={styles.cardTitleBelow}
                    >{`Palete ${p.numeroPallet}`}</Text>
                  </View>

                  <Text>Rota: {p.numeroRota}</Text>
                </View>
              );
            })}
          </>
        )}

        {!loading &&
        notas.length === 0 &&
        paletes.length === 0 &&
        offlineCount.total === 0 &&
        !errorMsg ? (
          <Text style={{ marginTop: 10, color: "#666" }}>
            Nenhum registro para este dia.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20, paddingBottom: 30 },

  title: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  subtitle: { fontSize: 16, marginBottom: 12 },

  filterRow: { marginBottom: 10 },
  filterLabel: { fontSize: 14, marginBottom: 4 },

  // CHIPS (sem borda)
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  chipInactive: { backgroundColor: "#f2f4f7" },
  chipActive: { backgroundColor: "#2b7ed7" },
  chipText: {
    color: "#333",
    fontWeight: "600",
    lineHeight: 20,
    includeFontPadding: false,
    paddingHorizontal: 2,
  },
  chipTextActive: { color: "#fff" },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  section: { fontSize: 18, fontWeight: "600", marginTop: 16, marginBottom: 8 },

  // CARD (sem borda)
  card: {
    backgroundColor: "#f7f7f9",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  // HEADER agora é coluna
  cardHeader: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 6,
    gap: 8,
  },

  // Título abaixo das badges, largura total, sem ellipsis
  cardTitleBelow: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    includeFontPadding: false,
    paddingTop: 2,
    width: "100%",
  },

  // BADGES (sem borda)
  badgeRow: { flexDirection: "row", flexWrap: "wrap" },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    marginTop: 0,
    marginBottom: 0,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    includeFontPadding: false,
    paddingHorizontal: 2,
  },

  // BOTÃO
  reloadBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#e8f1ff",
    marginTop: 6,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  reloadBtnText: {
    color: "#2b7ed7",
    fontWeight: "700",
    lineHeight: 20,
    includeFontPadding: false,
    paddingHorizontal: 2,
  },
  offlineIndicator: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  offlineCard: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  offlineCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  offlineCardText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },
});
