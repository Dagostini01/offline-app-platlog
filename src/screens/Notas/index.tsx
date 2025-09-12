import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DropDownPicker from "react-native-dropdown-picker";
import { useForm, Controller, useWatch, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { createNota } from "../../services/api";
import { useOfflineSync } from "../../hooks/useOfflineSync";
import NetInfo from "@react-native-community/netinfo";

type AvariaForm = {
  tipoErro: string;
  codigoProduto?: string;
  descricaoProduto?: string;
  quantidade?: number;
  unidadeMedida?: string;
};

type FormData = {
  rota: number;
  nota: number;
  tipologia?: string;
  conferido: boolean;
  conferente?: string;
  avaria: boolean;
  avarias: AvariaForm[];
  obsNota?: string;
};

// ---------- Validação ----------
const avariaItemSchema = yup.object({
  tipoErro: yup.string().required("Informe o tipo de erro"),
  codigoProduto: yup.string().required("Informe o código do produto"),
  descricaoProduto: yup.string().required("Informe a descrição"),
  quantidade: yup
    .number()
    .typeError("Informe a quantidade")
    .required("Informe a quantidade"),
  unidadeMedida: yup.string().optional(),
});

const notaSchema = yup.object({
  rota: yup
    .number()
    .typeError("Informe o número da rota")
    .required("Informe a rota"),
  nota: yup
    .number()
    .typeError("Informe o número da nota")
    .required("Informe a nota"),
  tipologia: yup.string().required("Selecione a tipologia"),
  conferido: yup.boolean().required(),
  conferente: yup.string().when("conferido", {
    is: true,
    then: (s) => s.required("Informe quem conferiu"),
    otherwise: (s) => s.optional(),
  }),
  avaria: yup.boolean().required(),
  avarias: yup.array(avariaItemSchema).when("avaria", {
    is: true,
    then: (s) => s.min(1, "Inclua ao menos uma avaria"),
    otherwise: (s) => s.optional().default([]),
  }),
  obsNota: yup.string().max(500, "Máximo 500 caracteres").optional(),
});

// ---------- Helper ----------
function toQtyString(n?: number) {
  if (n === undefined || n === null || Number.isNaN(n)) return undefined;
  return n.toFixed(3).replace(/\.?0+$/, ""); // até 3 casas, sem zeros à direita
}

export default function Notas() {

  const { isOnline, isSyncing, savePaleteOffline, getOfflineCount } =
    useOfflineSync();
  const [offlineCount, setOfflineCount] = useState({
    notas: 0,
    paletes: 0,
    total: 0,
  });

  const { saveNotaOffline } = useOfflineSync();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    resetField,
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(notaSchema) as any,
    defaultValues: {
      rota: 0,
      nota: 0,
      tipologia: "",
      conferido: false,
      conferente: "",
      avaria: false,
      avarias: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "avarias",
  });

  const conferido = useWatch({ control, name: "conferido" });
  const avaria = useWatch({ control, name: "avaria" });

  const [tipologia, setTipologia] = useState<string | null>(null);
  const [openTipologia, setOpenTipologia] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Para dropdown de "tipoErro" por linha
  const [openTipoErroIndex, setOpenTipoErroIndex] = useState<number | null>(
    null
  );

  const tipologiaItems = [
    { label: "Resfriado", value: "resfriado" },
    { label: "Congelado", value: "congelado" },
    { label: "Seco", value: "seco" },
  ];

  const tipoErroItems = [
    { label: "Avaria de Produto", value: "avaria_produto" },
    { label: "Avaria em Embalagem", value: "avaria_embalagem" },
    { label: "Falta", value: "falta" },
    { label: "Inversão de Produto", value: "inversao_produto" },
    { label: "Inversão de Rota", value: "inversao_rota" },
    { label: "Sobra", value: "sobra" },
  ];

  // espelha valor do DropDownPicker em RHF
  useEffect(() => {
    setValue("tipologia", tipologia ?? "");
  }, [tipologia, setValue]);

  // quando liga/desliga o switch "Avaria?", gerencia o array
  useEffect(() => {
    if (avaria) {
      if (fields.length === 0) {
        append({
          tipoErro: "",
          codigoProduto: "",
          descricaoProduto: "",
          quantidade: undefined,
          unidadeMedida: "UN",
        });
      }
    } else {
      replace([]); // limpa todas as avarias
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avaria]);

  // --- Resumo das avarias ---
  const avariasValues = watch("avarias");
  const countAvarias = Array.isArray(avariasValues) ? avariasValues.length : 0;
  const totalQtdAvarias = Array.isArray(avariasValues)
    ? avariasValues.reduce((acc, a) => acc + (Number(a?.quantidade) || 0), 0)
    : 0;

  // 🔧 Corrige o tipo de setOpen (boolean | (prev)=>boolean)
  const makeSetOpenForIndex =
    (idx: number) => (v: boolean | ((prev: boolean) => boolean)) => {
      const prev = openTipoErroIndex === idx;
      const next = typeof v === "function" ? v(prev) : v;
      setOpenTipoErroIndex(next ? idx : null);
    };

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true);

      const hasAvarias = data.avaria && data.avarias && data.avarias.length > 0;

      const payload = {
        // NÃO enviar diaHoje (DB preenche com DEFAULT)
        numeroRota: Number(data.rota),
        numeroNota: Number(data.nota),
        avaria: hasAvarias ? ("sim" as const) : ("nao" as const),
        tipologia:
          (data.tipologia as "resfriado" | "congelado" | "seco") || "seco",
        conferidoPor: (data.conferente || "").trim() || "Não informado",
        obsNota: data.obsNota || undefined,
        avarias: hasAvarias
          ? data.avarias.map((a) => ({
            tipoErro: a.tipoErro,
            codProduto: a.codigoProduto || undefined,
            descProduto: a.descricaoProduto || undefined,
            quantidade: toQtyString(a.quantidade),
            unidadeMedida: a.unidadeMedida || "UN",
          }))
          : undefined,
      };

      const netInfo = await NetInfo.fetch();

      if (netInfo.isConnected) {
        try {
          const saved = await createNota(payload);
          Alert.alert("Sucesso", `Nota #${saved?.numeroNota} salva online!`);
        } catch (err: any) {
          await saveNotaOffline(payload);
          Alert.alert(
            "Salvo Offline",
            `Nota #${payload.numeroNota} salva offline. Será sincronizada quando houver conexão.`
          );
        }
      } else {
        await saveNotaOffline(payload);
        Alert.alert(
          "Salvo Offline",
          `Nota #${payload.numeroNota} salva offline. Será sincronizada quando houver conexão.`
        );
      }

      setValue("rota", 0);
      setValue("nota", 0);
      setValue("conferido", false);
      setValue("conferente", "");
      setValue("avaria", false);
      replace([]); // limpa array
      setValue("tipologia", "");
      setValue("obsNota", "");
      setTipologia(null);
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.includes("Já existe uma nota para este dia/rota/número")) {
        Alert.alert("Atenção", "Essa nota já foi cadastrada hoje nessa rota.");
      } else {
        Alert.alert("Erro", msg || "Falha ao salvar a nota");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            <Text style={styles.title}>Cadastro de Notas</Text>
            <Text>Data: {new Date().toLocaleDateString("pt-BR")}</Text>

            <View
              style={[
                styles.statusBox,
                { backgroundColor: isOnline ? "#E8F5E9" : "#FFF3E0" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: isOnline ? "#2E7D32" : "#E65100" },
                ]}
              >
                {isOnline ? "Online" : "Offline"}
                {isSyncing && "Sincronizando..."}
                {offlineCount.total > 0 &&
                  ` • ${offlineCount.total} item(s) pendente(s)`}
              </Text>
            </View>

            {/* Resumo de avarias */}
            {avaria && (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>
                  {countAvarias} {countAvarias === 1 ? "avaria" : "avarias"}{" "}
                  adicionada{countAvarias === 1 ? "" : "s"}
                  {countAvarias > 0 ? ` • Qtde total: ${totalQtdAvarias}` : ""}
                </Text>
              </View>
            )}

            <Text>Rota</Text>
            <Controller
              control={control}
              name="rota"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  value={String(value)}
                  onChangeText={(t) => onChange(Number(t))}
                  placeholder="Informe o número da rota"
                />
              )}
            />
            {errors.rota && (
              <Text style={styles.error}>{String(errors.rota.message)}</Text>
            )}

            <Text>Nota</Text>
            <Controller
              control={control}
              name="nota"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  value={String(value)}
                  onChangeText={(t) => onChange(Number(t))}
                  placeholder="Informe o número da nota"
                />
              )}
            />
            {errors.nota && (
              <Text style={styles.error}>{String(errors.nota.message)}</Text>
            )}

            <Text>Tipologia</Text>
            <Controller
              control={control}
              name="tipologia"
              render={({ fieldState: { error } }) => (
                <>
                  <DropDownPicker
                    open={openTipologia}
                    setOpen={setOpenTipologia}
                    items={tipologiaItems}
                    value={tipologia}
                    setValue={(cb) => {
                      const selected = cb(tipologia as any);
                      setTipologia(selected as string | null);
                      return selected;
                    }}
                    listMode="SCROLLVIEW"
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    placeholder="Selecione a tipologia"
                    zIndex={1000}
                  />
                  {error && <Text>{String(error.message)}</Text>}
                </>
              )}
            />

            <View style={styles.switchContainer}>
              <Text>Conferido?</Text>
              <Controller
                control={control}
                name="conferido"
                render={({ field: { onChange, value } }) => (
                  <Switch value={value} onValueChange={onChange} />
                )}
              />
            </View>

            {conferido && (
              <>
                <Text>Quem conferiu?</Text>
                <Controller
                  control={control}
                  name="conferente"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      placeholder="Digite o nome do conferente"
                    />
                  )}
                />
                {errors.conferente && (
                  <Text style={styles.error}>
                    {String(errors.conferente.message)}
                  </Text>
                )}
              </>
            )}

            <View style={styles.switchContainer}>
              <Text>Avaria?</Text>
              <Controller
                control={control}
                name="avaria"
                render={({ field: { onChange, value } }) => (
                  <Switch value={value} onValueChange={onChange} />
                )}
              />
            </View>

            {/* ----- MÚLTIPLAS AVARIAS ----- */}
            {avaria && (
              <View style={styles.box}>
                <View style={styles.rowHeader}>
                  <Text style={styles.subtitle}>Avarias</Text>
                  <TouchableOpacity
                    onPress={() =>
                      append({
                        tipoErro: "",
                        codigoProduto: "",
                        descricaoProduto: "",
                        quantidade: undefined,
                        unidadeMedida: "UN",
                      })
                    }
                    style={styles.addBtn}
                  >
                    <Text style={styles.addBtnText}>+ Adicionar</Text>
                  </TouchableOpacity>
                </View>

                {fields.map((field, index) => (
                  <View key={field.id} style={styles.avariaCard}>
                    <View style={styles.rowHeader}>
                      <Text style={{ fontWeight: "600" }}>
                        Avaria #{index + 1}
                      </Text>
                      <TouchableOpacity
                        onPress={() => remove(index)}
                        style={styles.removeBtn}
                      >
                        <Text style={styles.removeBtnText}>Remover</Text>
                      </TouchableOpacity>
                    </View>

                    <Text>Tipo do erro</Text>
                    <Controller
                      control={control}
                      name={`avarias.${index}.tipoErro`} // FIX
                      render={({
                        field: { onChange, value },
                        fieldState: { error },
                      }) => (
                        <>
                          <DropDownPicker
                            open={openTipoErroIndex === index}
                            setOpen={makeSetOpenForIndex(index)} // ✅ corrigido
                            items={tipoErroItems}
                            value={value ?? null}
                            setValue={(cb) => {
                              const selected = cb((value ?? null) as any);
                              onChange(selected);
                              return selected;
                            }}
                            listMode="SCROLLVIEW"
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownContainer}
                            placeholder="Selecione o tipo de erro"
                            zIndex={900 - index}
                          />
                          {error && (
                            <Text style={styles.error}>
                              {String(error.message)}
                            </Text>
                          )}
                        </>
                      )}
                    />

                    <Text>Código do produto</Text>
                    <Controller
                      control={control}
                      name={`avarias.${index}.codigoProduto`} // FIX
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          returnKeyType="done"
                          onSubmitEditing={Keyboard.dismiss}
                          value={value}
                          onChangeText={onChange}
                          placeholder="Informe o código do produto"
                        />
                      )}
                    />
                    {errors.avarias?.[index]?.codigoProduto && (
                      <Text style={styles.error}>
                        {String(errors.avarias[index]?.codigoProduto?.message)}
                      </Text>
                    )}

                    <Text>Descrição do produto</Text>
                    <Controller
                      control={control}
                      name={`avarias.${index}.descricaoProduto`} // FIX
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          style={styles.input}
                          value={value}
                          onChangeText={onChange}
                          returnKeyType="done"
                          onSubmitEditing={Keyboard.dismiss}
                          placeholder="Digite a descrição do produto"
                        />
                      )}
                    />
                    {errors.avarias?.[index]?.descricaoProduto && (
                      <Text style={styles.error}>
                        {String(
                          errors.avarias[index]?.descricaoProduto?.message
                        )}
                      </Text>
                    )}

                    <Text>Quantidade</Text>
                    <Controller
                      control={control}
                      name={`avarias.${index}.quantidade`} // FIX
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          style={styles.input}
                          keyboardType="numeric"
                          returnKeyType="done"
                          onSubmitEditing={Keyboard.dismiss}
                          value={
                            value === undefined || value === null
                              ? ""
                              : String(value)
                          }
                          onChangeText={(t) => onChange(Number(t))}
                          placeholder="Informe a quantidade"
                        />
                      )}
                    />
                    {errors.avarias?.[index]?.quantidade && (
                      <Text style={styles.error}>
                        {String(errors.avarias[index]?.quantidade?.message)}
                      </Text>
                    )}

                    <Text>Unidade</Text>
                    <Controller
                      control={control}
                      name={`avarias.${index}.unidadeMedida`} // FIX
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          style={styles.input}
                          value={value || "UN"}
                          onChangeText={onChange}
                          returnKeyType="done"
                          onSubmitEditing={Keyboard.dismiss}
                          placeholder="UN, CX, KG..."
                        />
                      )}
                    />
                  </View>
                ))}

                {errors.avarias &&
                  typeof errors.avarias?.message === "string" && (
                    <Text style={styles.error}>
                      {String(errors.avarias.message)}
                    </Text>
                  )}
              </View>
            )}
            {/* ----- /MÚLTIPLAS AVARIAS ----- */}

            <Text>Observações</Text>
            <Controller
              control={control}
              name="obsNota"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={value || ""}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={4}
                  placeholder="Digite observações sobre a conferência (opcional)"
                  maxLength={500}
                  textAlignVertical="top"
                />
              )}
            />
            {errors.obsNota && (
              <Text style={styles.error}>
                {String(errors.obsNota.message)}
              </Text>
            )}

            <Button
              title={submitting ? "Salvando..." : "Salvar Nota"}
              onPress={handleSubmit(onSubmit)}
              disabled={submitting}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  keyboard: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16 },
  input: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    borderRadius: 6,
    borderColor: "#ccc",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  dropdown: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    height: 40,
    marginBottom: 10,
  },
  dropdownContainer: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 10,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  error: { color: "red", marginBottom: 10 },
  box: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addBtn: {
    backgroundColor: "#1976d2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "600",
    width: "100%",
    textAlign: "center",
  },
  avariaCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  removeBtn: {
    backgroundColor: "#d32f2f",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeBtnText: {
    color: "#fff",
    fontWeight: "600",
    width: "100%",
    textAlign: "center",
  },
  // resumo
  summaryBox: {
    backgroundColor: "#E8F5E9",
    borderColor: "#C8E6C9",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  summaryText: { color: "#2E7D32", fontWeight: "600" },
    statusBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: "center",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
