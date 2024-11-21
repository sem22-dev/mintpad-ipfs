// server.js
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Define a route to fetch data from the external API
app.get('/api/getmintpadpoints', async (req, res) => {
  try {
    // Fetch data from the external API
    const response = await axios.get('https://taiko-trailblazers.vercel.app/api/collector');
    
    // Send the data as the response
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Failed to fetch data' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
