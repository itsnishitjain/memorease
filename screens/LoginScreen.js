import { useState } from "react";
import {
  Alert,
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../config";
import { ref, get } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Picker } from "@react-native-picker/picker";

export default function LoginScreen({ navigation }) {
  const screenHeight = Dimensions.get("window").height * 1.2;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("patient");

  function goToRegister() {
    navigation.navigate("Register");
  }

  function checkLoginInfo(email, password) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Please enter a valid email address");
      return false;
    }
    if (email === "" || password === "") {
      Alert.alert("Please fill in all fields");
      return false;
    }
    return true;
  }

  async function handleLogin() {
    setLoading(true);

    if (!checkLoginInfo(email, password)) {
      setLoading(false);
      return;
    }

    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      if (response.user) {
        const userId = response.user.uid;
        const userProfileRef = ref(
          db,
          `users/${userId}/profile/setupCompleted`
        );
        const snapshot = await get(userProfileRef);
        const setupCompleted = snapshot.exists() && snapshot.val();

        await AsyncStorage.setItem("userRole", role);

        if (setupCompleted) {
          navigation.navigate("HomeTabs");
        } else {
          navigation.navigate("SetupPage");
        }
      }
    } catch (error) {
      Alert.alert("Error logging in", error.message);
    }

    setLoading(false);
  }

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
          <TouchableOpacity onPress={goToRegister}>
            <Text style={styles.headingTitle}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.headingTitleCurrent}>Login</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          <Text style={styles.welcomeText}>Login to</Text>
          <Text style={styles.title}>MEMOREASE</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Picker
              selectedValue={role}
              onValueChange={(itemValue) => {
                setRole(itemValue);
                console.log(itemValue);
              }}
            >
              <Picker.Item label="Patient" value="patient" />
              <Picker.Item label="Caretaker" value="caretaker" />
            </Picker>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>
                {loading ? "Loading..." : "Login"}
              </Text>
            </TouchableOpacity>
          </View>
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
    padding: 20,
    paddingTop: 50,
    justifyContent: "flex-start",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 50,
    padding: 30,
    paddingTop: 50,
  },
  headingTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -0.5, height: 0.5 },
    textShadowRadius: 5,
  },
  headingTitleCurrent: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    textDecorationLine: "underline",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -0.5, height: 0.5 },
    textShadowRadius: 5,
  },
  welcomeText: {
    color: "white",
    fontSize: 24,
    textAlign: "left",
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -0.5, height: 0.5 },
    textShadowRadius: 5,
  },
  title: {
    color: "white",
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "left",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -0.5, height: 0.5 },
    textShadowRadius: 5,
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  input: {
    borderColor: "#E0E0E0",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#0B3F67",
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
