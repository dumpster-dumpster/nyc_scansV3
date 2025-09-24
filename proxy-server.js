const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors());

app.get('/proxy/drive/:fileId', async (req, res) => {
  const fileId = req.params.fileId;
  const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  try {
    console.log('Proxying request to:', driveUrl);
    const response = await fetch(driveUrl);
    
    if (!response.ok) {
      throw new Error(`Drive API responded with status: ${response.status}`);
    }
    
    // Forward the content type
    res.set('Content-Type', response.headers.get('Content-Type'));
    res.set('Content-Length', response.headers.get('Content-Length'));
    
    // Pipe the response
    response.body.pipe(res);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch from Google Drive' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});