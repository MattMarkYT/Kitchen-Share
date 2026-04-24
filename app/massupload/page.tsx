"use client"
import InputField from "@/app/components/InputField";
import {useEffect, useState} from "react";
import PillButton from "@/app/components/PillButton";
import {ClientResponseError, RecordModel} from "pocketbase";
import {Listing} from "@/app/types/listing";
import {Camera, Pizza, Users} from "lucide-react";
import {toast} from "react-toastify";
import pb from "@/app/lib/pb";

export interface User extends RecordModel {
    email: string;
    password: string;
    passwordConfirm: string;
    verified: boolean;
    displayName: string;
    phoneNumber: string;
    zipcode: string;
    city: string;   // Full city name
    state: string;  // 2 letter state code
    bio: string;
}

export default function MassUpload() {
    const [userJson, setUserJson] = useState("");
    const [listingJson, setListingJson] = useState("");
    const [imagesM, setImagesM] = useState<File[]>([]);
    const [imagesF, setImagesF] = useState<File[]>([]);

    const [parsedUsers, setParsedUsers] = useState<User[]>([]);
    const [parsedListings, setParsedListings] = useState<Listing[]>([]);
    const [processedUsers, setProcessedUsers] = useState(0);

    const [processing, setProcessing] = useState(false);
    const [doneProcessing, setDoneProcessing] = useState(false);
    const [listingMode, setListingMode] = useState(false);

    const userUploadToast = () => toast.success("Users Uploaded!");

    useEffect(() => {
        console.log("Users:", parsedUsers.length, "\nListings:", parsedListings.length);
    },[parsedListings])

    const processJson = async () => {
        setProcessing(true);

        const users:User[] = JSON.parse(userJson);
        for (const user of users) {
            user.password = "password";
            user.passwordConfirm = "password";
        }
        //const listings = JSON.parse(listingJson);

        setParsedUsers(users);
        //setParsedListings(listings);

        for (const user of users) {
            const data = new FormData();
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
                await pb.collection('users').create(payload);
                setProcessedUsers(prev => prev + 1);
            } catch (error) {
                console.log(user.email, " failed to upload");
                if (error instanceof ClientResponseError)
                    console.error(error.response?.data);
                break;
            }
        }

        setDoneProcessing(true);
        setProcessing(false);
        userUploadToast();
    }

    if (!doneProcessing)
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
                    { /* Create Users */ }
                    <span className="text-center text-5xl mb-4">Users</span>
                    <InputField label="" fieldType="textL"
                                placeholder="Enter Json..."
                                onChange={e => setUserJson(e.target.value)}
                                rows={16}/>
                    <span className="text-center text-5xl mt-10 mb-4">Images</span>
                    <div className={"flex flex-row items-center justify-between gap-12 mb-8"}>
                        <div className={"flex flex-col items-center"}>
                            <span className={"text-3xl"}>Men</span>
                            <span className={"text-3xl mb-4"}>{imagesM.length} images uploaded</span>
                            <div className={"relative rounded-xl h-80 w-100 border-2 border-black"}>
                                <input className={"text-background h-80 w-100"} accept="image/*" type="file" multiple onChange={e => setImagesM(prev => [...prev, ...Array.from(e.target.files || [])])}/>
                                <Camera className={"pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black"} size={30}/>
                            </div>
                        </div>
                        <div className={"flex flex-col items-center"}>
                            <span className={"text-3xl"}>Women</span>
                            <span className={"text-3xl mb-4"}>{imagesF.length} images uploaded</span>
                            <div className={"relative rounded-xl h-80 w-100 border-2 border-black"}>
                                <input className={"text-background h-80 w-100"} accept="image/*" type="file" multiple onChange={e => setImagesF(prev => [...prev, ...Array.from(e.target.files || [])])}/>
                                <Camera className={"pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black"} size={30}/>
                            </div>
                        </div>
                    </div>
                </div>
                <PillButton
                    className="min-w-sm mx-auto p-3.5"
                    onClick={processJson}
                    disabled={processing}
                >
                    { processing ? "Processing..." : "Process Json" }
                </PillButton>
            </div>
                :
                <div className={"mx-auto flex flex-col justify-center gap-8 mb-16 max-w-6xl"}>
                    <span className="text-center text-5xl mb-4">Users</span>
                    <div className="flex flex-col">
                        {parsedUsers.map((user, index) => (
                            <div key={index} className="flex flex-col gap-2 mb-8">
                                <span className={"text-3xl mb-6"}>{index+1}) {user.displayName || "John Deez"}</span>
                                <div className={"flex flex-row gap-12 mb-8"}>
                                    <div className={"relative rounded-xl h-30 w-30 border-2 border-black"}>
                                        <input className={"text-background h-30 w-30"} accept="image/*" type="file"/>
                                        <Camera className={"pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black"} size={30}/>
                                    </div>

                                    <div className={"flex flex-col"}>
                                        <span className={"text-2xl"}>Email: {user.email}</span>
                                        <span className={"text-2xl"}>Phone: {user.phoneNumber}</span>
                                    </div>
                                    <div className={"flex flex-col"}>
                                        <span className={"text-2xl"}>City: {user.city}</span>
                                        <span className={"text-2xl"}>State: {user.state}</span>
                                        <span className={"text-2xl"}>Zipcode: {user.zipcode}</span>
                                    </div>
                                </div>
                                <span className={"text-2xl"}>Bio:</span>
                                <span className={"text-2xl mb-8"}>{user.bio}</span>
                                <hr/>
                            </div>
                        ))}

                    </div>
                    <span className="text-center text-5xl mb-4">Listings</span>

                </div>
            }
            {processing &&
                <div className={"flex justify-center items-center absolute w-full h-full"}>
                    <div className={"absolute text-9xl mx-auto my-auto text-white z-20"}>
                        {processedUsers}/{parsedUsers.length}
                    </div>
                    <div className={"absolute w-full h-full bg-black opacity-60"}/>
                </div>
            }
        </div>
    );
    return (
        <div className={"mx-auto flex flex-col justify-center gap-8 mb-16 max-w-6xl"}>
            <span className="text-center text-5xl mb-4">Users</span>
            <div className="flex flex-col">
                {parsedUsers.map((user, index) => (
                <div key={index} className="flex flex-col gap-2 mb-8">
                    <span className={"text-3xl mb-6"}>{index+1}) {user.displayName || "John Deez"}</span>
                    <div className={"flex flex-row gap-12 mb-8"}>
                        <div className={"relative rounded-xl h-30 w-30 border-2 border-black"}>
                            <input className={"text-background h-30 w-30"} accept="image/*" type="file"/>
                            <Camera className={"pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black"} size={30}/>
                        </div>

                        <div className={"flex flex-col"}>
                        <span className={"text-2xl"}>Email: {user.email}</span>
                            <span className={"text-2xl"}>Phone: {user.phoneNumber}</span>
                        </div>
                        <div className={"flex flex-col"}>
                            <span className={"text-2xl"}>City: {user.city}</span>
                            <span className={"text-2xl"}>State: {user.state}</span>
                            <span className={"text-2xl"}>Zipcode: {user.zipcode}</span>
                        </div>
                    </div>
                    <span className={"text-2xl"}>Bio:</span>
                    <span className={"text-2xl mb-8"}>{user.bio}</span>
                    <hr/>
                </div>
                ))}

            </div>
            <span className="text-center text-5xl mb-4">Listings</span>

        </div>
    )
}