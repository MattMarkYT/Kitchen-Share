export default function About() {
    return (
        <main className="min-h-screen bg-white font-sans relative overflow-hidden">
            <div className="mx-auto max-w-4xl px-6 py-10 sm:px-8 lg:px-10">

                {/* Image */}
                <img
                    src="/SharingFood.png"
                    alt="About Us"
                    className="w-full h-[260px] object-cover rounded-xl mb-8"
                />

                {/* Title */}
                <h1 className="text-4xl font-bold text-stone-900 mb-4">
                    About Us
                </h1>

                {/* Description */}
                <p className="text-lg text-stone-600 leading-relaxed mb-8">
                    Welcome to Neighborhood Eats! We are passionate about connecting people
                    through the love of food. Whether you're a seasoned chef or just
                    starting out in the kitchen, our platform provides a space for
                    everyone to share their delicious dishes and connect with fellow
                    food enthusiasts. Join us on this journey and let's share the joy of
                    food together!
                </p>

                {/* How It Works */}
                <h2 className="text-2xl font-semibold text-stone-900 mb-3">
                    How It Works
                </h2>
                <p className="text-lg text-stone-600 leading-relaxed mb-8">
                    At Neighborhood Eats, neighbors post meals they have cooked and are
                    willing to share with others. You can browse through available meals
                    in your area, connect with the cook, and arrange a pickup or delivery.
                </p>

                {/* Our Mission */}
                <h2 className="text-2xl font-semibold text-stone-900 mb-3">
                    Our Mission
                </h2>
                <p className="text-lg text-stone-600 leading-relaxed">
                    Our mission is to build a world where food brings people together.
                    We strive to create a platform that not only allows individuals to
                    share their culinary creations but also fosters a sense of community
                    and connection. By bridging the gap between neighbors, we aim to
                    promote cultural exchange, support local businesses, and celebrate
                    the diverse flavors that make our communities unique.
                </p>

            </div>
        </main>
    );
}