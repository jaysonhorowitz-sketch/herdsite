// Animal assigned based on the user's top category interests.
// Categories: Executive Power, Rule of Law, Economy, Civil Rights, Elections,
// National Security, Healthcare, Environment, Education, Science,
// Immigration, Democracy & Media, Foreign Policy, Human Rights

const ANIMAL_MAP = [
  // Single dominant category
  { match: ["Healthcare"],                                       animal: "Bear",          emoji: "🐻", desc: "Protective and fierce — you fight for the health of your community." },
  { match: ["Economy"],                                          animal: "Bull",          emoji: "🐂", desc: "Charging forward — you know the power of economic momentum." },
  { match: ["Environment"],                                      animal: "Wolf",          emoji: "🐺", desc: "Pack-minded and wild — you protect what matters most." },
  { match: ["Civil Rights"],                                     animal: "Lion",          emoji: "🦁", desc: "Courageous and unwavering — you stand up for everyone." },
  { match: ["Elections"],                                        animal: "Bee",           emoji: "🐝", desc: "Community-minded and decisive — democracy runs on people like you." },
  { match: ["National Security"],                                animal: "Eagle",         emoji: "🦅", desc: "Sharp-eyed and vigilant — you see threats others miss." },
  { match: ["Immigration"],                                      animal: "Crane",         emoji: "🦢", desc: "Graceful and determined — you believe in the journey." },
  { match: ["Education"],                                        animal: "Owl",           emoji: "🦉", desc: "Wise and curious — knowledge is your superpower." },
  { match: ["Science"],                                          animal: "Fox",           emoji: "🦊", desc: "Sharp and inquisitive — you follow the evidence wherever it leads." },
  { match: ["Rule of Law"],                                      animal: "Bison",         emoji: "🦬", desc: "Steadfast and grounded — you hold the line." },
  { match: ["Executive Power"],                                  animal: "Hawk",          emoji: "🦆", desc: "Watchful and bold — you keep power in check." },
  { match: ["Democracy & Media"],                                animal: "Parrot",        emoji: "🦜", desc: "Vocal and colorful — you make sure the truth gets heard." },
  { match: ["Foreign Policy"],                                   animal: "Flamingo",      emoji: "🦩", desc: "Far-ranging and cosmopolitan — you see the bigger picture." },
  { match: ["Human Rights"],                                     animal: "Dove",          emoji: "🕊️", desc: "Principled and unwavering — you hold the line for human dignity." },

  // Two-category combos
  { match: ["Healthcare", "Civil Rights"],                       animal: "Elephant",      emoji: "🐘", desc: "Never forgets — you carry the weight of justice and care." },
  { match: ["Economy", "Rule of Law"],                           animal: "Rhino",         emoji: "🦏", desc: "Thick-skinned and powerful — you push through with integrity." },
  { match: ["Environment", "Education"],                         animal: "Dolphin",       emoji: "🐬", desc: "Intelligent and playful — you learn your way to a better world." },
  { match: ["National Security", "Executive Power"],             animal: "Falcon",        emoji: "🦅", desc: "Precise and disciplined — you never take your eye off the target." },
  { match: ["Immigration", "Civil Rights"],                      animal: "Hummingbird",   emoji: "🐦", desc: "Small but mighty — you move fast and fight for belonging." },
  { match: ["Democracy & Media", "Rule of Law"],                 animal: "Raven",         emoji: "🐦‍⬛", desc: "Clever and perceptive — you see through the noise." },
  { match: ["Economy", "Education"],                             animal: "Beaver",        emoji: "🦫", desc: "Industrious and smart — you build things that last." },
  { match: ["Foreign Policy", "National Security"],              animal: "Penguin",       emoji: "🐧", desc: "Coordinated and relentless — you navigate hostile terrain with precision." },
  { match: ["Human Rights", "Civil Rights"],                     animal: "Jaguar",        emoji: "🐆", desc: "Fierce and uncompromising — you fight for dignity without hesitation." },
  { match: ["Healthcare", "Environment"],                        animal: "Sea Turtle",    emoji: "🐢", desc: "Ancient and resilient — you protect life in all its forms." },
  { match: ["Executive Power", "Rule of Law"],                   animal: "Gorilla",       emoji: "🦍", desc: "Powerful but principled — you demand accountability." },
  { match: ["National Security", "Immigration"],                 animal: "Husky",         emoji: "🐕", desc: "Loyal and tireless — you navigate difficult terrain without hesitation." },
]

// Fallback
const DEFAULT_ANIMAL = { animal: "Deer", emoji: "🦌", desc: "Gentle and aware — you take it all in before you act." }

/**
 * Given an array of category strings, return the best matching animal.
 * Prefers multi-category matches, falls back to single, then default.
 */
export function getAnimal(categories = []) {
  if (!categories || categories.length === 0) return DEFAULT_ANIMAL

  // Try multi-category matches first (longer match = more specific)
  const sorted = [...ANIMAL_MAP].sort((a, b) => b.match.length - a.match.length)

  for (const entry of sorted) {
    const matched = entry.match.every(c => categories.includes(c))
    if (matched) return entry
  }

  return DEFAULT_ANIMAL
}

export { ANIMAL_MAP, DEFAULT_ANIMAL }
