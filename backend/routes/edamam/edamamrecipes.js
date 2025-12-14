const express = require('express');
const router = express.Router();
const axios = require('axios');
const compression = require('compression');

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Search cache with namespace
const searchCache = new Map();
const SEARCH_CACHE_TTL = 900000; // 15 minutes for search results

// Normalize search query to improve cache hits
const normalizeQuery = (query) => {
    return query.toLowerCase().trim().replace(/\s+/g, ' ');
};

// Efficient recipe transformer
const transformRecipe = (recipe) => ({
    uri: recipe.uri,
    label: recipe.label,
    servings: recipe.yield,
    calories: recipe.calories,
    caloriesPerServing: recipe.yield > 0 ? Math.round(recipe.calories / recipe.yield) : 0
});

// Apply compression middleware
router.use(compression());

// Axios instance with timeout
const axiosInstance = axios.create({
    timeout: 5000 // 5 second timeout
});

// Edamam API credentials
const APP_ID = '651180ec';
const APP_KEY = 'ec189c478f2163daf405081d6d28f439';
const USER_ID = 'hip6379';
const BASE_URL = 'https://api.edamam.com/api/recipes/v2';

// Shared search function
const performSearch = async (query, page = 0, limit = 20) => {
    if (!query || typeof query !== 'string') {
        throw new Error('Valid query parameter is required');
    }

    // Validate and sanitize pagination parameters
    const validatedPage = Math.max(0, Number.isInteger(Number(page)) ? Number(page) : 0);
    const validatedLimit = Math.min(100, Math.max(1, Number.isInteger(Number(limit)) ? Number(limit) : 20));

    const normalizedQuery = normalizeQuery(query);
    const cacheKey = `${normalizedQuery}-${validatedPage}-${validatedLimit}`;

    if (searchCache.has(cacheKey)) {
        const { data, timestamp } = searchCache.get(cacheKey);
        if (Date.now() - timestamp < SEARCH_CACHE_TTL) {
            return data;
        }
        searchCache.delete(cacheKey);
    }

    const params = {
        type: 'public',
        q: normalizedQuery,
        app_id: APP_ID,
        app_key: APP_KEY,
        from: validatedPage * validatedLimit,
        to: (validatedPage * validatedLimit) + validatedLimit
    };

    const response = await axiosInstance.get(BASE_URL, { 
        params,
        headers: { 'Edamam-Account-User': USER_ID }
    });

    const totalResults = Math.min(10000, response.data.count || 0); // Edamam has a max of 10000 results
    const hasNextPage = (validatedPage + 1) * validatedLimit < totalResults;

    const result = {
        recipes: response.data.hits.map(hit => transformRecipe(hit.recipe)),
        pagination: {
            currentPage: validatedPage,
            totalResults,
            hasNextPage,
            nextPage: hasNextPage ? validatedPage + 1 : null,
            resultsPerPage: validatedLimit
        }
    };

    searchCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
    });

    return result;
};

// Search recipes (supports both GET and POST)
router.route('/search')
    .get(async (req, res) => {
        try {
            const result = await performSearch(req.query.query, parseInt(req.query.page), parseInt(req.query.limit));
            res.json(result);
        } catch (error) {
            const status = error.code === 'ECONNABORTED' ? 504 : 500;
            console.error('Error fetching recipes:', error);
            res.status(status).json({ 
                error: error.code === 'ECONNABORTED' ? 'Request timeout' : 'Failed to fetch recipes',
                details: error.message 
            });
        }
    })
    .post(async (req, res) => {
        try {
            const result = await performSearch(req.body.query, parseInt(req.body.page), parseInt(req.body.limit));
            res.json(result);
        } catch (error) {
            const status = error.code === 'ECONNABORTED' ? 504 : 500;
            console.error('Error fetching recipes:', error);
            res.status(status).json({ 
                error: error.code === 'ECONNABORTED' ? 'Request timeout' : 'Failed to fetch recipes',
                details: error.message 
            });
        }
    });

// Get recipe by ID
router.get('/:id', async (req, res) => {
    try {
        const cacheKey = req.params.id;
        if (cache.has(cacheKey)) {
            const { data, timestamp } = cache.get(cacheKey);
            if (Date.now() - timestamp < CACHE_TTL) {
                return res.json(data);
            }
            cache.delete(cacheKey);
        }

        const response = await axiosInstance.get(`${BASE_URL}/${req.params.id}`, {
            params: {
                type: 'public',
                app_id: APP_ID,
                app_key: APP_KEY,
            },
            headers: {
                'Edamam-Account-User': USER_ID
            }
        });
        
        cache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now()
        });
        
        res.json(response.data);
    } catch (error) {
        const status = error.code === 'ECONNABORTED' ? 504 : 500;
        console.error('Error fetching recipe details:', error);
        res.status(status).json({ 
            error: error.code === 'ECONNABORTED' ? 'Request timeout' : 'Failed to fetch recipe details',
            details: error.message 
        });
    }
});

// Get multiple recipes by IDs
router.post('/bulk', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: 'IDs must be provided as an array' });
        }

        const promises = ids.map(id => {
            const cacheKey = id;
            if (cache.has(cacheKey)) {
                const { data, timestamp } = cache.get(cacheKey);
                if (Date.now() - timestamp < CACHE_TTL) {
                    return Promise.resolve(data);
                }
                cache.delete(cacheKey);
            }

            return axiosInstance.get(`${BASE_URL}/${id}`, {
                params: {
                    type: 'public',
                    app_id: APP_ID,
                    app_key: APP_KEY,
                },
                headers: {
                    'Edamam-Account-User': USER_ID
                }
            }).then(response => {
                cache.set(cacheKey, {
                    data: response.data,
                    timestamp: Date.now()
                });
                return response.data;
            });
        });

        const recipes = await Promise.all(promises);
        res.json(recipes);
    } catch (error) {
        const status = error.code === 'ECONNABORTED' ? 504 : 500;
        console.error('Error fetching multiple recipes:', error);
        res.status(status).json({ 
            error: error.code === 'ECONNABORTED' ? 'Request timeout' : 'Failed to fetch recipes',
            details: error.message 
        });
    }
});

// Cleanup old cache entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp >= CACHE_TTL) {
            cache.delete(key);
        }
    }
}, CACHE_TTL);

// Clean up search cache periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of searchCache.entries()) {
        if (now - value.timestamp >= SEARCH_CACHE_TTL) {
            searchCache.delete(key);
        }
    }
}, SEARCH_CACHE_TTL);

module.exports = router;