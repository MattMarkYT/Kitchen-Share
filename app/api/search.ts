import {useEffect, useState} from "react";
import pb from "@/app/lib/pb";
import {Listing} from "@/app/types/listing";
import {pbuser} from "@/app/types/pbuser";

const LISTINGS_PER_PAGE = 15;

export async function searchListings(query: string, page: number) {
    if (query.split(" ").filter(Boolean).length === 0) {
        return [];
    }
    const searchFilter = createFilter(query, ["title", "tags"]);
    const results = await pb.collection("listings").getList<Listing>(page, LISTINGS_PER_PAGE, {
        filter: searchFilter as string,
    });
    return Array.from(results.items)
}

export async function searchUsers(query: string, page: number) {
    if (query.split(" ").filter(Boolean).length === 0) {
        return [];
    }
    const searchFilter = createFilter(query,["displayName"]);
    const results = await pb.collection("users").getList<pbuser>(page, LISTINGS_PER_PAGE, {
        filter: searchFilter as string,
    });
    return Array.from(results.items)
}

export async function searchNeighborhoods(query: string, page: number) {
    if (query.split(" ").filter(Boolean).length === 0) {
        return [];
    }
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
