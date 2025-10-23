import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

 const authenticateToken = async (
  req: NextApiRequest,
  res: NextApiResponse,
  next: Function
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Extract Bearer token
  console.log('header',token)
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Token missing' });
  }

  try {
    
    const response = await axios.post(
      'https://skybeatscloud.upskillr.online/api/validateToken', 
      { token }, 
      { headers: { 'Content-Type': 'application/json' } }
    );
console.log('database',response.data)
    if (response.data?.success===true) {
      console.log('hai')
      next(); // Proceed to the handler
    } else {
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
  }catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error verifying token:', error.message);
      return res.status(500).json({ message: 'Internal server error during token verification' });
    } else {
      console.error('Unknown error verifying token:', error);
      return res.status(500).json({ message: 'An unknown error occurred during token verification' });
    }
  }
  
};
export default authenticateToken;