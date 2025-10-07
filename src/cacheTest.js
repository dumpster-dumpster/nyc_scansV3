// Simple test file to check if the cache works
import { getFromIndexedDB, saveToIndexedDB, generateSplatCacheKey } from './splatCache.js';

console.log('Testing cache functionality...');

// Test the cache
async function testCache() {
    try {
        const testKey = 'test_key';
        const testData = new Uint8Array([1, 2, 3, 4]);
        
        console.log('Saving test data...');
        await saveToIndexedDB(testKey, testData, { test: true });
        
        console.log('Retrieving test data...');
        const retrieved = await getFromIndexedDB(testKey);
        
        if (retrieved) {
            console.log('✅ Cache test successful!', retrieved);
        } else {
            console.log('❌ Cache test failed - no data returned');
        }
    } catch (error) {
        console.error('❌ Cache test failed:', error);
    }
}

testCache();