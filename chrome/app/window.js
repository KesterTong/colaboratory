// This must start with a /, otherwise serverOrigin will be wrong.
var notebookPath = '/colab/notebook.html';
var notebookUrl = chrome.runtime.getURL(notebookPath);
var serverOrigin = notebookUrl.substr(0, notebookUrl.length -
    notebookPath.length);
var tokenRefreshInterval = 10 * 60 * 1000;  // 10 minutes

var webview = document.getElementById('webview');

webview.setAttribute('partition', 'frontend');
webview.setAttribute('src', notebookUrl + window.location.hash);

var kernel = new Kernel(function(message) {
  webview.contentWindow.postMessage(message, serverOrigin);
});



window.addEventListener('message', function(message) {
  if (message.source !== webview.contentWindow ||
      message.origin !== serverOrigin) {
    return;
  }

  if (message.data === 'start_kernel') {
    kernel.start();
  } else if (message.data === 'restart_kernel') {
    kernel.restart();
  } else if (message.data && message.data.json) {
    kernel.handleMessage(message.data);
  }
});

var loadedOnce = false;

webview.addEventListener('loadstop', function(m) {
  // Only add listeners after the webview loads for the first time.
  if (loadedOnce) {
    return;
  }
  loadedOnce = true;

  colab.webview.addMessageListener(
    webview.contentWindow, 'pick_file', function(msgType, content) {
    chrome.fileSystem.chooseEntry({type: 'openDirectory'}, function(theEntry) {
      if (!theEntry) {
        return;
      }
      kernel.handleMessage({'filesystem_name': theEntry.fullPath,
                            'filesystem_resource': theEntry.filesystem});
    });
  });

  // Send initialization message to webview
  webview.contentWindow.postMessage('initialization_message', serverOrigin);

  // Obtain OAuth token and post to webview
  chrome.identity.getAuthToken({interactive: true}, function(token) {
    console.log('recieved token ' + token);
    webview.contentWindow.postMessage({token: token}, serverOrigin);
  });

  // Periodically refresh token and post to webview
  setInterval(function() {
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      console.log('recieved token ' + token);
      webview.contentWindow.postMessage({token: token}, serverOrigin);
    });
  }, tokenRefreshInterval);
});
