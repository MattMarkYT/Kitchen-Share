
export const CATEGORY_OPTIONS: { value: string; label: string }[] = [
    { value: "pizza",       label: "Pizza" },
    { value: "burgers",     label: "Burgers" },
    { value: "bbq",         label: "BBQ" },
    { value: "tacos",       label: "Tacos" },
    { value: "sandwiches",  label: "Sandwiches" },
    { value: "pasta",       label: "Pasta" },
    { value: "seafood",     label: "Seafood" },
    { value: "salads",      label: "Salads" },
    { value: "breakfast",   label: "Breakfast" },
    { value: "desserts",    label: "Desserts" },
    { value: "drinks",      label: "Drinks" },
    { value: "vegan",       label: "Vegan" },
    { value: "comfort",     label: "Comfort Food" },
];

export const CATEGORIES = CATEGORY_OPTIONS.map(c => c.value);