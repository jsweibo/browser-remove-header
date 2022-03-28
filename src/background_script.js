let activeRules = [];

function start() {
  chrome.storage.local.get('config', function (res) {
    if ('config' in res) {
      if (res.config.status) {
        // on

        // get active rules
        activeRules = res.config.rules.filter(function (rule) {
          if (
            !('status' in rule) &&
            Array.isArray(rule.matches) &&
            rule.matches.length
          ) {
            return true;
          }
          if (
            'status' in rule &&
            rule.status &&
            Array.isArray(rule.matches) &&
            rule.matches.length
          ) {
            return true;
          }
        });

        activeRules.forEach(function (activeRule) {
          // onBeforeSendHeaders
          if (
            Array.isArray(activeRule.requestHeaders) &&
            activeRule.requestHeaders.length
          ) {
            // generate
            activeRule.onBeforeSendHeaders = function (requestDetails) {
              const headers = [];
              requestDetails.requestHeaders.forEach(function (item) {
                const headerName = item.name.toLowerCase();
                if (activeRule.requestHeaders.indexOf(headerName) === -1) {
                  headers.push(item);
                }
              });
              return {
                requestHeaders: headers,
              };
            };

            // bind
            chrome.webRequest.onBeforeSendHeaders.addListener(
              activeRule.onBeforeSendHeaders,
              {
                urls: activeRule.matches,
              },
              ['blocking', 'requestHeaders', 'extraHeaders']
            );
          }

          // onHeadersReceived
          if (
            Array.isArray(activeRule.responseHeaders) &&
            activeRule.responseHeaders.length
          ) {
            // generate
            activeRule.onHeadersReceived = function (requestDetails) {
              const headers = [];
              requestDetails.responseHeaders.forEach(function (item) {
                const headerName = item.name.toLowerCase();
                if (activeRule.responseHeaders.indexOf(headerName) === -1) {
                  headers.push(item);
                }
              });
              return {
                responseHeaders: headers,
              };
            };

            // bind
            chrome.webRequest.onHeadersReceived.addListener(
              activeRule.onHeadersReceived,
              {
                urls: activeRule.matches,
              },
              ['blocking', 'responseHeaders', 'extraHeaders']
            );
          }
        });
      }
    }
  });
}

chrome.browserAction.onClicked.addListener(function () {
  chrome.runtime.openOptionsPage();
});

chrome.storage.onChanged.addListener(function () {
  // remove every event listener
  activeRules.forEach(function (activeRule) {
    if (activeRule.onBeforeSendHeaders) {
      chrome.webRequest.onBeforeSendHeaders.removeListener(
        activeRule.onBeforeSendHeaders
      );
    }
    if (activeRule.onHeadersReceived) {
      chrome.webRequest.onHeadersReceived.removeListener(
        activeRule.onHeadersReceived
      );
    }
  });

  // empty active rules
  activeRules = [];

  // restart
  start();
});

// start
start();
