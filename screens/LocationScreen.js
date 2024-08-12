import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Button,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ref, get } from "firebase/database";
import { db, auth } from "../config";
import LocationTracker from "../components/LocationTracker";
import homeLocation from "../components/LocationTracker";

export default function LocationScreen() {
  const [emergencyContact, setEmergencyContact] = useState("");

  useEffect(() => {
    fetchEmergencyContact();
  }, []);

  const fetchEmergencyContact = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const emergencyContactRef = ref(
          db,
          `users/${userId}/profile/question_5`
        );
        const snapshot = await get(emergencyContactRef);
        if (snapshot.exists()) {
          setEmergencyContact(snapshot.val());
        } else {
          Alert.alert("Emergency contact not found");
        }
      }
    } catch (error) {
      console.error("Error fetching emergency contact:", error);
    }
  };

  const handleEmergencyCall = () => {
    if (emergencyContact) {
      Linking.openURL(`tel:${emergencyContact}`);
    } else {
      Alert.alert("Emergency contact not available");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/background.png")}
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <LocationTracker />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.emergencyButton]}
            onPress={handleEmergencyCall}
          >
            <Text style={styles.buttonText}>Contact for Emergency</Text>
          </TouchableOpacity>
        </View>
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
  button: {
    width: "100%",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  emergencyButton: {
    backgroundColor: "#FF0000",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
