import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";

import HomeScreen from "../screens/HomeScreen";
import LocationScreen from "../screens/LocationScreen";
import RemindersScreen from "../screens/RemindersScreen";
import LogInfoScreen from "../screens/LogInfoScreen";

const Tab = createBottomTabNavigator();

function BottomTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Location") {
            iconName = "location";
          } else if (route.name === "Reminders") {
            iconName = "notifications";
          } else if (route.name === "Logs") {
            iconName = "search";
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#183981",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Logs"
        component={LogInfoScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Location"
        component={LocationScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

export default BottomTabsNavigator;
