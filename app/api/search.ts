import {useEffect, useState} from "react";
import pb from "@/app/lib/pb";
import {Listing} from "@/app/types/listing";
import {pbuser} from "@/app/types/pbuser";

const LISTINGS_PER_PAGE = 30;

export async function searchListings(query: string, page: number) {
    const searchFilter = createFilter(query, ["title", "tags"]);
    const results = await pb.collection("listings").getList<Listing>(page, LISTINGS_PER_PAGE, {
        filter: searchFilter as string,
    });
    return Array.from(results.items)
}

export async function searchUsers(query: string, page: number) {
    const results = await pb.collection("users").getList<pbuser>(page, LISTINGS_PER_PAGE, { filter: pb.filter(
        "displayName ~ {:search0} || displayName ~ {:search1}",
        {search0: query, search1: query.toLowerCase()}
        )});
    return results.items;
}

export async function searchNeighborhoods(query: string, page: number) {
    const searchFilter = createFilter(query, ["location"]);
    const results = await pb.collection("listings").getList<Listing>(page, LISTINGS_PER_PAGE, {
        filter: searchFilter as string,
    });
    return Array.from(results.items)
}

function createFilter(query: string, fields: string[]) {
    const queryWords = query.split(" ").filter(Boolean);
    if (queryWords.length === 0) {
        return [];
    }

    let filterStr = "";
    const params: Record<string, string> = {};

    let num = 0;
    queryWords.forEach((word, i) => {
        let key;
        for (const field of fields){
            key = `search${num}`
            filterStr += `${field} ~ {:${key}} || `;
            params[key] = word;
            num++;
        }
        if (i == queryWords.length - 1) filterStr = filterStr.slice(0, -4);

    });
    return pb.filter(filterStr, params)
}

type Result = {
    matches: number;
    listing: Listing;
};
export function sortListings(query: string, listings: Listing[]) {
    const filterResults: Result[] = [];
    for (const listing of listings) {
        let matches = 0;
        for (const word of query.split(" ")) {
            if (listing.tags && listing.tags.toLowerCase().includes(word.toLowerCase())) {
                matches++;
            }
            if (listing.title.toLowerCase().includes(word.toLowerCase())) {
                matches++;
            }
        }
        if (matches > 0) {
            filterResults.push({ matches, listing });
        }
    }

    filterResults.sort((a, b) => a.matches - b.matches);
    return filterResults.map(r => r.listing);
}
