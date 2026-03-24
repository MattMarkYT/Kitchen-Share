import Navbar from "../components/Navbar";
import styles from "./homepage.module.css";

type Listing = {
    id: string;
    title: string;
    price: number;
    location?: string;
    main_image?: string;
    created: string;
};

function ListingCard({ listing }: { listing: Listing }) {
    return (
        <li className={styles.card}>
            <a href={`/listing/${listing.id}`}>
                <img src={listing.main_image || "/placeholder.jpg"} />
                <div className={styles.cardInfo}>
                    <p className={styles.title}>{listing.title}</p>
                    <p className={styles.price}>${listing.price}</p>
                    <p className={styles.location}>{listing.location}</p>
                </div>
            </a>
        </li>
    );
}

export default function Home() {
    const listings: Listing[] = [
        {id: "1", title:"Burger Meal", price:9, location:"Los Angeles, CA", main_image:"/placeholder.jpg", created:""},
        {id: "2", title:"Chicken Sandwich", price:8, location:"Los Angeles, CA", main_image:"/placeholder.jpg", created:""},
        {id: "3", title:"Pizza Slice", price:4, location:"Los Angeles, CA", main_image:"/placeholder.jpg", created:""},
        {id: "4", title:"Pasta Bowl", price:10, location:"Los Angeles, CA", main_image:"/placeholder.jpg", created:""},
        {id: "5", title:"Hot Dog", price:5, location:"Los Angeles, CA", main_image:"/placeholder.jpg", created:""},
    ];

    return (
        <main className="min-h-screen bg-white font-sans relative overflow-hidden">
            <div className={styles.flexContainer}>
                <ul className={styles.gridLayout}>
                    {listings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                    ))}

                </ul>
            </div>
        </main>
    );
}