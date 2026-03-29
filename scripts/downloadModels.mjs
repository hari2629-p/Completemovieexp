/**
 * downloadModels.mjs
 * Downloads face-api.js model weights into public/models/
 * Run: npm run download-models
 */

import { createWriteStream, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import https from 'https'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MODELS_DIR = join(__dirname, '..', 'public', 'models')
const BASE_URL =
  'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'

const MODEL_FILES = [
  // SSD Mobilenet V1
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  // Tiny Face Detector
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  // Face Expression
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
]

if (!existsSync(MODELS_DIR)) {
  mkdirSync(MODELS_DIR, { recursive: true })
  console.log(`Created ${MODELS_DIR}`)
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (existsSync(dest)) {
      console.log(`  skip (exists): ${dest.split(/[\\/]/).pop()}`)
      return resolve()
    }
    const file = createWriteStream(dest)
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close()
        return download(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        file.close()
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
    }).on('error', (err) => { file.close(); reject(err) })
  })
}

console.log('Downloading face-api.js models…\n')

for (const fileName of MODEL_FILES) {
  const url = `${BASE_URL}/${fileName}`
  const dest = join(MODELS_DIR, fileName)
  process.stdout.write(`  ↓ ${fileName} … `)
  try {
    await download(url, dest)
    console.log('done')
  } catch (err) {
    console.error(`FAILED: ${err.message}`)
    process.exit(1)
  }
}

console.log('\n✅ All models downloaded to public/models/')
