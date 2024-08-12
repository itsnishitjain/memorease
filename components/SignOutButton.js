import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { signOut } from "firebase/auth";

import { auth } from "../config";

export default function SignOutButton() {
  const navigation = useNavigation();
  async function handleSignOut() {
    setLoading(true);

    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }

    setLoading(false);
  }

  return (
    <Pressable
      style={styles.button}
      onPress={() => navigation.navigate("Profile")}
    >
      <Text style={styles.buttonText}>
        {auth.currentUser ? auth.currentUser.email[0].toUpperCase() : "#"}
      </Text>
    </Pressable>
  );
}

const buttonSide = 40;

const styles = StyleSheet.create({
  button: {
    width: buttonSide,
    height: buttonSide,
    borderRadius: buttonSide / 2,

    backgroundColor: "#3498db",
    margin: 10,

    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    color: "white",
    textAlign: "center",
  },
});
