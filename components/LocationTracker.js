import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Linking,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";
import { db, auth } from "../config";
import { ref, set, get, push } from "firebase/database";

const LocationTracker = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [address, setAddress] = useState(null);
  const [homeLocation, setHomeLocation] = useState(null);
  const [uneasyLocations, setUneasyLocations] = useState([]);

  const googleapikey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY;

  useEffect(() => {
    fetchHomeLocation();
    fetchUneasyLocations();
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      fetchAddress(location.coords.latitude, location.coords.longitude);

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 0,
        },
        (newLocation) => {
          setLocation(newLocation);
          fetchAddress(
            newLocation.coords.latitude,
            newLocation.coords.longitude
          );
        }
      );
    })();
  }, []);

  const fetchHomeLocation = async () => {
    const userId = auth.currentUser?.uid || "userId";
    const userProfileRef = ref(db, `users/${userId}/profile/question_4`);
    const snapshot = await get(userProfileRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      setHomeLocation(data);
    }
  };

  const fetchAddress = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleapikey}}`
      );
      if (response.data.results.length > 0) {
        setAddress(response.data.results[0].formatted_address);
      } else {
        setAddress("Address not found");
      }
    } catch (error) {
      console.error(error);
      setAddress("Error fetching address");
    }
  };

  const fetchUneasyLocations = async () => {
    const userId = auth.currentUser?.uid || "userId";
    const uneasyRef = ref(db, `users/${userId}/uneasyLocations`);
    const snapshot = await get(uneasyRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const locations = Object.values(data);
      setUneasyLocations(locations);
    }
  };

  const openHomeLocationInMaps = () => {
    if (homeLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${homeLocation}`;
      Linking.openURL(url);
    } else {
      Alert.alert("Home location not available");
    }
  };

  const markAsUneasy = async () => {
    if (location) {
      const userId = auth.currentUser?.uid || "userId";
      const uneasyRef = ref(db, `users/${userId}/uneasyLocations`);
      const newUneasyLocationRef = push(uneasyRef);

      const uneaseData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address,
        timestamp: Date.now(),
      };

      try {
        await set(newUneasyLocationRef, uneaseData);
        Alert.alert("Location marked as uneasy");
        fetchUneasyLocations(); // Fetch updated uneasy locations
      } catch (error) {
        console.error("Error storing data:", error);
        Alert.alert("Error marking location as uneasy");
      }
    } else {
      Alert.alert("Location not available");
    }
  };

  if (errorMsg) {
    return <Text>{errorMsg}</Text>;
  }

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Waiting for location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Location</Text>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        }}
      >
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
        />
        {uneasyLocations.map((loc, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: loc.latitude,
              longitude: loc.longitude,
            }}
            pinColor="red"
            title="Uneasy Location"
            description={loc.address}
          />
        ))}
      </MapView>
      <View style={styles.textContainer}>
        {address && <Text style={styles.text}>Address: {address}</Text>}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={openHomeLocationInMaps}
        >
          <Text style={styles.buttonText}>Distance from Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uneasyButton} onPress={markAsUneasy}>
          <Text style={styles.buttonText}>Mark as Uneasy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#10537a",
    marginTop: 50,
    marginBottom: 20,
  },
  textContainer: {
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center",
  },
  uneasyButton: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#10537a",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LocationTracker;
