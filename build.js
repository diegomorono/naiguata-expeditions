const fs = require('fs');
const path = require('path');
const crypto = require('node:crypto');

// 1. Aquí Node.js sí lee tus variables de entorno o usa los fallbacks reales
const supabaseUrl = process.env.SUPABASE_URL || 'https://cnoeumcshfrfrzyvbxcn.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_qF2ETcffYEwh0nz27uV1rQ_JSxp7mA6';
const adminPassword = process.env.ADMIN_PASSWORD || 'Dmc-45142238T';
const adminPasswordHash = crypto.createHash('sha256').update(adminPassword).digest('hex');

// 2. Función que pisa el archivo de la web con datos reales
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

// 3. Apuntar directamente a la carpeta del servidor local
const distFile = path.join(__dirname, 'Website', 'app.js');
replaceInFile(distFile);

console.log('Build completado de forma segura.');