import { parentPort, workerData } from 'node:worker_threads';
import { env, pipeline } from '@huggingface/transformers';
import { EMBEDDING_MODEL } from './search.types.js';
import type { EmbeddingRequest } from './search.types.js';

if (!parentPort) throw new Error('Embedding must run in a worker thread.');
const port = parentPort;
env.cacheDir = workerData.cacheDir;
env.allowRemoteModels = workerData.allowRemoteModels;
// Keep inference from saturating all cores used by the existing API.
if (env.backends.onnx.wasm) env.backends.onnx.wasm.numThreads = 1;
let extractor: ReturnType<typeof pipeline<'feature-extraction'>> | undefined;
let queue = Promise.resolve();

port.on('message', (request: EmbeddingRequest) => {
  queue = queue.then(async () => {
    try {
      extractor ??= pipeline<'feature-extraction'>('feature-extraction', EMBEDDING_MODEL, {
        dtype: 'q8', device: 'cpu',
        session_options: { intraOpNumThreads: 1, interOpNumThreads: 1 },
      });
      const model = await extractor;
      const output = await model(request.text, { pooling: 'mean', normalize: true });
      port.postMessage({ id: request.id, vector: Array.from(output.data as Float32Array) });
    } catch (error) {
      extractor = undefined;
      port.postMessage({ id: request.id, error: error instanceof Error ? error.message : 'Embedding failed' });
    }
  });
});
