import {useEffect, useState} from "react";
import {RecordModel} from "pocketbase";
import {searchListings, searchNeighborhoods, searchUsers} from "@/app/api/search";
import {Listing} from "@/app/types/listing";
import pb from "@/app/lib/pb";
import {pbuser} from "@/app/types/pbuser";


export function useSearch(searchQuery = "",
                          page = 1,
                          searchListing = true,
                          searchUser = true,
                          searchNeighborhood = true,
                          ) {
    const [listings, setListings] = useState<Listing[]>([]);
    const [users, setUsers] = useState<pbuser[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {

        console.log("query: {}", searchQuery);

        let cancelled = false;

        const runSearch = async () => {
                if (!searchQuery.trim()) {
                    setListings([]);
                    setUsers([]);
                    setNeighborhoods([]);
                    setError(null);
                    setLoading(false);
                    return;
                }

                try {
                    setError(null);
                    setLoading(true);

                    if (!cancelled && searchListing) {
                        const bruh = await searchListings(searchQuery, page);
                        setListings(await searchListings(searchQuery, page));
                        console.log("Listings fetched: {}", bruh.length);
                    }

                    if (!cancelled && searchUser) {
                        const bruh = await searchUsers(searchQuery, page);
                        setUsers(bruh);
                        console.log("Users fetched: {}", bruh.length);
                    }

                    if (!cancelled && searchNeighborhood) {
                        const bruh = await searchNeighborhoods(searchQuery, page);
                        setNeighborhoods(bruh);
                        console.log("Neighborhoods fetched: {}", bruh.length);
                    }


                } catch (err) {
                    console.log("Search error: {}", err);
                    if (!cancelled) {
                        setError(err instanceof Error ? err.message : 'Search failed');
                        setListings([]);
                        setUsers([]);
                        setNeighborhoods([]);
                    }
                } finally {
                    if (!cancelled) {
                        setLoading(false);
                    }
                }
        }

        runSearch();
        return () =>{
            cancelled = true;
        }

    },[searchQuery, page, searchListing, searchUser, searchNeighborhood])

    return {listings, users, neighborhoods, loading, error};

}