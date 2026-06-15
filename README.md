# App Casa IoT

Este é o projeto do aplicativo de monitoramento e controle IoT feito em React Native. Eu utilizei o codigo base passado, e implementei o desafio de persistência de dados.

## Persistência de Dados (AsyncStorage)

Usando a biblioteca @react-native-async-storage/async-storage

O que eu fiz exatamente:
Últimos Estados: Toda vez que chega uma mensagem no MQTT, o app salva a informação. Quando você abre o aplicativo de novo, ele já puxa a última temperatura, a última umidade e o último estado da luz (ligada/desligada) direto do celular, sem precisar esperar o broker mandar os dados novamente.
Histórico: Criei um log que guarda as últimas 10 alterações e exibe usando uma `FlatList`. 
Limpeza: Botão de "Limpar Histórico" que apaga esses dados salvos no AsyncStorage deletando a chave @historico do armazenamento persistente local (SQLite/Filesystem) e atualizando o estado do React para forçar a reconciliação da interface e limpar a FlatList em tempo de execução

## Tecnologias
React Native / Expo
MQTT: Leitura dos tópicos `casa/temp`, `casa/umid` e publicação no `casa/luz`.
AsyncStorage: Para manter os dados salvos localmente.
Modal de erro caso a conexão com o MQTT caia, com botão para tentar reconectar.

---

## Executar o projeto

1. Instale as dependências rodando:
   npm install
2. Execute na raiz do projeto:
   npx expo start
