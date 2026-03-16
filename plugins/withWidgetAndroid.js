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
    }
    
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const platformRoot = path.join(config.modRequest.platformProjectRoot, 'app/src/main');
      const packageName = config.android.package || 'com.mkhailksk.famnote';
      const packagePath = packageName.replace(/\./g, '/');
      
      const widgetSource = path.join(config.modRequest.projectRoot, 'widgets/android/src/main/java');
      const targetSource = path.join(platformRoot, 'java', packagePath);
      
      if (fs.existsSync(widgetSource)) {
        copyFolderRecursive(widgetSource, targetSource);
      }
      
      const widgetRes = path.join(config.modRequest.projectRoot, 'widgets/android/src/main/res');
      const targetRes = path.join(platformRoot, 'res');
      
      if (fs.existsSync(widgetRes)) {
        copyFolderRecursive(widgetRes, targetRes);
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
    }
  });
}

module.exports = createRunOncePlugin(withWidgetAndroid, 'withWidgetAndroid', '1.0.0');