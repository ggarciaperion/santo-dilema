#!/usr/bin/env node

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PUBLIC_DIR = join(__dirname, '..', 'public');

// Configuración de optimización
const OPTIMIZATION_CONFIG = {
  png: {
    quality: 85,
    compressionLevel: 9,
    effort: 10
  },
  jpg: {
    quality: 85,
    mozjpeg: true
  }
};

async function getFileSize(filePath) {
  const stats = await stat(filePath);
  return stats.size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function optimizeImage(filePath) {
  const ext = extname(filePath).toLowerCase();
  const originalSize = await getFileSize(filePath);

  console.log(`\n📸 Optimizando: ${filePath.split('public/')[1]}`);
  console.log(`   Tamaño original: ${formatBytes(originalSize)}`);

  try {
    if (ext === '.png') {
      await sharp(filePath)
        .png({
          quality: OPTIMIZATION_CONFIG.png.quality,
          compressionLevel: OPTIMIZATION_CONFIG.png.compressionLevel,
          effort: OPTIMIZATION_CONFIG.png.effort
        })
        .toFile(filePath + '.optimized');
    } else if (ext === '.jpg' || ext === '.jpeg') {
      await sharp(filePath)
        .jpeg({
          quality: OPTIMIZATION_CONFIG.jpg.quality,
          mozjpeg: OPTIMIZATION_CONFIG.jpg.mozjpeg
        })
        .toFile(filePath + '.optimized');
    } else {
      return; // Skip unsupported formats
    }

    const optimizedSize = await getFileSize(filePath + '.optimized');
    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

    console.log(`   Tamaño optimizado: ${formatBytes(optimizedSize)}`);
    console.log(`   ✅ Ahorro: ${savings}% (${formatBytes(originalSize - optimizedSize)})`);

    // Replace original with optimized
    const fs = await import('fs/promises');
    await fs.unlink(filePath);
    await fs.rename(filePath + '.optimized', filePath);

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
}

async function processDirectory(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        await optimizeImage(fullPath);
      }
    }
  }
}

async function main() {
  console.log('🚀 Iniciando optimización de imágenes...\n');
  console.log(`📁 Directorio: ${PUBLIC_DIR}\n`);

  const startTime = Date.now();

  await processDirectory(PUBLIC_DIR);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n✨ Optimización completada!');
  console.log(`⏱️  Tiempo total: ${duration}s`);
  console.log('\n💡 Ahora las imágenes cargarán mucho más rápido!\n');
}

main().catch(console.error);
