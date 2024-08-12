import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { auth, db } from "../config";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { LogBox } from "react-native";

LogBox.ignoreLogs(["Warning: ..."]); // Ignore log notification by message
LogBox.ignoreAllLogs(); // Ignore all log notifications

export default function LoadingEntryScreen({ navigation }) {
  const [circleAnim] = useState(new Animated.Value(0));
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    Animated.timing(circleAnim, {
      toValue: 1,
      duration: 1250,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      setAnimationComplete(true); // Set animation complete state to true
    });
  }, []);

  useEffect(() => {
    if (animationComplete) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const userId = user.uid;
            const setupCompletedRef = ref(
              db,
              `users/${userId}/profile/setupCompleted`
            );
            const snapshot = await get(setupCompletedRef);
            const setupCompleted = snapshot.exists() && snapshot.val();

            if (setupCompleted) {
              navigation.navigate("HomeTabs");
            } else {
              navigation.navigate("SetupPage");
            }
          } catch (error) {
            console.error("Error checking setup status:", error);
            navigation.navigate("HomeTabs"); // Navigate to Home on error
          }
        } else {
          navigation.navigate("Login");
        }
      });

      return unsubscribe;
    }
  }, [animationComplete, navigation]);

  const circleSize = circleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1000], // Adjust as needed
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.circle, { width: circleSize, height: circleSize }]}
      />
      <Text style={styles.loadingText}>MEMOREASE</Text>
      <Text style={styles.loadingSpan}>Memories. Made Easy.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
  circle: {
    position: "absolute",
    borderRadius: 500, // Ensure this is half of the maximum output range of circleSize
    backgroundColor: "#c7d9e5", // Light blue with some transparency
  },
  loadingText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  loadingSpan: {
    fontSize: 14,
    color: "#ffffff",
    textAlign: "center",
  },
});
