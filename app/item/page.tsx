import React from 'react';

export default function ItemPage() {
    const foodItem = {
        name: 'Cheese Pizza',
        description: 'A tasty pizza with fresh ingredients and a crispy crust.',
        location: 'New York, NY',
        sellerName: 'Pizza Guy',
        sellerLogo: '/TEMPLATEsellerlogo.png',
        price: 12.99,
        imageUrl: '/TEMPLATEpizza.png',
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'Arial, sans-serif', padding: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <img
                    src={foodItem.imageUrl}
                    alt={foodItem.name}
                    style={{ width: '400px', borderRadius: '10px' }}
                />
                <div style={{ marginLeft: '30px', border: '1px solid #ccc', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)' }}>
                    <h1 style={{ fontSize: '3em', fontWeight: 'bolder' }}>{foodItem.name}</h1>
                    <p style={{ fontSize: '1.2em' }}>{foodItem.description}</p>
                    <p style={{ fontSize: '1.2em' }}><strong>Location: </strong>{foodItem.location}</p>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                        <img
                            src={foodItem.sellerLogo}
                            alt="Seller Logo"
                            style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '10px' }}
                        />
                        <p style={{ fontSize: '1.2em', fontWeight: 'bold' }}>Seller: {foodItem.sellerName}</p>
                    </div>
                    <p style={{ fontWeight: 'bold', fontSize: '1.2em' }}>Price: ${foodItem.price.toFixed(2)}</p>
                    <button
                        style={{
                            padding: '15px 30px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '1.1em',
                        }}
                    >
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
}
