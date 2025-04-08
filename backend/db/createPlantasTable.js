const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function createPlantasTable() {
  try {
    console.log('Creando tabla de plantas...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'plantas.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Dividir el archivo SQL en instrucciones individuales
    const statements = sql
      .replace(/--.*?\n/g, '') // Eliminar comentarios
      .split(';')
      .filter(statement => statement.trim().length > 0);
    
    // Ejecutar cada instrucción SQL
    for (const statement of statements) {
      await db.query(statement);
      console.log('Instrucción SQL ejecutada con éxito');
    }
    
    console.log('✅ Tabla de plantas creada y poblada con éxito');
    
    // Verificar que la tabla se ha creado correctamente
    const [plantas] = await db.query('SELECT * FROM plantas');
    console.log(`Se han agregado ${plantas.length} plantas a la base de datos`);
    
    // Mostrar las plantas agregadas
    console.log('Plantas agregadas:');
    plantas.forEach(planta => {
      console.log(`- ${planta.nombre} (${planta.tipoPlanta})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear la tabla de plantas:', error);
    process.exit(1);
  }
}

// Ejecutar la función
createPlantasTable(); 