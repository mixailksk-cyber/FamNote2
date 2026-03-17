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
    
    const hasWidgetReceiver = mainApplication.receiver.some(
      receiver => receiver.$ && receiver.$['android:name'] === '.widget.NotesWidget'
    );
    
    if (!hasWidgetReceiver) {
      mainApplication.receiver.push({
        $: {
          'android:name': '.widget.NotesWidget',  // ВАЖНО: точка в начале
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
            'android:resource': '@xml/notes_widget_info'  // Ссылка на XML
          }
        }]
      });
    }
    
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const platformRoot = path.join(config.modRequest.platformProjectRoot, 'app/src/main');
      const packageName = config.android.package || 'com.mkhailksk.famnote';
      
      // ПРАВИЛЬНО: заменяем точки на слеши
      const packagePath = packageName.replace(/\./g, '/');
      
      // ИСПРАВЛЕНО: путь назначения
      const targetJavaDir = path.join(platformRoot, 'java', packagePath);
      const targetResDir = path.join(platformRoot, 'res');
      
      // ИСПРАВЛЕНО: путь источника
      const widgetJavaDir = path.join(config.modRequest.projectRoot, 'widgets/android/src/main/java', packagePath, 'widget');
      const widgetResDir = path.join(config.modRequest.projectRoot, 'widgets/android/src/main/res');
      
      console.log('Copying widget files:');
      console.log('  From (java):', widgetJavaDir);
      console.log('  To (java):', targetJavaDir);
      console.log('  From (res):', widgetResDir);
      console.log('  To (res):', targetResDir);
      
      // Копируем Java файлы
      if (fs.existsSync(widgetJavaDir)) {
        copyFolderRecursive(widgetJavaDir, path.join(targetJavaDir, 'widget'));
      }
      
      // Копируем ресурсы
      if (fs.existsSync(widgetResDir)) {
        copyFolderRecursive(widgetResDir, targetResDir);
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
      console.log(`  Copied: ${file}`);
    }
  });
}

module.exports = createRunOncePlugin(withWidgetAndroid, 'withWidgetAndroid', '1.0.0');
