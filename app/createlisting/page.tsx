'use client';
import { useState, useRef, useEffect } from "react";
import styles from "./create.module.css";
import pb from "@/app/lib/pb";
import { useRouter } from "next/navigation";

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

type Errors = {
    title?: string;
    price?: string;
    category?: string;
    images?: string;
};

export default function CreateListing() {
    const router = useRouter();

    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [price, setPrice] = useState("");
    const [title, setTitle] = useState("");
    const [location, setLocation] = useState("");
    const [category, setCategory] = useState("");
    const [subcat, setSubcat] = useState("");
    const [ingredients, setIngredients] = useState("");
    const [description, setDescription] = useState("");
    const [allergies, setAllergies] = useState<string[]>([]);
    const [errors, setErrors] = useState<Errors>({});
    const [submitting, setSubmitting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Checks if not logged in, and redirects
    useEffect(() => {
        if (!pb.authStore.isValid) {
            router.push("/auth");
        }
    }, [router]);

    function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        setImages(prev => [...prev, ...files]);
        setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
        setErrors(prev => ({ ...prev, images: undefined }));
    }

    function handleRemoveImage(index: number) {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    }

    function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
        setCategory(e.target.value);
        setSubcat("");
        setErrors(prev => ({ ...prev, category: undefined }));
    }

    function toggleAllergy(tag: string) {
        setAllergies(prev =>
            prev.includes(tag) ? prev.filter(a => a !== tag) : [...prev, tag]
        );
    }

    function validate(): boolean {
        const newErrors: Errors = {};
        if (!title.trim()) newErrors.title = "Title is required.";
        if (!price || isNaN(Number(price)) || Number(price) < 0) newErrors.price = "A valid price is required.";
        if (!category) newErrors.category = "Please select a category.";
        if (images.length === 0) newErrors.images = "Please upload at least one photo.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit() {
        if (!validate()) return;

        setSubmitting(true);
        try {
            const data = new FormData();
            data.append("title", title.trim());
            data.append("price", price);
            data.append("location", location.trim());
            data.append("description", description.trim());
            data.append("category", category);
            data.append("subcategory", subcat);
            data.append("ingredients", ingredients.trim());
            data.append("allergies", allergies.join(", "));
            data.append("seller", pb.authStore.record?.id ?? "");

            // First image → main_image, rest → images
            data.append("main_image", images[0]);
            for (let i = 1; i < images.length; i++) {
                data.append("images", images[i]);
            }

            await pb.collection("listings").create(data);
            router.push("/");
        } catch (err) {
            console.error(err);
            alert("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main>
            <div className={styles.container}>
                <h1 className={styles.heading}>Create a listing</h1>

                {/* Photo upload */}
                <div className={styles.fieldWrap}>
                    <label className={styles.label}>Photos</label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: "none" }}
                        onChange={handleImages}
                    />
                    <div className={styles.previewGrid}>
                        {previews.map((src, i) => (
                            <div key={i} className={styles.previewThumb}>
                                <img src={src} className={styles.thumbImage} alt={`Photo ${i + 1}`} />
                                {i === 0 && <span className={styles.mainBadge}>Main</span>}
                                <button
                                    type="button"
                                    className={styles.removeThumb}
                                    onClick={() => handleRemoveImage(i)}
                                >✕</button>
                            </div>
                        ))}
                        <div
                            className={styles.uploadZone}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className={styles.uploadPlaceholder}>
                                <div className={styles.uploadIcon}>📷</div>
                                <div className={styles.uploadText}>Add photo</div>
                            </div>
                        </div>
                    </div>
                    {errors.images && <p className={styles.errorText}>{errors.images}</p>}
                </div>

                {/* Price */}
                <div className={styles.fieldWrap}>
                    <label className={styles.label}>Price ($)</label>
                    <input
                        className={`${styles.input} ${errors.price ? styles.inputError : ""}`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={price}
                        onChange={e => { setPrice(e.target.value); setErrors(prev => ({ ...prev, price: undefined })); }}
                    />
                    {errors.price && <p className={styles.errorText}>{errors.price}</p>}
                </div>

                {/* Title */}
                <div className={styles.fieldWrap}>
                    <label className={styles.label}>Title</label>
                    <input
                        className={`${styles.input} ${errors.title ? styles.inputError : ""}`}
                        type="text"
                        placeholder="e.g. Homemade lasagna"
                        value={title}
                        onChange={e => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: undefined })); }}
                    />
                    {errors.title && <p className={styles.errorText}>{errors.title}</p>}
                </div>

                {/* Location */}
                <div className={styles.fieldWrap}>
                    <label className={styles.label}>Location <span className={styles.optional}>(optional)</span></label>
                    <input
                        className={styles.input}
                        type="text"
                        placeholder="e.g. Downtown, LA"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                    />
                </div>

                {/* Category */}
                <div className={styles.fieldWrap}>
                    <label className={styles.label}>Category</label>
                    <select
                        className={`${styles.input} ${errors.category ? styles.inputError : ""}`}
                        value={category}
                        onChange={handleCategoryChange}
                    >
                        <option value="">Select a category</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.category && <p className={styles.errorText}>{errors.category}</p>}
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
                    <label className={styles.label}>Ingredients <span className={styles.optional}>(optional)</span></label>
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
                    <label className={styles.label}>Description <span className={styles.optional}>(optional)</span></label>
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
                    <label className={styles.label}>Allergy tags <span className={styles.optional}>(optional)</span></label>
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
                <button
                    className={styles.submitBtn}
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? "Posting..." : "Post listing"}
                </button>
            </div>
        </main>
    );
}
