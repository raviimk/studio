const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // अभी खाली है, बाद में अगर ज़रूरत पड़े add करेंगे
});
