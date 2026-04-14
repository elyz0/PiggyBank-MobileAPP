import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSaldo } from "./_layout";

interface Meta {
  id: string;
  nome: string;
  valorTotal: number;
  valorGuardado: number;
  salarioRef: number;
  diasPrazo: number;
  dataCriacao: number;
}

export default function ObjetivoScreen() {
  const router = useRouter();
  const { saldo, metas, setMetas, metaAtivaId, setMetaAtivaId } = useSaldo();

  // Estados locais para o formulário
  const [nomeMetaLocal, setNomeMetaLocal] = useState("");
  const [valorMetaLocal, setValorMetaLocal] = useState("");
  const [salario, setSalario] = useState("");
  const [diasDesejados, setDiasDesejados] = useState("30");

  const salarioNum = parseFloat(salario) || 0;
  const metaNum = parseFloat(valorMetaLocal) || 1;
  const diasNum = parseInt(diasDesejados) || 1;

  const faltaGuardar = Math.max(metaNum - saldo, 0);
  const metaDiaria = faltaGuardar / diasNum;
  const impactoSalario =
    salarioNum > 0 ? ((metaDiaria * 30) / salarioNum) * 100 : 0;

  const salvarMeta = () => {
    if (!nomeMetaLocal || metaNum <= 0) {
      Alert.alert("Erro", "Preencha o nome e o valor da meta!");
      return;
    }

    const novaMeta: Meta = {
      id: Date.now().toString(),
      nome: nomeMetaLocal,
      valorTotal: metaNum,
      valorGuardado: 0,
      salarioRef: salarioNum,
      diasPrazo: diasNum,
      dataCriacao: Date.now(),
    };

    setMetas([...metas, novaMeta]);
    // Define a nova meta automaticamente como prioritária ao criar
    setMetaAtivaId(novaMeta.id);

    Alert.alert("Sucesso!", "Nova meta criada e definida como foco!");
    setNomeMetaLocal("");
    setValorMetaLocal("");
    router.push("/");
  };

  // Função para mudar a meta prioritária
  const tornarPrioridade = (id: string) => {
    setMetaAtivaId(id);
    Alert.alert(
      "Foco Alterado",
      "O dinheiro depositado agora irá para esta meta.",
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Nova Meta de Economia 🎯</Text>

      {/* FORMULÁRIO */}
      <View style={styles.card}>
        <Text style={styles.label}>O que você quer comprar?</Text>
        <TextInput
          style={styles.input}
          value={nomeMetaLocal}
          onChangeText={setNomeMetaLocal}
          placeholder="Ex: Novo Smartphone"
        />

        <View style={styles.rowInputs}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.label}>Valor total (R$)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={valorMetaLocal}
              onChangeText={setValorMetaLocal}
              placeholder="0.00"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Salário (R$)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={salario}
              onChangeText={setSalario}
              placeholder="0.00"
            />
          </View>
        </View>

        <Text style={[styles.label, { marginTop: 15 }]}>Em quantos dias?</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={diasDesejados}
          onChangeText={setDiasDesejados}
        />
      </View>

      {salarioNum > 0 && (
        <View style={styles.cardAssistente}>
          <Text style={styles.textoAssistente}>Sugestão do Assistente:</Text>
          <Text style={styles.valorMetaDiaria}>
            R$ {metaDiaria.toFixed(2)} /dia
          </Text>
          <Text style={styles.alerta}>
            {impactoSalario > 30
              ? "⚠️ Impacto alto no salário"
              : "✅ Impacto saudável"}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.botaoSalvar} onPress={salvarMeta}>
        <Text style={styles.botaoSalvarTexto}>Criar Nova Meta</Text>
      </TouchableOpacity>

      <Link href="../" style={styles.link}>
        Voltar ao Cofrinho
      </Link>

      {/* LISTA DE METAS SALVAS */}
      <View style={styles.containerLista}>
        <Text style={styles.tituloSecao}>Suas Metas</Text>
        {metas.length === 0 ? (
          <Text style={styles.textoVazio}>Nenhuma meta ativa no momento.</Text>
        ) : (
          metas.map((item) => {
            const ehPrioridade = metaAtivaId === item.id;

            return (
              <View
                key={item.id}
                style={[
                  styles.cardMetaSalva,
                  ehPrioridade && styles.cardPrioridade,
                ]}
              >
                <View style={styles.headerMeta}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nomeMetaSalva}>{item.nome}</Text>
                    <Text style={styles.detalheMetaSalva}>
                      R$ {item.valorGuardado.toFixed(2)} de R${" "}
                      {item.valorTotal.toFixed(2)}
                    </Text>
                  </View>

                  {/* BOTÃO DE PRIORIDADE */}
                  <TouchableOpacity
                    style={[
                      styles.btnPrioridade,
                      ehPrioridade && styles.btnPrioridadeAtivo,
                    ]}
                    onPress={() => tornarPrioridade(item.id)}
                  >
                    <Text style={styles.btnPrioridadeTexto}>
                      {ehPrioridade ? "⭐ Foco" : "Focar"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.barraProgressoFundo}>
                  <View
                    style={[
                      styles.barraProgressoFrente,
                      {
                        width: `${Math.min((item.valorGuardado / item.valorTotal) * 100, 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f5f6fa", paddingBottom: 60 },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    elevation: 4,
  },
  rowInputs: { flexDirection: "row", marginTop: 15 },
  label: { fontSize: 13, color: "#6c5ce7", fontWeight: "600", marginBottom: 5 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    fontSize: 16,
    paddingVertical: 8,
    color: "#333",
  },
  cardAssistente: {
    backgroundColor: "#6c5ce7",
    width: "100%",
    marginTop: 20,
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
  },
  textoAssistente: { color: "#fff", fontSize: 14, opacity: 0.9 },
  valorMetaDiaria: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginVertical: 5,
  },
  alerta: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  botaoSalvar: {
    backgroundColor: "#2ecc71",
    width: "100%",
    padding: 18,
    borderRadius: 20,
    marginTop: 20,
    alignItems: "center",
  },
  botaoSalvarTexto: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  link: {
    marginTop: 15,
    color: "#999",
    textAlign: "center",
    fontWeight: "600",
  },
  containerLista: { width: "100%", marginTop: 40 },
  tituloSecao: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  textoVazio: { color: "#999", fontStyle: "italic", textAlign: "center" },
  cardMetaSalva: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: "#ddd",
  },
  cardPrioridade: { borderLeftColor: "#6c5ce7", backgroundColor: "#f0eeff" },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nomeMetaSalva: { fontSize: 17, fontWeight: "bold", color: "#333" },
  detalheMetaSalva: { fontSize: 13, color: "#666", marginTop: 2 },
  btnPrioridade: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  btnPrioridadeAtivo: { backgroundColor: "#6c5ce7" },
  btnPrioridadeTexto: { fontSize: 12, fontWeight: "bold", color: "#666" },
  // Cor do texto quando ativo precisa mudar para branco
  btnPrioridadeAtivoTexto: { color: "#fff" },
  barraProgressoFundo: {
    height: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    marginTop: 15,
    overflow: "hidden",
  },
  barraProgressoFrente: { height: "100%", backgroundColor: "#2ecc71" },
});
