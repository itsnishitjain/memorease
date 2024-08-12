import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ImageBackground,
  TouchableOpacity,
  Platform,
  Alert,
  FlatList,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import {
  getDatabase,
  ref,
  set,
  push,
  onValue,
  remove,
} from "firebase/database";
import { db } from "../config";
import { Ionicons } from "@expo/vector-icons";

export default function RemindersScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [isDatePicker, setIsDatePicker] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const loadReminders = async () => {
      const fetchedReminders = await fetchReminders();
      setReminders(fetchedReminders);
    };
    loadReminders();
  }, []);

  const fetchReminders = async () => {
    const remindersRef = ref(db, "reminders/");
    return new Promise((resolve, reject) => {
      onValue(
        remindersRef,
        (snapshot) => {
          const data = snapshot.val();
          const remindersArray = data
            ? Object.keys(data).map((key) => ({ id: key, ...data[key] }))
            : [];
          resolve(remindersArray);
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  const addReminder = async (reminder) => {
    const remindersRef = ref(db, "reminders/");
    const newReminderRef = push(remindersRef);
    await set(newReminderRef, reminder);
  };

  const deleteReminder = async (id, notificationId) => {
    console.log(
      `Deleting reminder with ID: ${id} and Notification ID: ${notificationId}`
    );
    const reminderRef = ref(db, `reminders/${id}`);
    await remove(reminderRef);
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    setReminders(reminders.filter((reminder) => reminder.id !== id));
    Alert.alert("Reminder Deleted", `The reminder has been deleted.`, [
      { text: "OK" },
    ]);
  };

  const handlePickerChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(false);
    setDate(currentDate);

    if (isDatePicker) {
      setIsDatePicker(false);
      setShowPicker(true);
    }
  };

  const showDateTimePicker = () => {
    setIsDatePicker(true);
    setShowPicker(true);
  };

  const scheduleNotification = async () => {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: description,
      },
      trigger: {
        date: date,
      },
    });
    console.log("Notification scheduled with ID:", notificationId);
    return notificationId;
  };

  const handleSetReminder = async () => {
    if (!title || !description) {
      Alert.alert("Error", "Title and Description cannot be empty.", [
        { text: "OK" },
      ]);
      return;
    }

    const notificationId = await scheduleNotification();
    const newReminder = {
      title,
      description,
      date: date.toLocaleString(),
      notificationId,
    };
    await addReminder(newReminder);
    setReminders([
      ...reminders,
      { id: newReminder.notificationId, ...newReminder },
    ]);
    setTitle("");
    setDescription("");
    Alert.alert(
      "Reminder Set",
      `Reminder set for ${title} at ${date.toLocaleString()}`,
      [{ text: "OK" }]
    );
    setModalVisible(false);
  };

  const filteredReminders = reminders.filter((reminder) =>
    reminder.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ImageBackground
      source={require("../assets/background.png")}
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <Text style={styles.header}>Reminders</Text>
        <TextInput
          style={styles.searchBox}
          placeholder="Search your reminders..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <FlatList
          data={filteredReminders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.reminderItem}>
              <View style={styles.reminderContent}>
                <Text style={styles.reminderTitle}>{item.title}</Text>
                <Text style={styles.reminderDescription}>
                  {item.description}
                </Text>
                <Text style={styles.reminderDate}>{item.date}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteReminder(item.id, item.notificationId)}
              >
                <Ionicons name="trash" size={25} color="red" />
              </TouchableOpacity>
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
              <Text style={styles.modalHeader}>New Reminder</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Title"
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={styles.modalInput1}
                placeholder="Set a description..."
                value={description}
                onChangeText={setDescription}
              />
              <TouchableOpacity
                style={styles.button}
                onPress={showDateTimePicker}
              >
                <Text style={styles.buttonText}>Pick Date and Time</Text>
              </TouchableOpacity>
              {showPicker && (
                <DateTimePicker
                  value={date}
                  mode={isDatePicker ? "date" : "time"}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handlePickerChange}
                />
              )}
              <TouchableOpacity
                style={styles.button}
                onPress={handleSetReminder}
              >
                <Text style={styles.buttonText}>Set Reminder</Text>
              </TouchableOpacity>
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
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#10537a",
    marginTop: 50,
    marginBottom: 20,
  },
  searchBox: {
    borderColor: "#E0E0E0",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  reminderItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  reminderDescription: {
    fontSize: 16,
    color: "#555",
  },
  reminderDate: {
    fontSize: 14,
    color: "#888",
  },
  deleteButton: {
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
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
    justifyContent: "center",
  },
  modalHeader: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#10537a",
    marginBottom: 20,
  },
  modalInput: {
    borderColor: "#E0E0E0",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  modalInput1: {
    borderColor: "#E0E0E0",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    paddingBottom: 150,
    marginBottom: 50,
    backgroundColor: "#fff",
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
});
