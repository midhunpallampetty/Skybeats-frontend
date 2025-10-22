'use client';
import Head from 'next/head';
import { signIn } from 'next-auth/react';
const GoogleButton: React.FC = () => {
  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
        />
      </Head>
      <button onClick={() => signIn('google')} style={buttonStyle}>
        <i className="fab fa-google" style={iconStyle}></i> Sign in with Google
      </button>
    </>
  );
};

const buttonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#4285F4',
  color: 'white',
  border: 'none',
  
  borderRadius: '10px',
  padding: '10px 20px',
  fontSize: '16px',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
  width: '100%',
  maxWidth: '400px',
  margin: '0 auto', 
};

const iconStyle = {
  marginRight: '10px',
};

export default GoogleButton;
