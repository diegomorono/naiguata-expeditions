const fs = require('fs');
const path = require('path');
const crypto = require('node:crypto');

// 1. Leer las variables de entorno de forma estricta
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !supabaseAnonKey || !adminPassword) {
  throw new Error('Faltan variables de entorno requeridas: SUPABASE_URL, SUPABASE_ANON_KEY o ADMIN_PASSWORD. Revisa tu configuración.');
}

const adminPasswordHash = crypto.createHash('sha256').update(adminPassword).digest('hex');

// 2. Función que pisa el archivo de configuración con datos reales
function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: No se encontró el archivo en ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Cambiamos los marcadores limpios por los strings reales
  content = content.replace('__SUPABASE_URL__', supabaseUrl);
  content = content.replace('__SUPABASE_ANON_KEY__', supabaseAnonKey);
  content = content.replace('__ADMIN_PASSWORD_HASH__', adminPasswordHash);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Procesado con éxito: ${filePath}`);
}

// 3. Apuntar ÚNICAMENTE al archivo consolidado de configuración env.js
const envFile = path.join(__dirname, 'Website', 'src', 'config', 'env.js');

// Ejecutar el reemplazo unificado
replaceInFile(envFile);

console.log('Build completado de forma segura.');