import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  FlatList,
  Alert,
  Image,
  Modal,
} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { db } from "../config";
import { storage } from "../config";
import { ref, push, get, remove, update, set } from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export default function LogInfoScreen({ navigation }) {
  const [logs, setLogs] = useState([]);
  const [currentLog, setCurrentLog] = useState("");
  const [editingLogId, setEditingLogId] = useState(null);
  const [showLogs, setShowLogs] = useState(true);
  const [location, setLocation] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [role, setRole] = useState("");

  useEffect(() => {
    const getRole = async () => {
      const storedRole = await AsyncStorage.getItem("userRole");
      setRole(storedRole);
    };

    getRole(); // Get the user role from AsyncStorage
  }, []);

  useEffect(() => {
    fetchLogsFromFirebase();
    getLocation();
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

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission to access location was denied");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setLocation(location);
  };

  const pickImage = async () => {
    if (role === "caretaker") return;
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (result.granted === false) {
      alert("Permission to access gallery is required!");
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync();
    if (!pickerResult.cancelled) {
      setSelectedImage(pickerResult.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    console.log("Current Log:", currentLog);
    const response = await fetch(uri);
    console.log("response:", response);
    const blob = await response.blob();
    console.log("blob:", blob);
    const imageRef = storageRef(storage, `images/${Date.now()}`);
    console.log("imageRef:", imageRef);
    await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(imageRef);
    console.log("Image uploaded, download URL:", downloadURL);
    return downloadURL;
  };

  const handleAddLog = async () => {
    if (role === "caretaker") return;
    if (currentLog.trim()) {
      console.log("Current Log:", currentLog);
      let imageUrl = null;
      if (selectedImage) {
        console.log("Current Log:", currentLog);
        console.log("Selected Image:", selectedImage);
        imageUrl = await uploadImage(selectedImage);
        console.log("Current Log:", currentLog);
        console.log("Image URL:", imageUrl);
      }

      const logData = {
        text: currentLog,
        time: new Date().toLocaleString(),
        location: location
          ? `${location.coords.latitude}, ${location.coords.longitude}`
          : "Location not available",
        imageUrl: imageUrl,
      };

      if (editingLogId) {
        update(ref(db, `logs/${editingLogId}`), logData);
        setLogs(
          logs.map((log) =>
            log.id === editingLogId ? { id: log.id, ...logData } : log
          )
        );
        setEditingLogId(null);
      } else {
        const newLogRef = push(ref(db, "logs/"));
        set(newLogRef, logData);
        setLogs([...logs, { id: newLogRef.key, ...logData }]);
      }
      setCurrentLog("");
      setSelectedImage(null);
      setModalVisible(false);
    }
  };

  const handleEditLog = (log) => {
    if (role === "caretaker") return;
    setCurrentLog(log.text);
    setEditingLogId(log.id);
    setModalVisible(true);
  };

  const handleDeleteLog = (logId) => {
    if (role === "caretaker") return;
    Alert.alert(
      "Delete Log",
      "Are you sure you want to delete this log?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => {
            remove(ref(db, `logs/${logId}`))
              .then(() => {
                setLogs(logs.filter((log) => log.id !== logId));
              })
              .catch((error) => {
                console.error(
                  "An error occurred while deleting the log:",
                  error
                );
              });
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ImageBackground
      source={require("../assets/background.png")}
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <Text style={styles.heading}>Logs</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search logs..."
          onChangeText={(text) => {
            setLogs(
              logs.filter((log) =>
                log.text.toLowerCase().includes(text.toLowerCase())
              )
            );
          }}
        />
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.logItem}>
              <View style={styles.logContent}>
                <Text style={styles.logTitle}>{item.text}</Text>
                <Text style={styles.logSubText}>Time: {item.time}</Text>
                <Text style={styles.logSubText}>Location: {item.location}</Text>
                {item.imageUrl && (
                  <Image source={{ uri: item.imageUrl }} style={styles.image} />
                )}
              </View>
              <View style={styles.logActions}>
                <TouchableOpacity onPress={() => handleEditLog(item)}>
                  <Ionicons
                    name="pencil"
                    size={25}
                    color="#183981"
                    style={{ marginLeft: 15, marginRight: 15 }}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteLog(item.id)}>
                  <Ionicons name="trash" size={25} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={40} color="#183981" />
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <ImageBackground
            source={require("../assets/background.png")} // Replace with your image path
            style={{ flex: 1, resizeMode: "cover" }}
          >
            <View style={styles.modalContainer}>
              <Text style={styles.modalHeader}>New Log</Text>

              <TextInput
                style={styles.textInput}
                value={currentLog}
                onChangeText={setCurrentLog}
                placeholder="Enter log info"
              />
              <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
                <Text style={styles.buttonText}>Pick Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleAddLog}>
                <Text style={styles.buttonText}>
                  {editingLogId ? "Update Log" : "Add Log"}
                </Text>
              </TouchableOpacity>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.imagePreview}
                />
              )}
            </View>
          </ImageBackground>
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
    padding: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#10537a",
    marginTop: 50,
    marginBottom: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#FFF",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  logItem: {
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logContent: {
    flex: 1,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  logSubText: {
    fontSize: 14,
    color: "#555",
  },
  logActions: {
    flexDirection: "row",
    marginTop: 10,
  },
  editText: {
    color: "#007BFF",
    marginRight: 10,
  },
  deleteText: {
    color: "#FF0000",
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 40,
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    marginTop: 50,
  },
  modalHeader: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#10537a",
    marginBottom: 20,
  },
  textInput: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#FFF",
    borderRadius: 5,
    marginBottom: 20,
  },
  pickButton: {
    width: "100%",
    backgroundColor: "#e9f5f8",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  button: {
    width: "100%",
    backgroundColor: "#e9f5f8",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#10537a",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    width: "100%",
    backgroundColor: "#FF0000",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  imagePreview: {
    width: "100%",
    height: "50%",
    marginBottom: 20,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginTop: 10,
  },
});
