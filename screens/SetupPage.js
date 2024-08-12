import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { ref, set } from "firebase/database";
import { db, auth } from "../config";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import axios from "axios";

const questions = [
  "What is your name?",
  "When is your birthday?",
  "What is your blood group?",
  "What is your address?",
  "Please enter your emergency contact",
  "What are your medical conditions?",
  "What are your prescribed medications?",
  "What are your medical devices?",
];

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function SetupPage({ navigation }) {
  const screenHeight = Dimensions.get("window").height * 1.2;

  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [userId, setUserId] = useState(auth.currentUser?.uid || "userId");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCurrentLocation, setShowCurrentLocation] = useState(false);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState(bloodGroups[0]);
  const [selectedCountryCode, setSelectedCountryCode] = useState("");

  const handleNext = async () => {
    let valueToSave = inputValue.trim();
    if (currentStep === 2) valueToSave = selectedBloodGroup;
    if (currentStep === 4)
      valueToSave = `${selectedCountryCode} ${inputValue.trim()}`;

    if (valueToSave) {
      try {
        const key = `question_${currentStep + 1}`;
        const userProfileRef = ref(db, `users/${userId}/profile/${key}`);
        await set(userProfileRef, valueToSave);

        setInputValue("");

        if (currentStep < questions.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          // Mark setup as completed
          const setupCompletedRef = ref(
            db,
            `users/${userId}/profile/setupCompleted`
          );
          await set(setupCompletedRef, true);
          navigation.navigate("HomeTabs");
        }
      } catch (error) {
        console.error("Error saving data:", error);
      }
    } else {
      alert("Please provide an answer before continuing.");
    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || inputValue;
    setShowDatePicker(false);
    setInputValue(currentDate.toLocaleDateString());
  };

  const handleUseCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission to access location was denied");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    setShowCurrentLocation(true);

    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

    // Reverse geocoding to get the address
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyDiWHfWflhvYetnkuXcOjMtvbQ93MF5h-0`
    );

    console.log(response);

    const address = response.data.results[0].formatted_address;
    console.log(`Address: ${address}`);
    setInputValue(address);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ImageBackground
        source={require("../assets/background.png")}
        style={[styles.backgroundImage, { height: screenHeight }]}
      >
        <View style={styles.header}>
          <Image
            source={require("../assets/logo.png")} // Replace with your logo
            style={styles.logo}
          />
        </View>
        <View style={styles.container}>
          <Text style={styles.question}>{questions[currentStep]}</Text>
          {currentStep === 1 ? (
            <>
              <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Enter your birthdate"
              />
              <TouchableOpacity
                style={[styles.button, styles.dateButton]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.buttonText}>Pick Date</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  style={styles.datePicker}
                />
              )}
            </>
          ) : currentStep === 2 ? (
            <>
              <View style={styles.bloodGroupContainer}>
                {bloodGroups.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.bloodGroupItem,
                      selectedBloodGroup === item && styles.selectedItem,
                    ]}
                    onPress={() => setSelectedBloodGroup(item)}
                  >
                    <Text
                      style={[
                        styles.bloodGroupText,
                        selectedBloodGroup === item && styles.selectedItemText,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : currentStep === 4 ? (
            <>
              <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Enter emergency contact"
                keyboardType="phone-pad"
              />
            </>
          ) : (
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Enter your answer"
              multiline={currentStep === 3}
            />
          )}
          {currentStep === 3 && (
            <>
              <TouchableOpacity
                style={styles.button}
                onPress={handleUseCurrentLocation}
              >
                <Text style={styles.buttonText}>Use Current Location</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {currentStep < questions.length - 1 ? "Continue" : "Finish"}
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
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
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 50,
    padding: 30,
    paddingTop: 50,
  },
  question: {
    color: "white",
    fontSize: 30,
    marginBottom: 20,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -0.5, height: 0.5 },
    textShadowRadius: 5,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#0B3F67",
    fontWeight: "bold",
    fontSize: 16,
  },
  bloodGroupList: {
    marginBottom: 20,
    alignItems: "center",
  },
  bloodGroupItem: {
    backgroundColor: "#fff",
    padding: 10,
    margin: 5,
    borderWidth: 1,
    borderColor: "#0B3F67",
    borderRadius: 5,
  },
  selectedItem: {
    backgroundColor: "#0B3F67",
    borderColor: "#90C1D5",
  },
  bloodGroupText: {
    color: "black",
  },
  selectedItemText: {
    color: "white",
  },
  dateButton: {
    marginTop: 10,
  },
  datePicker: {
    width: "100%",
    backgroundColor: "white",
  },
});
