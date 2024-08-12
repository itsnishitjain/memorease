import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from "react-native";
import { useVoiceRecognition } from "../hooks/useVoiceRecognition";
import { fetchGeminiResponse } from "../components/GeminiResponse";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import * as FileSystem from "expo-file-system";
import { db, auth } from "../config";
import { ref, get, set, push, onValue } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

if (Platform.OS !== "web") {
  Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}

export default function InputPromptScreen() {
  const navigation = useNavigation();
  const { state, startRecognizing, stopRecognizing, destroyRecognizer } =
    useVoiceRecognition();
  const [borderColor, setBorderColor] = useState("lightgray");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [messages, setMessages] = useState([
    { text: "How can I help you?", type: "bot" },
  ]);
  const [logs, setLogs] = useState([]);
  const [role, setRole] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const getRole = async () => {
      const storedRole = await AsyncStorage.getItem("userRole");
      setRole(storedRole);
    };

    getRole(); // Get the user role from AsyncStorage
  }, []);

  useEffect(() => {
    fetchLogsFromFirebase();
  }, []);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      const messagesRef = ref(db, `users/${userId}/messages`);
      onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const fetchedMessages = Object.keys(data).map((key) => data[key]);
          setMessages(fetchedMessages);
        } else {
          // Save default message if no messages exist
          const defaultMessage = { text: "How can I help you?", type: "bot" };
          const newMessageRef = push(messagesRef);
          set(newMessageRef, defaultMessage);
          setMessages([defaultMessage]);
        }
      });
    }
  }, []);

  const fetchLogsFromFirebase = async () => {
    try {
      const logsRef = ref(db, "logs/");
      const snapshot = await get(logsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const logsList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setLogs(logsList);
      } else {
        console.log("No logs available");
      }
    } catch (error) {
      console.error("An error occurred while fetching logs:", error);
    }
  };

  useEffect(() => {
    if (state.results[0]) {
      const newMessages = [
        ...messages,
        { text: state.results[0], type: "user" },
      ];
      setMessages(newMessages);

      // Save user message to Firebase
      saveMessageToFirebase(state.results[0], "user");

      // Fetch the Gemini response
      fetchGeminiResponse(state.results[0], logs).then((response) => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: response, type: "bot" },
        ]);

        // Save bot response to Firebase
        saveMessageToFirebase(response, "bot");

        Speech.speak(response);
      });

      destroyRecognizer(); // Destroy recognizer after processing the voice input
    }
  }, [state.results[0]]);

  const saveMessageToFirebase = async (text, type) => {
    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const messagesRef = ref(db, `users/${userId}/messages`);
        const newMessageRef = push(messagesRef);
        await set(newMessageRef, {
          text: text,
          type: type,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error("Error fetching emergency contact:", error);
    }
  };

  const handlePromptSubmit = async (prompt) => {
    fetchLogsFromFirebase();
    if (prompt.trim()) {
      const newMessages = [...messages, { text: prompt, type: "user" }];
      setMessages(newMessages);
      setCurrentPrompt("");

      // Save user message to Firebase
      saveMessageToFirebase(prompt, "user");

      // Fetch the Gemini response
      const response = await fetchGeminiResponse(prompt, logs);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: response, type: "bot" },
      ]);

      // Save bot response to Firebase
      saveMessageToFirebase(response, "bot");
    }
  };

  const handleSubmit = async () => {
    fetchLogsFromFirebase();
    if (!state.results[0]) return;
    try {
      // Fetch the audio blob from the server
      const audioBlob = await fetchAudio(state.results[0]);

      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === "string") {
          // data:audio/mpeg;base64,....(actual base64 data)...
          const audioData = e.target.result.split(",")[1];

          // Write the audio data to a local file
          const path = await writeAudioToFile(audioData);

          await playFromPath(path);
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (e) {
      console.error("An error occurred:", e);
    }
  };

  // Function to fetch synthesized audio from the server
  const fetchAudio = async (text) => {
    const response = await fetch(
      "http://localhost:3000/text-to-speech/synthesize",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      }
    );
    return await response.blob();
  };

  // Function to write the audio data to a local file
  const writeAudioToFile = async (audioData) => {
    const path = FileSystem.documentDirectory + "temp.mp3";
    await FileSystem.writeAsStringAsync(path, audioData, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return path;
  };

  async function playFromPath(path) {
    try {
      const soundObject = new Audio.Sound();
      await soundObject.loadAsync({ uri: path });
      await soundObject.playAsync();
    } catch (error) {
      console.log("An error occurred while playing the audio:", error);
    }
  }

  return (
    <ImageBackground
      source={require("../assets/background.png")}
      style={styles.backgroundImage}
    >
      <View style={styles.header}>
        <Image
          source={require("../assets/logo.png")} // Replace with your logo
          style={styles.logo}
        />
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Icon name="person-circle-outline" size={40} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <Pressable
          onPressIn={() => {
            setBorderColor("lightgreen");
            startRecognizing();
          }}
          onPressOut={() => {
            setBorderColor("lightgray");
            stopRecognizing();
            handleSubmit();
          }}
          style={[styles.voiceButton, { borderColor }]}
        >
          <Icon name="mic-outline" size={70} color="#000" style={styles.icon} />
        </Pressable>
        <TouchableOpacity
          style={styles.showMessagesButton}
          onPress={() => {
            setModalVisible(true);
            fetchLogsFromFirebase();
          }}
        >
          <Text style={styles.showMessagesText}>Show Messages</Text>
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.modalContainer}>
              <FlatList
                data={messages}
                showsVerticalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View
                    style={
                      item.type === "user"
                        ? styles.userMessage
                        : styles.botMessage
                    }
                  >
                    <Text style={styles.messageText}>{item.text}</Text>
                  </View>
                )}
                contentContainerStyle={styles.messageContainer}
              />
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={currentPrompt}
                  onChangeText={setCurrentPrompt}
                  placeholder="Type a message"
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={() => handlePromptSubmit(currentPrompt)}
                >
                  <Icon name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 30,
    paddingTop: 50,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 25,
  },
  voiceButton: {
    width: 140,
    height: 140,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 10,
    marginBottom: 50,
  },
  showMessagesButton: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center",
    width: "60%",
  },
  showMessagesText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F5FCFF",
    padding: 10,
  },
  messageContainer: {
    flexGrow: 1,
    padding: 10,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#bed8f3",
    borderRadius: 10,
    marginVertical: 5,
    padding: 10,
    maxWidth: "80%",
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF",
    borderRadius: 10,
    marginVertical: 5,
    padding: 10,
    maxWidth: "80%",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFF",
  },
  textInput: {
    flex: 1,
    height: 40,
    borderColor: "#E0E0E0",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#183981",
    borderRadius: 5,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "#183981",
    padding: 13,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
