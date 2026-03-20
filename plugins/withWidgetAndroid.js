const {
  createRunOncePlugin,
  withAndroidManifest,
  withDangerousMod,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const withWidgetAndroid = (config) => {
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    
    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }
    
    // Проверяем, есть ли уже ресивер
    const hasWidgetReceiver = mainApplication.receiver.some(
      receiver => receiver.$ && receiver.$['android:name'] === '.widget.NotesWidget'
    );
    
    if (!hasWidgetReceiver) {
      mainApplication.receiver.push({
        $: {
          'android:name': '.widget.NotesWidget',
          'android:exported': 'true'
        },
        'intent-filter': [{
          action: [{
            $: {
              'android:name': 'android.appwidget.action.APPWIDGET_UPDATE'
            }
          }]
        }],
        'meta-data': [{
          $: {
            'android:name': 'android.appwidget.provider',
            'android:resource': '@xml/notes_widget_info'
          }
        }]
      });
      console.log('✅ Widget receiver added to AndroidManifest.xml');
    }
    
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const platformRoot = path.join(config.modRequest.platformProjectRoot, 'app/src/main');
      
      // Получаем package name из конфига
      const packageName = config.android.package || 'com.mkhailksk.famnotes';
      console.log('📦 Package name:', packageName);
      
      // Путь для Java файлов
      const packagePath = packageName.replace(/\./g, '/');
      const targetJavaDir = path.join(platformRoot, 'java', packagePath, 'widget');
      
      // Путь для ресурсов
      const targetResDir = path.join(platformRoot, 'res');
      
      // Путь к исходным файлам виджета
      const widgetJavaDir = path.join(config.modRequest.projectRoot, 'widgets/android/src/main/java', packagePath, 'widget');
      const widgetResDir = path.join(config.modRequest.projectRoot, 'widgets/android/src/main/res');
      
      console.log('📂 Copying widget files:');
      console.log('  From (java):', widgetJavaDir);
      console.log('  To (java):', targetJavaDir);
      console.log('  From (res):', widgetResDir);
      console.log('  To (res):', targetResDir);
      
      // Создаем директорию, если её нет
      if (!fs.existsSync(targetJavaDir)) {
        fs.mkdirSync(targetJavaDir, { recursive: true });
      }
      
      // Копируем Java файлы, если они существуют
      if (fs.existsSync(widgetJavaDir)) {
        copyFolderRecursive(widgetJavaDir, targetJavaDir);
      } else {
        console.log('⚠️ Widget Java directory not found:', widgetJavaDir);
      }
      
      // Копируем ресурсы
      if (fs.existsSync(widgetResDir)) {
        copyFolderRecursive(widgetResDir, targetResDir);
      } else {
        console.log('⚠️ Widget resources directory not found:', widgetResDir);
      }
      
      return config;
    }
  ]);

  return config;
};

function copyFolderRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  const files = fs.readdirSync(source);
  
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyFolderRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`  ✅ Copied: ${file}`);
    }
  });
}

module.exports = createRunOncePlugin(withWidgetAndroid, 'withWidgetAndroid', '1.0.0');
