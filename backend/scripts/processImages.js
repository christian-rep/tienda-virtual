const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const db = require('../config/db');

async function createThumbnail(sourcePath, targetPath, width = 200) {
    try {
        await sharp(sourcePath)
            .resize(width, null, {
                fit: 'contain',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toFile(targetPath);
    } catch (error) {
        console.error(`Error al crear miniatura para ${sourcePath}:`, error);
    }
}

async function processImages() {
    try {
        // Obtener todas las plantas activas
        const [plantas] = await db.query('SELECT id, nombre_cientifico FROM plantas WHERE activo = 1');
        
        // Directorio base de imágenes
        const baseDir = path.join(__dirname, '../../frontend/src/assets/images/plantas');
        
        // Procesar cada planta
        for (const planta of plantas) {
            console.log(`Procesando planta: ${planta.nombre_cientifico}`);
            
            // Crear estructura de directorios
            const plantaDir = path.join(baseDir, planta.id);
            const detallesDir = path.join(plantaDir, 'detalles');
            const thumbnailsDir = path.join(plantaDir, 'thumbnails');
            
            // Crear directorios si no existen
            [plantaDir, detallesDir, thumbnailsDir].forEach(dir => {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
            });
            
            // Buscar la imagen correspondiente
            const imagenNombre = `${planta.nombre_cientifico}.jpg`;
            const imagenPath = path.join(baseDir, imagenNombre);
            
            if (fs.existsSync(imagenPath)) {
                // Mover la imagen al directorio de la planta como principal
                const principalPath = path.join(plantaDir, 'principal.jpg');
                fs.copyFileSync(imagenPath, principalPath);
                
                // Crear miniatura de la imagen principal
                const thumbnailPath = path.join(thumbnailsDir, 'principal.jpg');
                await createThumbnail(principalPath, thumbnailPath);
                
                // Actualizar la base de datos
                await db.query(
                    'INSERT INTO imagenes_plantas (planta_id, url, orden, es_principal) VALUES (?, ?, 0, 1)',
                    [planta.id, `assets/images/plantas/${planta.id}/principal.jpg`]
                );
                
                console.log(`✅ Procesada imagen principal para ${planta.nombre_cientifico}`);
            } else {
                console.log(`⚠️ No se encontró imagen para ${planta.nombre_cientifico}`);
            }
        }
        
        console.log('✨ Proceso completado');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

processImages(); 