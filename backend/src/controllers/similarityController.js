const axios = require('axios');
const FormData = require('form-data');
const mongoose = require('mongoose');
const Clothing = require('../models/Clothing');

exports.checkSimilarity = async (req, res) => {
  try {
    // 1. Get the requested threshold from the frontend, default to 70% (0.70)
    const requestedThreshold = req.body.threshold ? parseFloat(req.body.threshold) : 0.7;
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ message: 'Wishlist image is required for similarity check.' });
    }

    // 2. Forward the image to your Python AI Microservice
    const formData = new FormData();
    formData.append('image_file', req.file.buffer, req.file.originalname);

    // Ensure this URL points to your running Python FastAPI service
    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/api/ai/embed`, formData, {
      headers: formData.getHeaders(),
    });

    const wishlistEmbedding = aiResponse.data.embedding;

    // 3. Search the user's existing wardrobe using Atlas Vector Search
    const results = await Clothing.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'aiEmbedding',
          queryVector: wishlistEmbedding,
          numCandidates: 100,
          limit: 20,
          filter: { userId: new mongoose.Types.ObjectId(userId) },
        },
      },
      {
        $project: {
          name: 1,
          imageUrl: 1,
          category: 1,
          // Extract the similarity score provided by MongoDB
          score: { $meta: 'vectorSearchScore' },
        },
      },
      {
        // 4. Filter by the user's selected threshold (e.g., >= 0.70)
        $match: {
          score: { $gte: requestedThreshold },
        },
      },
      {
        $sort: { score: -1 }, // Sort highest match first
      },
    ]);

    // 5. Format the results for the React Native frontend
    const formattedMatches = results.map((item) => ({
      id: item._id,
      name: item.name,
      imageUrl: item.imageUrl,
      // Convert 0.8542 to "85%" for easy UI rendering
      similarityRate: `${Math.round(item.score * 100)}%`,
    }));

    return res.status(200).json({
      message: 'Similarity check complete',
      matchesFound: formattedMatches.length > 0,
      matches: formattedMatches,
    });
  } catch (error) {
    console.error('Similarity Check Error:', error);
    return res.status(500).json({ message: 'Failed to perform AI similarity check.' });
  }
};
