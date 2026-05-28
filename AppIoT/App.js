import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Platform, Button} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MQTTService from './src/services/mqttService';
import StatusModal from './src/components/StatusModal';
import LightControl from './src/components/LightControl';
import Gauges from './src/components/Gauges';

const mqtt = new MQTTService();

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isLightOn, setIsLightOn] = useState(false);
  const [temp, setTemp] = useState(0);
  const [hum, setHum] = useState(0);

  // Cria o estado da lista de histórico
  const [historico, setHistorico] = useState([]);

  const mqttConfig = {
    host: process.env.EXPO_PUBLIC_MQTT_HOST,
    port: parseInt(process.env.EXPO_PUBLIC_MQTT_PORT || '8883'),
    path: process.env.EXPO_PUBLIC_MQTT_PATH,
    user: process.env.EXPO_PUBLIC_MQTT_USER,
    pass: process.env.EXPO_PUBLIC_MQTT_PASS,
    clientId: 'RN_App_' + Math.random(),
  };

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Recupera o histórico
        const dados = await AsyncStorage.getItem('@historico');
        if (dados) setHistorico(JSON.parse(dados));

        // Recupera o último valor de temperatura
        const ultimaTemp = await AsyncStorage.getItem('@ultima_temp');
        if (ultimaTemp) setTemp(parseFloat(ultimaTemp));

        // Recupera o último valor de umidade
        const ultimaHum = await AsyncStorage.getItem('@ultima_hum');
        if (ultimaHum) setHum(parseFloat(ultimaHum));
        //Recupera o último estado da luz
        const luzSalva = await AsyncStorage.getItem('@estado_luz');
        if (luzSalva) setIsLightOn(luzSalva === "1");
      } catch (err) {
        console.log('Erro ao carregar dados:', err);
      }
    };

    carregarDados();
    startConnection();
  }, []);

  const salvarLog = (texto) => {
    const linha = `${new Date().toLocaleTimeString()} - ${texto}`;
    
    setHistorico((prev) => {
      const novaLista = [linha, ...prev].slice(0, 10); // Guarda apenas as últimas 10 linhas
      AsyncStorage.setItem('@historico', JSON.stringify(novaLista));
      return novaLista;
    });
  };

  const startConnection = () => {
    setShowError(false);
    mqtt.connect(
      mqttConfig,
      (topic, message) => {
        //Transforma a mensagem bruta em string
        const msgStr = message ? message.toString() : '';

        if (topic === 'casa/temp') {
          setTemp(parseFloat(msgStr));
          salvarLog(`Temp: ${msgStr}°C`); 
          AsyncStorage.setItem('@ultima_temp', msgStr);
        }
        if (topic === 'casa/umid') {
          setHum(parseFloat(msgStr));
          salvarLog(`Umid: ${msgStr}%`); 
          AsyncStorage.setItem('@ultima_hum', msgStr);
        }
        if (topic === 'casa/luz') {
          setIsLightOn(msgStr === "1");
          AsyncStorage.setItem('@estado_luz', msgStr);
        }
      },
      () => {
        setIsConnected(true);
        mqtt.subscribe('casa/temp');
        mqtt.subscribe('casa/umid');
        mqtt.subscribe('casa/luz');
      },
      (err) => {
        setIsConnected(false);
        setShowError(true);
      }
    );
  };

  const toggleLight = () => {
    const newState = isLightOn ? "0" : "1";
    mqtt.publish('casa/luz', newState);
  };

  const limparHistorico = async () => {
  try {
    await AsyncStorage.removeItem('@historico');
    setHistorico([]);
  } catch (err) {
    console.log('Erro ao apagar histórico:', err);
  }
};
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Casa/Home IoT</Text>

      <LightControl isLightOn={isLightOn} onToggle={toggleLight} />

      <Gauges temp={temp} hum={hum} />

      <View style={styles.hB}>
        <Text style={styles.hTlt}>Histórico Salvo:</Text>

      <View style={{position: 'absolute', bottom: 12, right: 12, width: 160, zIndex: 1}}>
      <Button 
        title="Limpar Histórico" 
        onPress={limparHistorico} 
        color="#FF3B30" 
        />
      </View>
        <FlatList
          data={historico}
          keyExtractor={(item, index) => String(index)}
          renderItem={({ item }) => <Text style={styles.hTxt}>{item}</Text>}
        />
      </View>

      <StatusModal
        visible={showError}
        onRetry={startConnection}
        onLater={() => setShowError(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      web: {
        zoom: 0.75,
      },
    }),
  },
  header: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 20,
  },
  hB: {
    flex: 1,
    width: '100%',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
  },
  hTlt: {
    color: '#00E5FF',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  hTxt: {
    color: '#FFF',
    fontSize: 14,
    paddingVertical: 2,
  },
});