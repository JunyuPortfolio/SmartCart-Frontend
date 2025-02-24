import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = Constants.expoConfig?.extra?.API_URL || "https://your-api-endpoint.com";

export default function RecipeDetail() {
  const params = useLocalSearchParams();
  const recipe_id = params.recipe_id;
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRecipeDetails = async () => {
      try {
        if (!recipe_id) {
          Alert.alert("Error", "No recipe ID provided.");
          return;
        }

        const authToken = await AsyncStorage.getItem("authToken");
        if (!authToken) {
          Alert.alert("Error", "Authentication required. Please log in.");
          router.push("/"); // Redirect to login if token is missing
          return;
        }

        const response = await fetch(`${API_URL}/recipedetail/${recipe_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("🚨 API Error Response:", errorText);
          Alert.alert("Error", `Failed to fetch recipe: ${response.status}`);
          return;
        }

        const data = await response.json();
        setRecipe(data);
      } catch (error) {
        console.error("🚨 Error fetching recipe details:", error);
        Alert.alert("Error", "Failed to load recipe details. Please try again.");
      }
      setLoading(false);
    };

    fetchRecipeDetails();
  }, [recipe_id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Recipe not found.</Text>
      </View>
    );
  }

  // ✅ Ensure default values to prevent crashes
  const ingredients = recipe.extendedIngredients || [];
  const instructions = recipe.analyzedInstructions?.[0]?.steps || [];

  return (
    <ScrollView style={styles.container}>
      {/* Recipe Image & Title */}
      <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
      <Text style={styles.recipeTitle}>{recipe.title}</Text>

      {/* Meta Info */}
      <Text style={styles.metaText}>❤️ {recipe.aggregateLikes} Likes</Text>
      <Text style={styles.metaText}>⏳ {recipe.readyInMinutes} minutes</Text>
      <Text style={styles.metaText}>🍽 {recipe.servings} servings</Text>

      {/* Ingredients List */}
      <Text style={styles.sectionTitle}>Ingredients</Text>
      <FlatList
        data={ingredients}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : `ingredient-${index}`)}
        scrollEnabled={false} // Prevents nested scroll issues
        renderItem={({ item }) => (
          <View style={styles.ingredientItem}>
            <Image source={{ uri: `https://spoonacular.com/cdn/ingredients_100x100/${item.image}` }} style={styles.ingredientImage} />
            <Text style={styles.ingredientText}>{item.original}</Text>
          </View>
        )}
      />

      {/* Step-by-Step Instructions */}
      <Text style={styles.sectionTitle}>Instructions</Text>
      {instructions.length > 0 ? (
  instructions.map((step, index) => (
    <View key={`step-${index}`} style={styles.stepContainer}>
      <Text style={styles.stepNumber}>Step {step.number}</Text>
      <Text style={styles.stepText}>{step.step}</Text>

      <View style={styles.stepImagesContainer}>
        {step.equipment?.length > 0 ? (
          step.equipment.map((equipment, eqIndex) => (
            <Image key={`equipment-${index}-${eqIndex}`} source={{ uri: equipment.image }} style={styles.stepImage} />
          ))
        ) : null}
      </View>
    </View>
  ))
) : (
  <Text style={styles.noInstructionsText}>No instructions available.</Text>
)}

    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F3E6",
    padding: 15,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "red",
  },
  recipeImage: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    marginBottom: 10,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  metaText: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ingredientImage: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 10,
  },
  ingredientText: {
    fontSize: 16,
  },
  stepContainer: {
    marginBottom: 15,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: "bold",
  },
  stepText: {
    fontSize: 16,
    marginTop: 5,
  },
  stepImagesContainer: {
    flexDirection: "row",
    marginTop: 5,
  },
  stepImage: {
    width: 50,
    height: 50,
    marginRight: 5,
  },
  noInstructionsText: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    color: "#777",
  },
});

