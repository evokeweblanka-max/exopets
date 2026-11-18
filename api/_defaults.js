export const defaultContent = {
  business: {
    name: "EXOPETS COLOMBO",
    tagline: "The right bird. The right home.",
    description: "Live exotic parrots, hand-tamed companions, DNA-tested pairs and responsible rehoming in Colombo.",
    phone: "076 833 1143",
    landline: "011 272 2418",
    whatsapp: "94768331143",
    address: "218B Hill Street, Dehiwala",
    email: "hello@exopetscolombo.com",
    hours: "Call or WhatsApp before visiting"
  },
  birds: [
    { id: "african-grey", name: "African Grey", short: "Intelligent, social and highly engaging", saleType: "Hand-tamed birds · availability varies", dnaStatus: "DNA testing available", experience: ["some", "experienced"], time: "high", noise: "medium", home: ["apartment", "house"], sprite: 0, featured: true, available: true, size: "≈ 33 cm", weight: "≈ 400 g", temperament: "Intelligent, social", lifespan: "40–60 years", food: "Complete pellets, vegetables and limited fruit", enrichment: "Daily foraging, training and rotating safe toys" },
    { id: "cockatoo", name: "Cockatoo", short: "Affectionate, expressive and people-focused", saleType: "Companion parrots · enquire for availability", dnaStatus: "DNA testing available", experience: ["experienced"], time: "high", noise: "high", home: ["house"], sprite: 1, featured: true, available: true, size: "45–55 cm", weight: "500–900 g", temperament: "Affectionate, expressive", lifespan: "40–70 years", food: "Balanced pellets, greens and limited seeds", enrichment: "Daily interaction, puzzles and safe chewing" },
    { id: "sun-conure", name: "Sun Conure", short: "Playful, affectionate and full of character", saleType: "Singles and DNA-confirmed pairs", dnaStatus: "DNA testing available", experience: ["some", "experienced"], time: "medium", noise: "high", home: ["house"], sprite: 2, featured: true, available: true, size: "30 cm", weight: "100–120 g", temperament: "Playful, affectionate", lifespan: "20–30 years", food: "Pellets, vegetables and small fruit portions", enrichment: "Climbing, supervised play and foraging" },
    { id: "cockatiel", name: "Cockatiel", short: "Friendly, adaptable and a great companion", saleType: "Chicks and companion birds", dnaStatus: "DNA testing available", experience: ["new", "some", "experienced"], time: "medium", noise: "low", home: ["apartment", "house"], sprite: 3, featured: true, available: true, size: "30–33 cm", weight: "80–120 g", temperament: "Gentle, social", lifespan: "15–25 years", food: "Pellets, leafy greens and measured seeds", enrichment: "Whistling, gentle training and toys" },
    { id: "chick", name: "Hand-raised Chicks", short: "Young birds placed with careful guidance", saleType: "Species and availability change regularly", dnaStatus: "DNA testing available", experience: ["some", "experienced"], time: "high", noise: "medium", home: ["apartment", "house"], sprite: 4, featured: true, available: false, size: "Varies", weight: "Varies", temperament: "Developing", lifespan: "Species dependent", food: "Species and age-specific nutrition", enrichment: "Gentle socialisation and safe exploration" }
  ],
  guides: [
    { id: "african-grey-care", birdId: "african-grey", title: "African Grey Care Guide", intro: "Essential care, diet and enrichment for a healthy, happy African Grey.", sections: [
      { title: "Diet", body: "Build the daily diet around quality formulated pellets, fresh leafy vegetables and measured fruit. Avoid avocado, chocolate, caffeine, alcohol and heavily salted foods." },
      { title: "Enrichment", body: "African Greys need daily mental work. Rotate safe destructible toys, teach simple cues and use foraging activities instead of leaving food only in an open bowl." },
      { title: "Social care", body: "Create a predictable routine with several calm interaction periods each day. Reward independent play so the bird does not become dependent on one person." },
      { title: "Health", body: "Arrange an avian-vet wellness examination after arrival and continue regular check-ups. Changes in weight, droppings, appetite, voice or posture need prompt attention." }
    ]},
    { id: "cockatoo-care", birdId: "cockatoo", title: "Cockatoo Care Guide", intro: "Daily structure, nutrition and enrichment for an active, people-focused cockatoo.", sections: [
      { title: "Diet", body: "Use a quality formulated pellet as the foundation, supported by leafy greens, vegetables and measured fruit. Nuts and seeds are best kept as small training rewards rather than the main diet." },
      { title: "Social care", body: "Cockatoos need predictable daily interaction as well as practice playing independently. Calm routines and reward-based training help prevent over-dependence on one person." },
      { title: "Enrichment", body: "Provide safe wood, cardboard and natural materials for chewing and shredding. Rotate foraging toys regularly and allow supervised exercise outside the cage every day." },
      { title: "Health and housing", body: "Choose the largest practical secure cage and keep it away from cooking fumes, smoke, aerosols and direct drafts. Arrange routine care with an avian veterinarian and act promptly on changes in appetite, weight, droppings or behaviour." }
    ]},
    { id: "sun-conure-care", birdId: "sun-conure", title: "Sun Conure Care Guide", intro: "Practical care for a social, playful and naturally vocal Sun Conure.", sections: [
      { title: "Diet", body: "Base the diet on quality pellets with varied vegetables, leafy greens and small fruit portions. Avoid avocado, chocolate, caffeine, alcohol and heavily salted or sugary foods." },
      { title: "Social needs", body: "Plan several positive interaction periods each day while also encouraging independent play. Sun Conures are naturally vocal, so teach calm routines rather than punishing normal calls." },
      { title: "Enrichment", body: "Offer climbing opportunities, swings, safe chewing materials and simple foraging puzzles. Supervised out-of-cage time supports exercise, confidence and healthy behaviour." },
      { title: "Sleep and health", body: "Provide a quiet, dark and consistent sleep period of around 10–12 hours. Monitor weight and droppings, and consult an avian veterinarian if appetite, breathing, posture or activity changes." }
    ]},
    { id: "cockatiel-care", birdId: "cockatiel", title: "Cockatiel Care Guide", intro: "A practical foundation for cockatiel nutrition, housing and companionship.", sections: [
      { title: "Daily care", body: "Refresh drinking water at least once daily, remove spoiled fresh food promptly and maintain a calm sleep routine of 10–12 hours." },
      { title: "Housing", body: "Use the widest practical cage with varied natural perches. Keep the cage away from cooking fumes, aerosols, smoke and direct air-conditioner drafts." },
      { title: "Enrichment", body: "Offer shredding toys, safe swings and short positive training sessions. Supervised time outside the cage supports exercise and confidence." }
    ]},
    { id: "hand-raised-chicks-care", birdId: "chick", title: "Hand-raised Chicks Care Guide", intro: "A responsible start for young parrots moving into their new homes.", sections: [
      { title: "Ready for home", body: "A young parrot should be fully weaned, eating independently and in stable health before rehoming. Buyers should not be expected to complete hand-feeding without specialist experience and veterinary guidance." },
      { title: "Nutrition", body: "Continue the familiar species- and age-appropriate diet at first. Make any change gradually while monitoring appetite and body weight, and ask an avian veterinarian for individual feeding advice." },
      { title: "Settling in", body: "Keep the first days quiet and predictable. Allow the bird to approach at its own pace, use gentle reward-based handling and provide secure perches at comfortable heights." },
      { title: "Safety and health", body: "Remove open water, unsafe plants, fumes, ceiling-fan risks and accessible electrical cables. Arrange an avian-vet examination after arrival and seek prompt help for weakness, poor appetite, breathing changes or abnormal droppings." }
    ]},
    { id: "new-bird-checklist", birdId: "all", title: "New Bird Home Checklist", intro: "Prepare the cage, food, routine and safety plan before your bird comes home.", sections: [
      { title: "Before arrival", body: "Position the cage, choose an avian veterinarian, prepare the normal diet and remove household hazards before collecting your bird." },
      { title: "First week", body: "Keep handling gentle and optional. Maintain the familiar diet while the bird settles, and monitor body weight and droppings every day." }
    ]}
  ],
  products: [
    { id: "premium-pellets", name: "Premium Daily Pellets", category: "Food", price: 3250, description: "Balanced everyday nutrition for medium parrots.", sprite: 0, active: true, relatedBirds: ["african-grey", "cockatiel", "sun-conure"] },
    { id: "foraging-toy", name: "Natural Foraging Toy", category: "Enrichment", price: 1750, description: "Wood, rope and natural textures for active play.", sprite: 1, active: true, relatedBirds: ["african-grey", "cockatoo", "sun-conure"] },
    { id: "feather-support", name: "Avian Mineral Support", category: "Supplements", price: 4200, description: "Use only when advised for your bird’s individual diet.", sprite: 2, active: true, relatedBirds: ["african-grey", "cockatiel", "sun-conure", "cockatoo"] }
  ],
  matcher: {
    questions: [
      { id: "experience", title: "Your experience with birds?", options: [{ value: "new", label: "New to bird keeping" }, { value: "some", label: "Some experience" }, { value: "experienced", label: "Experienced bird keeper" }] },
      { id: "time", title: "How much daily interaction time?", options: [{ value: "low", label: "Under 1 hour" }, { value: "medium", label: "1–3 hours" }, { value: "high", label: "3+ hours" }] },
      { id: "noise", title: "Your comfort with noise?", options: [{ value: "low", label: "Prefer quieter birds" }, { value: "medium", label: "Moderate sound is fine" }, { value: "high", label: "Lively and vocal is fine" }] },
      { id: "home", title: "What type of home?", options: [{ value: "apartment", label: "Apartment / close neighbours" }, { value: "house", label: "House / more space" }] }
    ]
  }
};
