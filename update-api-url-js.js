// Script pour remplacer toutes les occurrences de l'URL conditionnelle par l'URL unique
const fs = require('fs');
const path = require('path');

// Fonction pour parcourir récursivement un répertoire
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

// Fonction pour remplacer le contenu dans un fichier
function replaceInFile(filePath) {
  // Ne traiter que les fichiers JS
  if (!filePath.endsWith('.js')) return;

  console.log(`Traitement du fichier: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remplacer l'URL fixe dans login/page.js
    let modified = content.replace(
      /const apiBaseUrl = "http:\/\/localhost:5000";/g,
      'const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;'
    );
    
    // Remplacer toutes les occurrences de l'URL conditionnelle (avec différentes variations d'espaces)
    const regex = /const apiBaseUrl = process\.env\.NEXT_PUBLIC_API_URL \|\| \(window\.location\.hostname === ['"]localhost['"] \|\| window\.location\.hostname === ['"]127\.0\.0\.1['"][\s\n]*\?[\s\n]*['"]http:\/\/localhost:5000['"][\s\n]*:[\s\n]*window\.location\.origin\);/g;
    
    modified = modified.replace(regex, 'const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;');
    
    // Remplacer les commentaires
    modified = modified.replace(
      /\/\/ Utiliser la variable d'environnement en priorité/g,
      '// Utiliser uniquement l\'URL du backend en ligne'
    );
    
    // Écrire le contenu modifié si des changements ont été effectués
    if (content !== modified) {
      fs.writeFileSync(filePath, modified, 'utf8');
      console.log(`✅ Modifications appliquées dans: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors du traitement du fichier ${filePath}:`, error);
    return false;
  }
}

// Répertoire source
const srcDir = path.join(__dirname, 'src');

console.log("Mise à jour des URLs du backend...");

// Compter les fichiers modifiés
let modifiedCount = 0;

// Parcourir tous les fichiers dans le répertoire src
walkDir(srcDir, (filePath) => {
  if (replaceInFile(filePath)) {
    modifiedCount++;
  }
});

console.log(`\nMise à jour terminée. ${modifiedCount} fichier(s) modifié(s).`);
console.log("\nN'oubliez pas de configurer la variable d'environnement NEXT_PUBLIC_API_URL");
console.log("dans votre fichier .env.local ou dans votre environnement de déploiement."); 