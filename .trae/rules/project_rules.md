1. Plataforma & Stack

React Native com Expo SDK 53

Suporte para Android, iOS e Web

Formulários e validação: React Hook Form + Yup

Armazenamento offline-first: SQLite (expo-sqlite / react-native-sqlite-storage)

Navegação: React Navigation (bottom tabs + stack)

2. Gerenciamento de Dados (Online + Offline)

Política de escrita dupla (Dual write) para cada operação:

Salva o registro localmente no SQLite.

Tenta enviar para a API backend imediatamente.

Se não houver conexão ou o envio falhar → registro fica em estado pending.

A sincronização é feita de duas formas:

Automática quando a rede volta (via NetInfo).

Manual pelo botão de sincronização na aba Offline.

3. Estrutura do Banco de Dados (SQLite)

Cada tabela offline contém:

id → identificador único local.

created_at → timestamp de criação local.

payload → objeto JSON com os dados do registro.

status → "pending" | "synced" | "error".

last_error → mensagem de erro se o envio falhar.

server_id → ID retornado pelo backend após sucesso.

Tabelas existentes:

notas_offline

paletes_offline

4. Regras de Negócio
Notas (Notas)

Campos obrigatórios:

rota (número da rota)

nota (número da nota)

Campos opcionais:

tipologia (resfriado, congelado, seco)

conferido (boolean/switch)

conferente (string)

avarias (array de avarias → tipo do erro, código do produto, descrição, quantidade, unidade)

Se houver avarias → armazenadas como JSON dentro do payload.

Paletes (Paletes)

Campos obrigatórios:

rota (número da rota)

tipologia (resfriado, congelado, seco)

Campos opcionais:

numeroPalete → se vazio, salva como "sem bandeira".

remontado (boolean/switch).

conferido (boolean/switch).

5. Autenticação

O Auth Context controla login e logout.

Login inválido → alerta de erro.

Login válido → salva token e libera rotas protegidas.

6. Regras de Sincronização

Automática: quando o dispositivo reconecta na internet.

Manual: usuário pode forçar sync na aba Offline.

Sucesso:

Registro marcado como synced.

server_id salvo no local.

Erro:

Registro marcado como error.

Mensagem de erro armazenada em last_error.

7. Validação

Todos os formulários usam React Hook Form + Yup.

Campos obrigatórios sempre validados.

Campos opcionais só validados se preenchidos.

Exemplo: numeroPalete → se vazio, assume "sem bandeira".

8. UI/UX

Tabs principais: Home | Notas | Paletes | Offline.

Dropdowns com react-native-dropdown-picker.

Switches para valores booleanos (avaria, conferido, remontado).

Tela Offline exibe registros pending e error, com opção de reenviar.