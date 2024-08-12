import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import InputPrompt from "../screens/InputPromptScreen";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.chatContainer}>
        <InputPrompt />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  icon: {
    marginRight: 20,
  },
});
