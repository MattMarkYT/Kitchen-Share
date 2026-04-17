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
                          allowEmptyQuery = false
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
            if (!allowEmptyQuery && searchQuery.trim().length == 0) return;

                try {
                    setError(null);
                    setLoading(true);

                    if (!cancelled && searchListing) {
                        const fetchedListings = await searchListings(searchQuery, page);
                        setListings(fetchedListings);
                        console.log("Listings fetched: ", fetchedListings.length);
                    }

                    if (!cancelled && searchUser) {
                        const fetchedUsers = await searchUsers(searchQuery, page);
                        setUsers(fetchedUsers);
                        console.log("Users fetched: ", fetchedUsers.length);
                    }

                    if (!cancelled && searchNeighborhood) {
                        const fetchedNeighborhoods = await searchNeighborhoods(searchQuery, page);
                        setNeighborhoods(fetchedNeighborhoods);
                        console.log("Neighborhoods fetched: ", fetchedNeighborhoods.length);
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