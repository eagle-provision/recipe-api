const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Create a new recipe
app.post('/recipes', async (req, res) => {
  const { title, making_time, serves, ingredients, cost } = req.body;
  if (!title || !making_time || !serves || !ingredients || !cost) {
    return res.status(400).json({ message: "Recipe creation failed!", required: "title, making_time, serves, ingredients, cost" });
  }

  try {
    const newRecipeRef = db.collection('recipe_item_DB').doc();
    const newRecipe = {
      id: newRecipeRef.id,
      title,
      making_time,
      serves,
      ingredients,
      cost,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await newRecipeRef.set(newRecipe);
    res.status(200).json({ message: "Recipe successfully created!", recipe: [newRecipe] });
  } catch (error) {
    res.status(500).json({ message: "Error creating recipe", error });
  }
});

// Get all recipes
app.get('/recipes', async (req, res) => {
  try {
    const snapshot = await db.collection('recipe_item_DB').get();
    if (snapshot.empty) {
      return res.status(400).json({ message: "No recipes found!" });
    }
    const recipes = snapshot.docs.map(doc => doc.data());
    res.status(200).json({ message: "Successful!", response: recipes });
  } catch (error) {
    res.status(500).json({ message: "Error fetching recipes", error });
  }
});

// Get a recipe by ID
app.get('/recipes/:id', async (req, res) => {
  try {
    const recipeDoc = db.collection('recipe_item_DB').doc(req.params.id);
    const doc = await recipeDoc.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "No recipe found" });
    }
    res.status(200).json({ message: "Recipe details by id", response: [doc.data()] });
  } catch (error) {
    res.status(500).json({ message: "Error fetching recipe", error });
  }
});

// Update a recipe by ID
app.patch('/recipes/:id', async (req, res) => {
  try {
    const recipeDoc = db.collection('recipe_item_DB').doc(req.params.id);
    const doc = await recipeDoc.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "No recipe found" });
    }

    const updates = req.body;
    updates.updated_at = new Date().toISOString();
    await recipeDoc.update(updates);
    res.status(200).json({ message: "Recipe successfully updated!", response: [updates] });
  } catch (error) {
    res.status(500).json({ message: "Error updating recipe", error });
  }
});

// Delete a recipe by ID
app.delete('/recipes/:id', async (req, res) => {
  try {
    const recipeDoc = db.collection('recipe_item_DB').doc(req.params.id);
    const doc = await recipeDoc.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "No recipe found" });
    }

    await recipeDoc.delete();
    res.status(200).json({ message: "Recipe successfully removed!" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting recipe", error });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));