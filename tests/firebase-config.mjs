import assert from 'node:assert/strict';
import {parseFirebaseConfig,hasFirebaseConfig} from '../services/firebase-config.js';

assert.equal(parseFirebaseConfig('not-json'),null);
assert.equal(parseFirebaseConfig('null'),null);
assert.equal(parseFirebaseConfig({apiKey:'',authDomain:'x',projectId:'x',appId:'x'}),null);
const valid={apiKey:'public-api-key',authDomain:'pico.example',projectId:'pico-test',appId:'1:web:abc'};
assert.deepEqual(parseFirebaseConfig(JSON.stringify(valid)),valid);
assert.equal(hasFirebaseConfig(),false,'No Firebase configuration is present in the test runtime.');
console.log('PASS: Firebase configuration validation and safe disabled state without credentials.');
