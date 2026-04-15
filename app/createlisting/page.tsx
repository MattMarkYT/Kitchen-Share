'use client';
import { useState, useRef, useEffect } from "react";
import styles from "./create.module.css";
import pb from "@/app/lib/pb";
import { useRouter } from "next/navigation";
import {useCurrentUser} from "@/app/hooks";
import PillButton from "@/app/components/PillButton";
import InputField from "@/app/components/InputField";
import { CATEGORIES } from "@/app/types/categories";

const ALLERGY_OPTIONS = ["Gluten", "Dairy", "Nuts", "Eggs", "Soy", "Shellfish", "Fish", "Wheat"];

type Errors = {
    title?: string;
    price?: string;
    location?: string;
    images?: string;
    tags?: string;
};

export default function CreateListing() {
    const router = useRouter();

    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [price, setPrice] = useState("");
    const [title, setTitle] = useState("");
    const [location, setLocation] = useState("");
    const [tags, setTags] = useState("");
    const [additionalTags, setAdditionalTags] = useState("");
    const [description, setDescription] = useState("");
    const [allergies, setAllergies] = useState<string[]>([]);
    const [errors, setErrors] = useState<Errors>({});
    const [submitting, setSubmitting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Checks if not logged in, and redirects
    const currentUserId = useCurrentUser();
    useEffect(() => {
        if (!pb.authStore.isValid) {
            router.push("/auth");
        }
    }, [currentUserId, router]);


    // We don't want the user to see the create listing page if they aren't logged in
    if (!currentUserId) {
        return  <div className="min-h-screen flex items-center justify-center bg-gray-100">
                    <p className="text-gray-500">Loading...</p>
                </div>
    }

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

    function toggleAllergy(tag: string) {
        setAllergies(prev =>
            prev.includes(tag) ? prev.filter(a => a !== tag) : [...prev, tag]
        );
    }

    function validate(): boolean {
        const newErrors: Errors = {};
        if (!title.trim()) newErrors.title = "Title is required";
        if (!price || isNaN(Number(price)) || Number(price) < 0) newErrors.price = "Valid price is required";
        if (!location.trim()) newErrors.location = "Location is required";
        if (!tags.trim()) newErrors.tags = "Category is required";
        if (images.length === 0) newErrors.images = "Please upload at least one photo";
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
            data.append("tags", tags.trim().concat(" " + additionalTags));
            data.append("description", description.trim());
            data.append("allergies", !allergies.length ? "None" : allergies.join(", "));
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
            if (err == "ClientResponseError 400: Failed to create record."){
                alert("Your input is invalid and wasn't accepted by our server.");
            }
            else alert("An unexpected error occurred: \n" + err);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main>
            <div className="min-w-lg max-w-1/3 mx-auto mt-10">
                <h1 className={styles.heading}>Create a listing</h1>

                {/* Photo upload */}
                <div className="flex flex-col gap-1 pb-4">
                    <label className="text-base font-medium text-gray-900">Photos</label>
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
                    {errors.images && <p className="text-sm text-red-600">{errors.images}</p>}
                </div>

                {/* Price */}
                <InputField label="Price ($)" fieldType="textS" error={errors.price}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        onChange={e => { setPrice(e.target.value); setErrors(prev => ({ ...prev, price: undefined })); }}/>

                {/* Title */}
                <InputField label="Title" fieldType="textS" error={errors.title}
                        type="text"
                        placeholder="e.g. Homemade lasagna"
                        onChange={e => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: undefined })); }}/>

                {/* Location */}
                <InputField label="Location" fieldType="textS" error={errors.location}
                        type="text"
                        placeholder="e.g. Downtown LA"
                        onChange={e => setLocation(e.target.value)}/>

                <InputField label="Description" fieldType="textL" optional={true}
                            placeholder="Tell buyers about your food..."
                            onChange={e => setDescription(e.target.value)}
                            rows={4}
                />

                <InputField label="Category" fieldType="selection" selectOptions={CATEGORIES} selectPlaceholder="Select a category" error={errors.tags}
                            onChange={e => setTags(e.target.value)}
                />
                <InputField label="Tags" fieldType="textL" optional={true}
                            placeholder="Add some tags to help buyers find your food... (separate with spaces)"
                            onChange={e => setAdditionalTags(e.target.value)}
                            rows={2}
                />

                {/* Allergy tags */}
                <div className="mb-5">
                    <label className="text-base font-medium text-gray-900">
                        Allergy tags <span className="text-slate-400">(optional)</span>
                    </label>
                    <div className={`flex flex-wrap gap-2`}>
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
                <PillButton
                    className="w-full top-4 p-3.5"
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? "Posting..." : "Post listing"}
                </PillButton>
            </div>
        </main>
    );
}
