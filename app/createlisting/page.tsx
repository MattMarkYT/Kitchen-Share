'use client';
import { useState, useRef } from "react";
import styles from "./create.module.css";

const CATEGORIES = ["Meals", "Baked Goods", "Snacks", "Drinks", "Desserts", "Other"];

const SUBCATEGORIES: Record<string, string[]> = {
    Meals: ["Breakfast", "Lunch", "Dinner", "Soup", "Salad"],
    "Baked Goods": ["Bread", "Muffins", "Cookies", "Cakes"],
    Snacks: ["Chips", "Nuts", "Fruit", "Dips"],
    Drinks: ["Smoothies", "Juices", "Tea", "Coffee"],
    Desserts: ["Ice Cream", "Pudding", "Pastry"],
    Other: ["Other"],
};

const ALLERGY_OPTIONS = ["Gluten", "Dairy", "Nuts", "Eggs", "Soy", "Shellfish", "Fish", "Wheat"];

export default function CreateListing() {
    const [preview, setPreview] = useState<string | null>(null);
    const [price, setPrice] = useState("");
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [subcat, setSubcat] = useState("");
    const [ingredients, setIngredients] = useState("");
    const [description, setDescription] = useState("");
    const [allergies, setAllergies] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) setPreview(URL.createObjectURL(file));
    }

    function handleRemovePhoto() {
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
        setCategory(e.target.value);
        setSubcat("");
    }

    function toggleAllergy(tag: string) {
        setAllergies(prev =>
            prev.includes(tag) ? prev.filter(a => a !== tag) : [...prev, tag]
        );
    }

    function handleSubmit() {
        // TODO: wire up to PocketBase
        alert("Submit coming soon!");
    }

    return (
        <main>
            <div className={styles.container}>
                <h1 className={styles.heading}>Create a listing</h1>

                {/* Photo upload */}
                <div className={styles.fieldWrap}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleImage}
                    />
                    <div
                        className={`${styles.uploadZone} ${preview ? styles.uploadZonePreview : ""}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {preview ? (
                            <img src={preview} className={styles.previewImage} alt="Preview" />
                        ) : (
                            <div className={styles.uploadPlaceholder}>
                                <div className={styles.uploadIcon}>📷</div>
                                <div className={styles.uploadText}>Upload photo</div>
                            </div>
                        )}
                    </div>
                    {preview && (
                        <button className={styles.removePhoto} onClick={handleRemovePhoto}>
                            Remove photo
                        </button>
                    )}
                </div>

                {/* Price */}
                <div className={styles.fieldWrap}>
                    <label className={styles.label}>Price ($)</label>
                    <input
                        className={styles.input}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                    />
                </div>

                {/* Title */}
                <div className={styles.fieldWrap}>
                    <label className={styles.label}>Title</label>
                    <input
                        className={styles.input}
                        type="text"
                        placeholder="e.g. Homemade lasagna"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </div>

                {/* Category */}
                <div className={styles.fieldWrap}>
                    <label className={styles.label}>Category</label>
                    <select className={styles.input} value={category} onChange={handleCategoryChange}>
                        <option value="">Select a category</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Subcategory */}
                <div className={styles.fieldWrap}>
                    <label className={styles.label}>
                        Subcategory <span className={styles.optional}>(optional)</span>
                    </label>
                    <select
                        className={styles.input}
                        value={subcat}
                        onChange={e => setSubcat(e.target.value)}
                        disabled={!category}
                    >
                        <option value="">{category ? "Select subcategory" : "Pick a category first"}</option>
                        {category && SUBCATEGORIES[category]?.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* Ingredients */}
                <div className={styles.fieldWrap}>
                    <label className={styles.label}>Ingredients</label>
                    <textarea
                        className={`${styles.input} ${styles.textarea}`}
                        placeholder="e.g. flour, eggs, butter, sugar..."
                        value={ingredients}
                        onChange={e => setIngredients(e.target.value)}
                        rows={3}
                    />
                </div>

                {/* Description */}
                <div className={styles.fieldWrap}>
                    <label className={styles.label}>Description</label>
                    <textarea
                        className={`${styles.input} ${styles.textarea}`}
                        placeholder="Tell buyers about your food..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={4}
                    />
                </div>

                {/* Allergy tags */}
                <div className={styles.fieldWrap}>
                    <label className={styles.label}>Allergy tags</label>
                    <div className={styles.allergyGrid}>
                        {ALLERGY_OPTIONS.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => toggleAllergy(tag)}
                                className={`${styles.allergyTag} ${allergies.includes(tag) ? styles.allergyTagSelected : ""}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <button className={styles.submitBtn} onClick={handleSubmit}>
                    Post listing
                </button>
            </div>
        </main>
    );
}
