export default function About() {
    return(
        <div style = {{padding: '20px', maxWidth: '600px', margin: '0 auto'}}>
            <img src="SharingFood.png" alt="About Us Image" style={{width: "100%", height: "220px", borderRadius: "8px", marginBottom: "20px"}} />
            {/*Title of Page*/}
            <h1 style={{fontSize: "35px", marginBottom: "12px", fontWeight: "700"}}>About Us</h1>
            {/*Description of Page*/}
            <p style={{fontSize: "18px", lineHeight: "1.6", marginBottom: "20px"}}>
                Welcome to Neighborhood Eats! We are passionate about connecting people through the love of food. 
                Whether you're a seasoned chef or just starting out in the kitchen, our platform provides a space for everyone to share their delicious dishes and
                connect with fellow food enthusiasts. Join us on this journey and let's share the joy of food together!
            </p>

            {/*How It Works*/}
            <h2 style={{fontSize: "28px", marginBottom: "10px", fontWeight: "700"}}>How It Works</h2>
            <p style={{fontSize: "18px", lineHeight: "1.6", marginBottom: "20px"}}>
                At Neighborhood Eats, neighbors post meals they have cooked and are willing to share with others. You can browse through the available meals in your
                 area, connect with the cook, and arrange a pickup or delivery.
            </p>

            {/*Our Mission*/}
            <h2 style={{fontSize: "28px", marginBottom: "10px", fontWeight: "700"}}>Our Mission</h2>
            <p style={{fontSize: "18px", lineHeight: "1.6", marginBottom: "20px"}}>
                Our mission is to build a world where food brings people together. We strive to create a platform that not only allows individuals to share their 
                culinary creations but also fosters a sense of community and connection. By bridging the gap between neighbors, we aim to promote cultural exchange, 
                support local businesses, and celebrate the diverse flavors that make our communities unique.
            </p>
        </div>
    );
}