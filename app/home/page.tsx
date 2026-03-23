import Navbar from "../components/Navbar";
import styles from "./homepage.module.css"

type Listing = {
    id: string;
    title: string;
    price: number;
    location?: string;
    main_image?: string;
    created: string;
};

export default function Home() {

    // Use this placeholder array in a loop to generate the items in the grid.
    // Try to create a React Component for an item to make the code cleaner.
    const listings: Listing[] = [
        {id: "1", title:"Burger Meal", price:9, location:"Los Angeles, CA", main_image:"/placeholder.jpg", created:""},
        {id: "2", title:"Chicken Sandwich", price:8, location:"Los Angeles, CA", main_image:"/placeholder.jpg", created:""},
        {id: "3", title:"Pizza Slice", price:4, location:"Los Angeles, CA", main_image:"/placeholder.jpg", created:""},
        {id: "4", title:"Pasta Bowl", price:10, location:"Los Angeles, CA", main_image:"/placeholder.jpg", created:""},
        {id: "5", title:"Hot Dog", price:5, location:"Los Angeles, CA", main_image:"/placeholder.jpg", created:""},
    ]

    return (
        <main className="min-h-screen bg-white font-sans relative overflow-hidden">
            <div className={styles.flexContainer}>
                <ul className={styles.gridLayout}>

                    <li className={styles.card}>
                        <a href="#"> {/* Note: Instead of href="#", do href="/listing/{id}" */}
                            <img src="/placeholder.jpg" />
                            <div className={styles.cardInfo}>
                                <p className={styles.title}>Burger Meal</p>
                                <p className={styles.price}>$12</p>
                                <p className={styles.location}>Los Angeles, CA</p>
                            </div>
                        </a>
                    </li>


                    <li className={styles.card}>
                        <a href="#">
                            <img src="/placeholder.jpg" />
                            <div className={styles.cardInfo}>
                                <p className={styles.title}>Chicken Sandwich</p>
                                <p className={styles.price}>$9</p>
                                <p className={styles.location}>Los Angeles, CA</p>
                            </div>
                        </a>
                    </li>

                    <li className={styles.card}>
                        <a href="#">
                            <img src="/placeholder.jpg" />
                            <div className={styles.cardInfo}>
                                <p className={styles.title}>Pizza Slice</p>
                                <p className={styles.price}>$4</p>
                                <p className={styles.location}>Los Angeles, CA</p>
                            </div>
                        </a>
                    </li>

                    <li className={styles.card}>
                        <a href="#">
                            <img src="/placeholder.jpg" />
                            <div className={styles.cardInfo}>
                                <p className={styles.title}>Pasta Bowl</p>
                                <p className={styles.price}>$10</p>
                                <p className={styles.location}>Los Angeles, CA</p>
                            </div>
                        </a>
                    </li>

                    <li className={styles.card}>
                        <a href="#">
                            <img src="/placeholder.jpg" />
                            <div className={styles.cardInfo}>
                                <p className={styles.title}>Pasta Bowl</p>
                                <p className={styles.price}>$10</p>
                                <p className={styles.location}>Los Angeles, CA</p>
                            </div>
                        </a>
                    </li>

                </ul>
            </div>
        </main>
    );
}