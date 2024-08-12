import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth, db } from "../config";
import { ref, get, update } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileSettingsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    birthday: "",
    bloodGroup: "",
    address: "",
    emergencyContact: "",
    medicalConditions: "",
    prescribedMedications: "",
    medicalDevices: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [role, setRole] = useState("");

  useEffect(() => {
    const getRole = async () => {
      const storedRole = await AsyncStorage.getItem("userRole");
      setRole(storedRole);
    };

    getRole(); // Get the user role from AsyncStorage
  }, []);

  useEffect(() => {
    const fetchProfileData = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        try {
          const userProfileRef = ref(db, `users/${userId}/profile`);
          const snapshot = await get(userProfileRef);
          if (snapshot.exists()) {
            const data = snapshot.val();
            setProfileData({
              name: data.question_1 || "",
              email: auth.currentUser?.email || "",
              birthday: data.question_2 || "",
              bloodGroup: data.question_3 || "",
              address: data.question_4 || "",
              emergencyContact: data.question_5 || "",
              medicalConditions: data.question_6 || "",
              prescribedMedications: data.question_7 || "",
              medicalDevices: data.question_8 || "",
            });
          } else {
            console.log("No profile data found.");
          }
        } catch (error) {
          console.error("Error fetching profile data", error);
        }
      }
      setLoading(false);
    };

    fetchProfileData();
  }, []);

  async function handleSignOut() {
    setLoading(true);

    try {
      await signOut(auth);
      navigation.navigate("Login");
    } catch (error) {
      console.error("Error signing out", error);
    }

    setLoading(false);
  }

  const handleSave = async () => {
    setLoading(true);
    const userId = auth.currentUser?.uid;
    if (userId) {
      try {
        const updates = {
          question_1: profileData.name,
          question_2: profileData.birthday,
          question_3: profileData.bloodGroup,
          question_4: profileData.address,
          question_5: profileData.emergencyContact,
          question_6: profileData.medicalConditions,
          question_7: profileData.prescribedMedications,
          question_8: profileData.medicalDevices,
        };
        await update(ref(db, `users/${userId}/profile`), updates);
        Alert.alert("Profile updated successfully");
        setEditMode(false);
      } catch (error) {
        console.error("Error updating profile data", error);
        Alert.alert("Error updating profile data");
      }
    }
    setLoading(false);
  };

  function calculateAge(birthday) {
    const [month, day, year] = birthday.split("/");
    const formattedBirthday = `${year}-${month}-${day}`;

    const birthDate = new Date(formattedBirthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.initialInfo}>
        <View style={styles.profilePicCover}>
          <Text style={styles.profilePicLetter}>
            {profileData.name[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.initialInfoTextCover}>
          {editMode ? (
            <TextInput
              style={styles.nameDisplayInput}
              value={profileData.name}
              onChangeText={(text) =>
                setProfileData({ ...profileData, name: text })
              }
            />
          ) : (
            <Text style={styles.nameDisplay}>{profileData.name}</Text>
          )}

          <Text style={styles.lesserInfo}>{profileData.email}</Text>
          <Text style={styles.lesserInfo}>
            Logged in as: {role[0].toUpperCase() + role.slice(1)}
          </Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Info</Text>
        <View style={styles.profileContainer}>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Address:</Text>
            {editMode ? (
              <TextInput
                style={styles.profileInput}
                value={profileData.address}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, address: text })
                }
              />
            ) : (
              <Text style={styles.profileValue}>{profileData.address}</Text>
            )}
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Emergency Contact:</Text>
            {editMode ? (
              <TextInput
                style={styles.profileInput}
                value={profileData.emergencyContact}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, emergencyContact: text })
                }
              />
            ) : (
              <Text style={styles.profileValue}>
                {profileData.emergencyContact}
              </Text>
            )}
          </View>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Info</Text>
        <View style={styles.profileContainer}>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Birthday:</Text>
            {editMode ? (
              <TextInput
                style={styles.profileInput}
                value={profileData.birthday}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, birthday: text })
                }
              />
            ) : (
              <Text style={styles.profileValue}>{profileData.birthday}</Text>
            )}
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Age:</Text>
            <Text style={styles.profileValue}>
              {calculateAge(profileData.birthday)}
            </Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Blood Group:</Text>
            {editMode ? (
              <TextInput
                style={styles.profileInput}
                value={profileData.bloodGroup}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, bloodGroup: text })
                }
              />
            ) : (
              <Text style={styles.profileValue}>{profileData.bloodGroup}</Text>
            )}
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Medical Conditions:</Text>
            {editMode ? (
              <TextInput
                style={styles.profileInput}
                value={profileData.medicalConditions}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, medicalConditions: text })
                }
              />
            ) : (
              <Text style={styles.profileValue}>
                {profileData.medicalConditions}
              </Text>
            )}
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Prescribed Medications:</Text>
            {editMode ? (
              <TextInput
                style={styles.profileInput}
                value={profileData.prescribedMedications}
                onChangeText={(text) =>
                  setProfileData({
                    ...profileData,
                    prescribedMedications: text,
                  })
                }
              />
            ) : (
              <Text style={styles.profileValue}>
                {profileData.prescribedMedications}
              </Text>
            )}
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Medical Devices:</Text>
            {editMode ? (
              <TextInput
                style={styles.profileInput}
                value={profileData.medicalDevices}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, medicalDevices: text })
                }
              />
            ) : (
              <Text style={styles.profileValue}>
                {profileData.medicalDevices}
              </Text>
            )}
          </View>
        </View>
      </View>
      {editMode ? (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditMode(true)}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
      )}
      <Pressable style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
    padding: 20,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
    padding: 20,
  },
  initialInfo: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 60,
  },
  profilePicCover: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  profilePicLetter: {
    color: "#FFF",
    fontSize: 64,
    fontWeight: "700",
  },
  initialInfoTextCover: {
    display: "flex",
    alignItems: "center",
  },
  nameDisplayInput: {
    fontSize: 32,
    fontWeight: "700",

    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 5,
    width: "60%",
  },
  nameDisplay: {
    fontSize: 32,
    fontWeight: "700",
  },
  lesserInfo: {
    color: "#989898",
    fontSize: 13,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  section: {
    width: "100%",
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 30,
  },
  profileContainer: {
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  profileLabel: {
    fontSize: 16,
    fontWeight: "bold",
    width: "40%",
  },
  profileValue: {
    fontSize: 16,
    width: "60%",
  },
  profileInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 5,
    width: "60%",
  },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 10,
    width: "100%",
  },
  editButton: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 10,
    width: "100%",
  },
  logoutButton: {
    backgroundColor: "#FF0000",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 10,
    width: "100%",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
