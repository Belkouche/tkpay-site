import type { NextApiRequest, NextApiResponse } from 'next';
import { generateCSRFToken } from '@/lib/csrf-protection';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use GET.' 
    });
  }

  try {
    const token = generateCSRFToken();
    res.status(200).json({ token });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate CSRF token' 
    });
  }
}