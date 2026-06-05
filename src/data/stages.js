export const STAGES = [
  {
    id: 1,
    layer: "LAYER I",
    title: "The Gilded Gate",
    subtitle: "Vault Entry Protocol",
    description:
      "The first seal of the vault. Only those who observe carefully may pass. Every detail hides a secret.",
    type: "riddle",
    question:
      "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. The richer you are, the louder I roar. What am I?",
    answer: "echo",
    hints: [
      "Think about mountains and valleys...",
      "You hear me in empty rooms and caves.",
      "The answer is a single word. It repeats what you say.",
    ],
    image: null,
    backgroundGlyph: "◈",
  },
  {
    id: 2,
    layer: "LAYER II",
    title: "The Cipher Room",
    subtitle: "Logic Decryption",
    description:
      "The vault's second seal requires logical thinking. Decode the pattern to proceed.",
    type: "logic",
    question:
      "A man walks into a vault. He sees 3 doors: GOLD, SILVER, BRONZE. Behind GOLD is a lion that hasn't eaten in 3 years. Behind SILVER is a deadly laser trap. Behind BRONZE is an exit. But the exit sign says: 'Take the door whose name has the most letters.' Which door does he take?",
    answer: "bronze",
    hints: [
      "Count the letters in each door name carefully.",
      "GOLD=4, SILVER=6, BRONZE=6... wait, count again.",
      "BRONZE has 6 letters. SILVER has 6 letters. But the lion behind GOLD hasn't eaten in 3 years — it's DEAD. And the exit says most letters... BRONZE = 6, tied with SILVER. But only BRONZE is the exit.",
    ],
    image: null,
    backgroundGlyph: "⬡",
  },
  {
    id: 3,
    layer: "LAYER III",
    title: "The Obsidian Archive",
    subtitle: "Hidden Knowledge",
    description:
      "Deep in the vault lies hidden knowledge. The answer is all around you — if you know where to look.",
    type: "observation",
    question:
      "I am always in front of you but cannot be seen. I am always coming but never arrive. Travelers chase me. Clocks measure me. The dead have too much of me. The living never have enough. What am I?",
    answer: "future",
    hints: [
      "Think about what clocks point toward...",
      "You plan for it, but you never truly reach it.",
      "Yesterday is past, today is now, tomorrow is the...",
    ],
    image: null,
    backgroundGlyph: "∞",
  },
  {
    id: 4,
    layer: "LAYER IV",
    title: "The Nexus Core",
    subtitle: "Pattern Recognition",
    description:
      "The vault's intelligence tests your ability to see what others miss. Find the hidden pattern.",
    type: "pattern",
    question:
      "Complete the sequence: 1, 1, 2, 3, 5, 8, 13, 21, ___\n\nThis ancient sequence appears in nautilus shells, sunflower seeds, and the spiral of galaxies. What is the next number?",
    answer: "34",
    hints: [
      "Each number is the sum of the two before it.",
      "13 + 21 = ?",
      "The answer is thirty-four.",
    ],
    image: null,
    backgroundGlyph: "Φ",
  },
  {
    id: 5,
    layer: "LAYER V",
    title: "The Golden Sanctum",
    subtitle: "Final Seal",
    description:
      "You stand at the final threshold. One last riddle guards the greatest treasure. Think carefully — this is the master key.",
    type: "riddle",
    question:
      "The person who makes it, sells it.\nThe person who buys it, never uses it.\nThe person who uses it, never knows they're using it.\n\nWhat is it?",
    answer: "coffin",
    hints: [
      "Think about who buys things for others after they're gone...",
      "The user of this object is unconscious.",
      "It is a wooden box used in funerals.",
    ],
    image: null,
    backgroundGlyph: "⚜",
  },
];

export const ADMIN_CREDENTIALS = {
  username: "ignitia_admin",
  password: "nexus@2024",
};
