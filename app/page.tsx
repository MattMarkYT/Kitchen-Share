import Image from "next/image";
import Link from "next/link";
import React from "react";
import styles from './ui/testStyle.module.css'
import {root} from "postcss";

// This is just example
export function MyButton(props) {
    return (
        <div className={styles.roundedBox} style={{color: props.color, borderRadius: '25px', borderColor: 'black', width: '100px', height: '50px', marginTop: '5px'}}>
            <button className={styles.test} style={{color: 'white', fontSize: 'x-large'}}>
                {props.label}
            </button>
        </div>
    );
}

export default function Home() {
  return (
      <div className={styles.test}>
          <div className={styles.roundedBox} style={{ marginTop : "2%", width: "30%" }}>

              <h1 style={{
                  color: 'var(--background)',
              }}>Kitchen Share</h1>
          </div>
          <p>
              Join the neighborhood-wide potluck!
          </p>
          <Link href="/page2" style={
              {color: '#0077ee'}
          }>Need an account?</Link>
          <MyButton label="Bruh1" color="var(--background)"/>
          <MyButton label="Bruh2" color="#900090"/>
      </div>
  );
}
