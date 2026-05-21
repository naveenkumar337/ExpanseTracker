const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const settingsContent = `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
`;

const fixes = [
  // Fix 1: Add settings.gradle.kts to expo-dev-launcher-gradle-plugin
  {
    file: 'node_modules/expo-dev-launcher/expo-dev-launcher-gradle-plugin/settings.gradle.kts',
    action: 'create',
    content: settingsContent
  },
  // Fix 2: Comment out useExpoPublishing() in expo/android/build.gradle
  {
    file: 'node_modules/expo/android/build.gradle',
    action: 'replace',
    search: /^useExpoPublishing\(\)$/m,
    replace: '// useExpoPublishing() // Disabled for local build'
  },
  // Fix 3: Comment out useExpoPublishing() in expo-modules-core/android/build.gradle
  {
    file: 'node_modules/expo-modules-core/android/build.gradle',
    action: 'replace',
    search: /^useExpoPublishing\(\)$/m,
    replace: '// useExpoPublishing() // Disabled for local build'
  },
  // Fix 4: Comment out foojay plugin in @react-native/gradle-plugin/settings.gradle.kts
  {
    file: 'node_modules/@react-native/gradle-plugin/settings.gradle.kts',
    action: 'replace',
    search: /^plugins \{ id\("org\.gradle\.toolchains\.foojay-resolver-convention"\)\.version\("[^"]+"\) \}$/m,
    replace: '// plugins { id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0") } // Disabled for local build'
  },
  // Fix 5: Add mavenCentral to react-native-vector-icons buildscript repositories (fixes SSL issues)
  {
    file: 'node_modules/react-native-vector-icons/android/build.gradle',
    action: 'replace',
    search: /google\(\)\s+gradlePluginPortal\(\)/,
    replace: 'google()\n        mavenCentral()\n        gradlePluginPortal()'
  }
];

console.log('Applying Gradle fixes for Android build...\n');

fixes.forEach((fix, index) => {
  const filePath = path.join(rootDir, fix.file);
  
  try {
    if (fix.action === 'create') {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        console.log(`  Skipping ${fix.file} - directory not found`);
        return;
      }
      fs.writeFileSync(filePath, fix.content, 'utf8');
      console.log(`✓ Created: ${fix.file}`);
    } else if (fix.action === 'replace') {
      if (!fs.existsSync(filePath)) {
        console.log(`  Skipping ${fix.file} - file not found`);
        return;
      }
      let content = fs.readFileSync(filePath, 'utf8');
      if (fix.search.test(content)) {
        content = content.replace(fix.search, fix.replace);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Fixed: ${fix.file}`);
      } else {
        console.log(`  Already fixed or not needed: ${fix.file}`);
      }
    }
  } catch (err) {
    console.error(`✗ Error fixing ${fix.file}:`, err.message);
  }
});

console.log('\nGradle fixes applied successfully!');
