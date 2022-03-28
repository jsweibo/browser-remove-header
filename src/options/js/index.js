const RECOMMENDED_CONFIG = {
  status: true,
  rules: [],
};

const configForm = document.querySelector('#config');
const statusInput = document.querySelector('#status');
const rulesInput = document.querySelector('#rules');
const hintField = document.querySelector('.hint-field');
const hintText = document.querySelector('.hint-field .hint');
let needSave = false;

function notify({ type = '', message = '' }) {
  if (hintField.classList.length === 1) {
    hintText.textContent = message;
    if (type === 'success') {
      hintText.classList.add('hint_success');
      hintField.classList.add('hint-field_visible');
      setTimeout(function () {
        hintField.classList.remove('hint-field_visible');
        hintText.classList.remove('hint_success');
      }, 1e3);
    } else {
      hintText.classList.add('hint_error');
      hintField.classList.add('hint-field_visible');
      setTimeout(function () {
        hintField.classList.remove('hint-field_visible');
        hintText.classList.remove('hint_error');
      }, 1e3);
    }
  }
}

configForm.addEventListener('change', function () {
  needSave = true;
});

configForm.addEventListener('submit', function (event) {
  event.preventDefault();

  let savedConfig = {
    status: statusInput.checked,
    rules: [],
  };

  if (rulesInput.value) {
    // check rules syntax
    try {
      const rules = JSON.parse(rulesInput.value);
      if (!Array.isArray(rules)) {
        notify({
          type: 'error',
          message: 'Invalid Rules',
        });
        return false;
      }

      // toLowerCase
      for (let item of rules) {
        if (Array.isArray(item.requestHeaders) && item.requestHeaders.length) {
          item.requestHeaders = item.requestHeaders
            .join()
            .toLowerCase()
            .split(',');
        }
        if (
          Array.isArray(item.responseHeaders) &&
          item.responseHeaders.length
        ) {
          item.responseHeaders = item.responseHeaders
            .join()
            .toLowerCase()
            .split(',');
        }
      }

      rulesInput.value = JSON.stringify(rules, null, 2);
    } catch (error) {
      notify({
        type: 'error',
        message: 'Error Rules',
      });
      return false;
    }
    // pass check
    savedConfig.rules = JSON.parse(rulesInput.value);
  }

  // save options
  chrome.storage.local.set(
    {
      config: savedConfig,
    },
    function () {
      notify({
        type: 'success',
        message: 'Saved',
      });
      needSave = false;
    }
  );
});

document.querySelector('#get-advice').addEventListener('click', function () {
  needSave = true;
  statusInput.checked = RECOMMENDED_CONFIG.status;
  rulesInput.value = JSON.stringify(RECOMMENDED_CONFIG.rules, null, 2);
});

window.addEventListener('beforeunload', function (event) {
  if (needSave) {
    event.preventDefault();
    event.returnValue = '';
  }
});

// start
chrome.storage.local.get('config', function (res) {
  if ('config' in res) {
    statusInput.checked = res.config.status;
    rulesInput.value = JSON.stringify(res.config.rules, null, 2);
  }
});
