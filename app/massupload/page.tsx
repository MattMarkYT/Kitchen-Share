"use client"
import InputField from "@/app/components/InputField";
import React, {useEffect, useMemo, useState} from "react";
import PillButton from "@/app/components/PillButton";
import {ClientResponseError, RecordModel} from "pocketbase";
import {Camera, Pizza, Upload, Users} from "lucide-react";
import {toast} from "react-toastify";
import pb from "@/app/lib/pb";
import Link from "next/link";

export interface User extends RecordModel {
    email: string;
    password: string;
    passwordConfirm: string;
    verified: boolean;
    displayName: string;
    phoneNumber: string;
    zipcode: string;
    city: string;
    state: string;
    bio: string;
    avatar?: string;
}

export interface Listing extends RecordModel {
    id: string;
    title: string;
    price: number;
    location?: string;
    description?: string;
    category: string;
    tags?: string;
    seller: string;
    images?: string[];
}

type ParsedListing = Partial<Listing> & {
    title?: string;
    price?: number | string;
    location?: string;
    description?: string;
    category?: string;
    tags?: string | string[];
};

export default function MassUpload() {
    const [userJson, setUserJson] = useState("");
    const [listingJson, setListingJson] = useState("");
    const [imagesM, setImagesM] = useState<File[]>([]);
    const [imagesF, setImagesF] = useState<File[]>([]);

    const [parsedUsers, setParsedUsers] = useState<User[]>([]);
    const [parsedListings, setParsedListings] = useState<ParsedListing[]>([]);
    const [listingImages, setListingImages] = useState<Record<number, File[]>>({});
    const [processedUsers, setProcessedUsers] = useState(0);
    const [uploadedListings, setUploadedListings] = useState(0);

    const [processing, setProcessing] = useState(false);
    const [uploadingListings, setUploadingListings] = useState(false);
    const [doneProcessing, setDoneProcessing] = useState(false);
    const [listingMode, setListingMode] = useState(false);

    const [listOfUsers, setListOfUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        const getUsers = async () => {
            const b = await pb.collection("users").getFullList<User>();
            setListOfUsers(b);
        }
        getUsers();
    }, []);

    const totalListingImages = useMemo(
        () => Object.values(listingImages).reduce((count, files) => count + files.length, 0),
        [listingImages]
    );

    const userUploadToast = () => toast.success("Users Uploaded!");
    const listingParsedToast = () => toast.success("Listings parsed!");
    const listingUploadToast = () => toast.success("Listings uploaded!");

    useEffect(() => {
        console.log("Users:", parsedUsers.length, "\nListings:", parsedListings.length);
    }, [parsedUsers, parsedListings]);

    const processUserJson = async () => {
        setProcessing(true);

        const users: User[] = JSON.parse(userJson);
        for (const user of users) {
            user.password = "password";
            user.passwordConfirm = "password";
        }

        setParsedUsers(users);

        for (const user of users) {
            const payload = {
                email: user.email ?? "",
                password: "password",
                passwordConfirm: "password",
                displayName: user.displayName ?? "",
                phoneNumber: user.phoneNumber ?? "",
                zipcode: user.zipcode ?? "",
                city: user.city ?? "",
                state: user.state ?? "",
                bio: user.bio ?? "",
            };

            try {
                await pb.collection("users").create(payload);
                setProcessedUsers(prev => prev + 1);
            } catch (error) {
                console.log(user.email, " failed to upload");
                if (error instanceof ClientResponseError) {
                    console.error(error.response?.data);
                }
                break;
            }
        }

        setDoneProcessing(true);
        setProcessing(false);
        userUploadToast();
    }

    const processListingJson = async () => {
        setProcessing(true);

        try {
            const listings: ParsedListing[] = JSON.parse(listingJson);
            setParsedListings(Array.isArray(listings) ? listings : []);
            setListingImages({});
            setDoneProcessing(true);
            listingParsedToast();
        } catch (error) {
            console.error(error);
            toast.error("Invalid listing JSON");
        } finally {
            setProcessing(false);
        }
    }

    const handleListingImagesChange = (listingIndex: number, files: FileList | null) => {
        const nextFiles = Array.from(files || []);
        setListingImages(prev => ({
            ...prev,
            [listingIndex]: [...(prev[listingIndex] || []), ...nextFiles],
        }));
    };

    const removeListingImage = (listingIndex: number, fileIndex: number) => {
        setListingImages(prev => ({
            ...prev,
            [listingIndex]: (prev[listingIndex] || []).filter((_, idx) => idx !== fileIndex),
        }));
    };

    const uploadListingsToPocketBase = async () => {
        if (!selectedUser) {
            toast.error("Select a user before uploading listings");
            return;
        }

        if (parsedListings.length === 0) {
            toast.error("Parse some listings first");
            return;
        }

        setUploadingListings(true);
        setUploadedListings(0);

        try {
            for (let index = 0; index < parsedListings.length; index += 1) {
                const listing = parsedListings[index];
                const data = new FormData();

                data.append("title", listing.title ?? `Listing ${index + 1}`);
                data.append("price", String(Number(listing.price ?? 0)));
                data.append("location", listing.location ?? selectedUser.city);
                data.append("description", listing.description ?? "");
                data.append("category", listing.category ?? "");
                data.append("tags", listing.tags ?? "");
                data.append("seller", selectedUser.id);
                data.append("is_available", "true");

                (listingImages[index] || []).forEach((file, index) => {
                    if (index == 0) data.append("main_image", file);
                    else data.append("images", file);
                });

                await pb.collection("listings").create(data);
                setUploadedListings(prev => prev + 1);
            }

            listingUploadToast();
        } catch (error) {
            console.error(error);
            if (error instanceof ClientResponseError) {
                console.error(error.response);
            }
            toast.error("Failed to upload one or more listings");
        } finally {
            setUploadingListings(false);
        }
    };

    return (
        <div className={"relative mx-auto flex flex-col justify-center gap-8 mt-8 mb-16"}>
            <div className={"absolute top-0 left-6 flex flex-row gap-2 items-center justify-between"}>
                <div className={"top-5 left-12 h-14 w-14 border-black border-2 rounded-md"}>
                    <button className={"h-14 w-14"} onClick={() => setListingMode(prev => !prev)}/>
                    {!listingMode ?
                        <Pizza className={"pointer-events-none absolute top-3 left-3 text-black"} size={30}/>
                        :
                        <Users className={"pointer-events-none absolute top-3 left-3 text-black"} size={30}/>
                    }
                </div>
                <div className={"top-0 left-12 text-2xl"}>Switch to {!listingMode ? "Listing Assigning" : "User Creation"}</div>
            </div>

            {!listingMode ?
                <div className={"relative mx-auto flex flex-col justify-center gap-8 mt-8 mb-16 max-w-6xl"}>
                    <div className="flex flex-col">
                        <span className="text-center text-5xl mb-4">Users</span>
                        <InputField
                            label=""
                            fieldType="textL"
                            placeholder="Enter Json..."
                            onChange={e => setUserJson(e.target.value)}
                            rows={16}
                        />
                        <span className="text-center text-5xl mt-10 mb-4">Images</span>
                        <div className={"flex flex-row items-center justify-between gap-12 mb-8"}>
                            <div className={"flex flex-col items-center"}>
                                <span className={"text-3xl"}>Men</span>
                                <span className={"text-3xl mb-4"}>{imagesM.length} images uploaded</span>
                                <div className={"relative rounded-xl h-80 w-100 border-2 border-black"}>
                                    <input
                                        className={"text-background h-80 w-100"}
                                        accept="image/*"
                                        type="file"
                                        multiple
                                        onChange={e => setImagesM(prev => [...prev, ...Array.from(e.target.files || [])])}
                                    />
                                    <Camera className={"pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black"} size={30}/>
                                </div>
                            </div>
                            <div className={"flex flex-col items-center"}>
                                <span className={"text-3xl"}>Women</span>
                                <span className={"text-3xl mb-4"}>{imagesF.length} images uploaded</span>
                                <div className={"relative rounded-xl h-80 w-100 border-2 border-black"}>
                                    <input
                                        className={"text-background h-80 w-100"}
                                        accept="image/*"
                                        type="file"
                                        multiple
                                        onChange={e => setImagesF(prev => [...prev, ...Array.from(e.target.files || [])])}
                                    />
                                    <Camera className={"pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black"} size={30}/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <PillButton
                        className="min-w-sm mx-auto p-3.5"
                        onClick={processUserJson}
                        disabled={processing}
                    >
                        {processing ? "Processing..." : "Process Json"}
                    </PillButton>
                </div>
                :
                listOfUsers.length > 0 ?
                    <div className={"relative mx-auto flex flex-col justify-center gap-8 mt-8 mb-16 max-w-6xl w-full px-6"}>
                        <div className={"flex flex-col items-center"}>
                            <span className="text-center text-2xl my-4">AI Prompt: There&apos;s a website dedicated to people who want to sell their own homemade food in the US. Categories are limited to pizza, burgers, bbq, tacos, sandwiches, pasta, seafood, salads, breakfast, desserts, drinks, vegan, comfort, or other. These users are regular civilians who may not own a food business. I need listings for {selectedUser ? selectedUser.displayName : "[insert name]"} with the bio {selectedUser ? `"${selectedUser.bio}"` : `"[insert name]"`}. Create an array of 2 json objects with the following fields: title: string (Just the name of the food), price: number, description: string, category: string, tags: string (tags separated by comma) </span>
                            <span className="text-center text-4xl">Select User</span>
                            <select
                                className={"mt-4 border border-black rounded-md px-4 py-2"}
                                onChange={e => {
                                    const nextUser = listOfUsers[parseInt(e.target.value, 10)];
                                    setSelectedUser(nextUser ?? null);
                                }}
                            >
                                <option value="">Choose a User...</option>
                                {listOfUsers.map((user, index) => (
                                    <option key={user.id ?? index} value={index}>{user.displayName}</option>
                                ))}
                            </select>
                        </div>

                        {selectedUser && (
                            <div className={"mx-auto flex flex-col items-center gap-4 w-full"}>
                                <img
                                    src={pb.files.getURL(selectedUser, selectedUser.avatar as string, {thumb: "640x480"}) || "/placeholder.jpg"}
                                    alt="User Avatar"
                                    className={"rounded-full h-48 w-48 object-cover"}
                                />
                                <div className={"flex flex-col"}>
                                    <span className="text-center text-4xl">{selectedUser.displayName} <Link className={"text-blue-500"} target="_blank" href={`/profile/${selectedUser.id}`}>Profile</Link></span>
                                    <span className="text-2xl text-gray-700">{selectedUser.bio}</span>
                                </div>

                                <div className={"min-w-4xl w-full flex flex-col gap-4 mb-8"}>
                                    <span className="text-center text-5xl mb-4">Listings</span>
                                    <InputField
                                        label=""
                                        fieldType="textL"
                                        placeholder="Enter Json..."
                                        onChange={e => setListingJson(e.target.value)}
                                        rows={16}
                                    />
                                    <PillButton
                                        className="min-w-sm mx-auto p-3.5"
                                        onClick={processListingJson}
                                        disabled={processing}
                                    >
                                        {processing ? "Processing..." : "Process Json"}
                                    </PillButton>
                                </div>

                                {parsedListings.length > 0 && (
                                    <div className={"w-full flex flex-col gap-4"}>
                                        <div className={"flex items-center justify-between gap-4 flex-wrap"}>
                                            <div className={"flex flex-col"}>
                                                <span className={"text-3xl font-semibold"}>Parsed Listings</span>
                                                <span className={"text-gray-600"}>
                                                    {parsedListings.length} listing(s) parsed • {totalListingImages} attached image(s)
                                                </span>
                                            </div>
                                            <PillButton
                                                className="min-w-sm p-3.5"
                                                onClick={uploadListingsToPocketBase}
                                                disabled={uploadingListings}
                                            >
                                                <span className={"flex items-center justify-center gap-2"}>
                                                    <Upload size={18}/>
                                                    {uploadingListings
                                                        ? `Uploading ${uploadedListings}/${parsedListings.length}`
                                                        : "Send to PocketBase listings"
                                                    }
                                                </span>
                                            </PillButton>
                                        </div>

                                        <div className={"flex flex-col gap-4"}>
                                            {parsedListings.map((listing, index) => (
                                                <div key={`${listing.title ?? "listing"}-${index}`} className={"border border-black rounded-2xl p-5 flex flex-col gap-4"}>
                                                    <div className={"flex flex-col gap-1"}>
                                                        <span className={"text-2xl font-semibold"}>{listing.title || `Listing ${index + 1}`}</span>
                                                        <span className={"text-lg text-gray-700"}>${Number(listing.price ?? 0).toFixed(2)}</span>
                                                        <span className={"text-base text-gray-600"}>{listing.category || "No category"}</span>
                                                        {listing.location && (
                                                            <span className={"text-base text-gray-600"}>{listing.location}</span>
                                                        )}
                                                    </div>

                                                    {listing.description && (
                                                        <p className={"text-base whitespace-pre-wrap"}>{listing.description}</p>
                                                    )}

                                                    <div className={"text-sm text-gray-600"}>
                                                        Tags: {Array.isArray(listing.tags) ? listing.tags.join(", ") : (listing.tags || "None")}
                                                    </div>

                                                    <div className={"flex flex-col gap-3"}>
                                                        <span className={"text-lg font-medium"}>Attach images to this listing</span>
                                                        <div className={"relative rounded-xl min-h-28 border-2 border-dashed border-black flex items-center justify-center p-4"}>
                                                            <input
                                                                className={"absolute inset-0 opacity-0 cursor-pointer"}
                                                                accept="image/*"
                                                                type="file"
                                                                multiple
                                                                onChange={e => handleListingImagesChange(index, e.target.files)}
                                                            />
                                                            <div className={"pointer-events-none flex flex-col items-center gap-2"}>
                                                                <Camera size={28}/>
                                                                <span>{(listingImages[index] || []).length} image(s) attached</span>
                                                            </div>
                                                        </div>

                                                        {(listingImages[index] || []).length > 0 && (
                                                            <div className={"flex flex-wrap gap-2"}>
                                                                {(listingImages[index] || []).map((file, fileIndex) => (
                                                                    <div key={`${file.name}-${fileIndex}`} className={"border rounded-full px-3 py-1 text-sm flex items-center gap-2"}>
                                                                        <span>{file.name}</span>
                                                                        <button
                                                                            type="button"
                                                                            className={"font-bold"}
                                                                            onClick={() => removeListingImage(index, fileIndex)}
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    :
                    <div className={"text-7xl"}>Loading</div>
            }

            {(processing || uploadingListings) && (
                <div className={"flex justify-center items-center absolute w-full h-full"}>
                    <div className={"absolute text-7xl mx-auto my-auto text-white z-20 text-center px-8"}>
                        {processing
                            ? `${processedUsers}/${parsedUsers.length}`
                            : `${uploadedListings}/${parsedListings.length}`}
                    </div>
                    <div className={"absolute w-full h-full bg-black opacity-60"}/>
                </div>
            )}
        </div>
    );
}
