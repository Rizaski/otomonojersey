// Health check endpoint for Vercel
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Jersey OMS',
    version: '1.0.0'
  });
}
