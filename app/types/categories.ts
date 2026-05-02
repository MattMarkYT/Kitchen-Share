
export const CATEGORY_OPTIONS: { value: string; label: string; emoji: string }[] = [
    { value: "pizza",       label: "Pizza",        emoji: "🍕" },
    { value: "burgers",     label: "Burgers",      emoji: "🍔" },
    { value: "bbq",         label: "BBQ",          emoji: "🍖" },
    { value: "tacos",       label: "Tacos",        emoji: "🌮" },
    { value: "sandwiches",  label: "Sandwiches",   emoji: "🥪" },
    { value: "pasta",       label: "Pasta",        emoji: "🍝" },
    { value: "seafood",     label: "Seafood",      emoji: "🦞" },
    { value: "salads",      label: "Salads",       emoji: "🥗" },
    { value: "breakfast",   label: "Breakfast",    emoji: "🍳" },
    { value: "desserts",    label: "Desserts",     emoji: "🍰" },
    { value: "drinks",      label: "Drinks",       emoji: "🧃" },
    { value: "vegan",       label: "Vegan",        emoji: "🥦" },
    { value: "comfort",     label: "Comfort Food", emoji: "🍲" },
    { value: "other",       label: "Other",        emoji: "🍽️" },
];

export const CATEGORIES = CATEGORY_OPTIONS.map(c => c.value);