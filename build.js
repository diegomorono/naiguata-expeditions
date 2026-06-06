const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const srcDir = path.join(__dirname, 'Website');
const destDir = path.join(__dirname, 'dist');

if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}

copyDir(srcDir, destDir);

const supabaseUrl = process.env.SUPABASE_URL || 'https://cnoeumcshfrfrzyvbxcn.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_qF2ETcffYEwh0nz27uV1rQ_JSxp7mA6';
const adminPassword = process.env.ADMIN_PASSWORD || 'Dmc-45142238T';

const adminPasswordHash = crypto.createHash('sha256').update(adminPassword).digest('hex');

const replaceInFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/__SUPABASE_URL__/g, supabaseUrl);
  content = content.replace(/__SUPABASE_ANON_KEY__/g, supabaseAnonKey);
  content = content.replace(/__ADMIN_PASSWORD_HASH__/g, adminPasswordHash);
  fs.writeFileSync(filePath, content, 'utf8');
};

replaceInFile(path.join(destDir, 'app.js'));
replaceInFile(path.join(destDir, 'admin', 'admin.js'));

console.log('Build completed successfully.');
