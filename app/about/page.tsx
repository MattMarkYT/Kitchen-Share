"use client"

import Image from "next/image";
import SharingFood from "@/public/SharingFood.png";
import Bgb from "@/public/bgb.webp"
import sv from "@/public/streetvendor.jpeg"
import gsap from "gsap";
import {SplitText} from "gsap/all";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {useGSAP} from "@gsap/react";

export default function About() {
    gsap.registerPlugin(ScrollTrigger);

    // List of all animatinos
    useGSAP(() => {
        const splitIntro = SplitText.create(".splitIntro", { type: "lines" });

        gsap.from(".bigText", {
            duration: 1, autoAlpha: 0,
        })
        gsap.from(splitIntro.lines, {
            duration: 0.6, autoAlpha: 0, stagger: 0.1,
            y: 40, ease: "back"});


        const split1 = SplitText.create(".split1", { type: "lines" });
        const split1_2 = SplitText.create(".split1_2", { type: "words" });
        const split2 = SplitText.create(".split2", { type: "lines" });
        const split2_2 = SplitText.create(".split2_2", { type: "words" });
        gsap.from('.image1', {
            scrollTrigger: '.trigger1',
            x: -150,
            autoAlpha: 0,
            duration: 1.4,
            ease: "power2.out"
        });
        gsap.from(split1.lines, {
            scrollTrigger: '.trigger1',
            duration: 0.6, autoAlpha: 0,
            y: 40, ease: "back"});
        gsap.from(split1_2.words, {
            scrollTrigger: '.trigger1',
            duration: 0.6, stagger: 0.03,
            autoAlpha: 0, y: 40, ease: "back"});

        gsap.from('.image2', {
            scrollTrigger: '.trigger2',
            x: 150,
            autoAlpha: 0,
            duration: 1.4,
            ease: "power2.out"
        });
        gsap.from(split2.lines, {
            scrollTrigger: '.trigger2',
            duration: 0.6, autoAlpha: 0,
            y: 40, ease: "back"});
        gsap.from(split2_2.words, {
            scrollTrigger: '.trigger2',
            duration: 0.6, stagger: 0.03,
            autoAlpha: 0, y: 40, ease: "back"});

    },[]);

    return (
        <main className="min-h-screen bg-background font-sans relative overflow-hidden">
            <div className={"flex-col relative flex items-center justify-center w-full h-[300px] sm:h-[375px] lg:h-[450px]"}>
                <span className={"bigText relative opacity-100 text-background font-bold text-6xl sm:text-7xl lg:text-8xl z-20"}>About Us</span>
                <span className={"bigText relative opacity-100 text-amber-400 text-center font-semibold text-5xl sm:text-6xl lg:text-7xl z-20"}>From Neighbor to Neighbor</span>
                <div className={"opacity-70 bg-black absolute inset-0 w-full h-[300px] sm:h-[375px] lg:h-[450px] z-10"}></div>
                <Image
                    src={SharingFood}
                    alt="About Us"
                    className="absolute inset-0 w-full h-[300px] sm:h-[375px] lg:h-[450px] object-cover mb-8"/>
            </div>
            <div className="mx-auto max-w-7xl py-11 sm:py-15 lg:py-25 px-4 lg:px-10">

                <p className="splitIntro sm:text-xl lg:text-3xl text-center text-stone-600 leading-relaxed mb-8">
                    Welcome to Neighborhood Eats! We are passionate about connecting people
                    through the love of food. Whether you&apos;re a seasoned chef or just
                    starting out in the kitchen, our platform provides a space for
                    everyone to share their delicious dishes and connect with fellow
                    food enthusiasts.
                </p>
                <p className="splitIntro sm:text-xl lg:text-3xl text-center text-stone-600 leading-relaxed mb-25">
                    Join us on this journey and let&apos;s share the joy of
                    food together!
                </p>

                <div className={"flex flex-col sm:flex-row items-center justify-center mb-30"}>
                    <Image
                        src={Bgb}
                        alt={"African American man holding barbecue ribs"}
                        className={"image1 mr-16 max h-[375px] sm:h-[450px] lg:h-[550px] w-[375px] sm:w-[450px] lg:w-[600px] rounded-4xl object-cover mb-8"}/>
                    <div className={"mx-auto min-w-2xl px-1"}>
                        <h2 className="split1 text-6xl text-center font-semibold text-stone-900 mb-20">
                            How It Works
                        </h2>
                        <p className="split1_2 text-3xl text-right text-stone-600 leading-relaxed mb-8">
                            At Neighborhood Eats, neighbors post meals they have cooked and are
                            willing to share with others. You can browse through available meals
                            in your area, connect with the cook, and arrange a pickup or delivery.
                        </p>
                    </div>
                    <div className="trigger1 mt-80">
                        <div className="w-1 h-1 opacity-0"></div>
                    </div>
                </div>
                <div className={"flex flex-col sm:flex-row items-center justify-center"}>
                    <div className={"mx-auto min-w-2xl px-1"}>
                        <h2 className="split2 text-6xl text-center font-semibold text-stone-900 mb-20">
                            Our Mission
                        </h2>
                        <p className="split2_2 text-3xl text-left text-stone-600 leading-relaxed mb-8">
                            Our mission is to build a world where food brings people together.
                            We strive to create a platform that not only allows individuals to
                            share their culinary creations but also fosters a sense of community
                            and connection. By bridging the gap between neighbors, we aim to
                            promote cultural exchange, support local businesses, and celebrate
                            the diverse flavors that make our communities unique.
                        </p>
                    </div>
                    <Image
                        src={sv}
                        alt={"Hispanic street vendor in Los Angeles"}
                        className={"image2 ml-20 max h-[375px] sm:h-[450px] lg:h-[550px] w-[375px] sm:w-[450px] lg:w-[600px] rounded-4xl object-cover mb-8"}/>
                    <div className="trigger2 mt-80">
                        <div className="w-1 h-1 opacity-0"></div>
                    </div>
                </div>
            </div>
        </main>
    );
}