import Navbar from "../components/Navbar";
import styles from "./homepage.module.css"

export default function Home() {
    return (
        <main className="min-h-screen bg-white font-sans relative overflow-hidden">
            <div className={styles.flexContainer}>
                <ul className={styles.gridLayout}>

                    <li className={styles.card}>
                        <a href="#">
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