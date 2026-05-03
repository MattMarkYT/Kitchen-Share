import pb from '@/app/lib/pb';
import {type} from "node:os";

export default async function getRatings(sellerId: string | undefined) {
    if (!sellerId) return {
        averageRating: 0,
        totalRatings: 0,
        ratingSum: 0,
    };
    try {
        const stats = await pb.collection('stats').getOne(sellerId);

        return {
            averageRating: typeof(stats.avgRating) === 'number' ? stats.avgRating : 0,
            totalRatings: typeof(stats.totalRatings) === 'number' ? stats.totalRatings : 0,
            ratingSum: typeof(stats.ratingSum) === 'number' ? stats.ratingSum : 0,
        };
    } catch (err) {
        return {
            averageRating: 0,
            totalRatings: 0,
            ratingSum: 0,
        };
    }
}