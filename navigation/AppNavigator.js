import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RegisterScreen from "../screens/RegisterScreen";
import LoginScreen from "../screens/LoginScreen";
import LoadingEntryScreen from "../screens/LoadingEntryScreen";
import ProfileSettingsScreen from "../screens/ProfileSettingsScreen";
import SetupPage from "../screens/SetupPage"; // Import the new screen
import BottomTabsNavigator from "./BottomTabsNavigator";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoadingEntry">
        <Stack.Screen
          name="LoadingEntry"
          component={LoadingEntryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SetupPage" // New setup page route
          component={SetupPage}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HomeTabs"
          component={BottomTabsNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Profile" component={ProfileSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
