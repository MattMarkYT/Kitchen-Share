import Image from "next/image";
import Link from "next/link";
import React from "react";
import styles from './ui/testStyle.module.css'
import {root} from "postcss";

export function MyButton(props) {
    return (
        <div className={styles.roundedBox} style={{color: props.color, borderRadius: '20px', borderColor: 'var(--foregroundColor)', width: '100px', height: '50px'}}>
            <button className={styles.test} style={{color: props.color, borderRadius: '3px', borderColor: 'var(--foregroundColor)', fontSize: 'x-large',}}>
                {props.label}
            </button>
        </div>

    );
}

export default function Home2() {
    let register: boolean = false;
    let myLabel: string = "Sign in";
    if (register)
        myLabel = "Sign up";


    return (
        <div className={styles.test}>
            <h1 style={{fontSize:"xxx-large"}}>Food Available</h1>
        </div>
    );
}
