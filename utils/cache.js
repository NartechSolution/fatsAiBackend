const NodeCache = require('node-cache');

// Initialize cache with a default TTL (Time To Live) of 1 hour (3600 seconds)
// and check for expired keys every 600 seconds
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

module.exports = {
    /**
     * Get a value from the cache
     * @param {string} key 
     * @returns {*} The cached value or undefined
     */
    get: (key) => cache.get(key),

    /**
     * Set a value in the cache
     * @param {string} key 
     * @param {*} value 
     * @param {number} [ttl] - Optional custom TTL in seconds
     * @returns {boolean} true on success
     */
    set: (key, value, ttl) => cache.set(key, value, ttl),

    /**
     * Delete a key from the cache
     * @param {string} key 
     * @returns {number} Number of deleted entries
     */
    del: (key) => cache.del(key),

    /**
     * Flush all data from the cache
     */
    flush: () => cache.flushAll(),

    /**
     * Get cache statistics
     * @returns {object} Stats object
     */
    getStats: () => cache.getStats(),

    /**
     * Get usage keys
     * @returns {Array} List of all keys
     */
    keys: () => cache.keys(),

    // access to raw instance if needed
    instance: cache
};
