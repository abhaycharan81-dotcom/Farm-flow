// Standard catalogue sellers pick from. Ids double as RTDB keys under
// storeProducts/{storeId}/{id}, so they must be lowercase and contain no . # $ [ ] /
// `emoji` is display-only (it is not saved to the database), so existing products pick it up automatically.
export const catalogue = [
  { id: "apple", name: "Apple", category: "Fruits", unit: "kg", emoji: "🍎" },
  { id: "banana", name: "Banana", category: "Fruits", unit: "dozen", emoji: "🍌" },
  { id: "mango", name: "Mango", category: "Fruits", unit: "kg", emoji: "🥭" },
  { id: "orange", name: "Orange", category: "Fruits", unit: "kg", emoji: "🍊" },
  { id: "grapes", name: "Grapes", category: "Fruits", unit: "kg", emoji: "🍇" },
  { id: "papaya", name: "Papaya", category: "Fruits", unit: "kg", emoji: "🍈" },
  { id: "pomegranate", name: "Pomegranate", category: "Fruits", unit: "kg", emoji: "🍒" },
  { id: "carrot", name: "Carrot", category: "Vegetables", unit: "kg", emoji: "🥕" },
  { id: "tomato", name: "Tomato", category: "Vegetables", unit: "kg", emoji: "🍅" },
  { id: "potato", name: "Potato", category: "Vegetables", unit: "kg", emoji: "🥔" },
  { id: "onion", name: "Onion", category: "Vegetables", unit: "kg", emoji: "🧅" },
  { id: "spinach", name: "Spinach", category: "Vegetables", unit: "bunch", emoji: "🥬" },
  { id: "cauliflower", name: "Cauliflower", category: "Vegetables", unit: "piece", emoji: "🥦" },
  { id: "okra", name: "Okra", category: "Vegetables", unit: "kg", emoji: "🌿" },
];

const byId = Object.fromEntries(catalogue.map((c) => [c.id, c]));

// Emoji for a product id, with a category-based fallback for anything not in the catalogue.
export const emojiOf = (id, category) =>
  byId[id]?.emoji || (category === "Vegetables" ? "🥬" : "🍎");
