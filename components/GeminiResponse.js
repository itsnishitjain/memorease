import { useEffect, useState } from "react";
import {
  Button,
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import * as Speech from "expo-speech";

export async function fetchGeminiResponse(prompt, logs) {
  const formattedLogs = logs
    .map(
      (log) =>
        `Log: ${log.text} (Time: ${log.time}, Location: ${log.location}${
          log.imageUrl ? `, Image URL: ${log.imageUrl}` : ""
        })`
    )
    .join("\n");
  const apiKey = process.env.EXPO_PUBLIC_APIKEY;

  const formattedPrompt = `You are an AI assistant being used for an app called Alzheimer's Logger. Your primary purpose is to assist with information retrieval and memory logging for Alzheimer's patients. Only respond to queries that are relevant to helping Alzheimer's patients remember or manage their daily activities and logged information. Here is the user input: "${prompt}". Here is the logged information: "${formattedLogs}". If the query is not relevant, respond with "Sorry, cannot help you with that."`;

  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
      {
        contents: [{ parts: [{ text: formattedPrompt }] }],
      },
      {
        params: {
          key: apiKey,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("An error occurred while fetching Gemini response:", error);
    return "Sorry, I couldn't process that request.";
  }
}

export default function GeminiResponse({ prompt, logs }) {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!prompt) return;

    async function fetchData() {
      const response = await fetchGeminiResponse(prompt, logs);
      setResponse(response);
    }

    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [prompt]);

  const speak = () => {
    const thingToSay = String(response);
    Speech.speak(thingToSay);
  };

  const stop = () => {
    Speech.stop();
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Text style={styles.text}>{response}</Text>
      )}
      <Button title="audio output" onPress={speak} />
      <Button title="audio stop" onPress={stop} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  text: {
    paddingBottom: 20,
  },
});
