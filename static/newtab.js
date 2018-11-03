// Encoding: UTF-8
// Chrome New Tab Options
'use strict';

var newTab = {

  init_newtab: function() {
    if ($('#main').length) {
      chrome.storage.sync.get(['url','iframe'], function(result) {
        var url = result.url || 'chrome://apps/';
        var iframe = result.iframe || false;
        if (url.startsWith('chrome://')) {
          chrome.tabs.create({'url': url});
          window.close();
        } else if (iframe) {
          $('#iframe').attr('src', url);
        } else {
          window.top.location = url;
        }
      });
    }
  },

  init_options: function() {
    var self = this;
    // Load initial values from storage
    if ($('#options').length) {
      chrome.storage.sync.get(['url','iframe'], function(result) {
        $('#url').val(result.url || '');
        $('#iframe').attr('checked', result.iframe || false);
      });
    }
    // Save new values to storage when modified
    $('#url').on('blur', function() {
      self.save_setting('url', $(this).val());
    });
    $('#iframe').on('change', function() {
      self.save_setting('iframe', $(this).is(':checked'));
    });
    // Update URL when clicking special chrome link
    $('.special.help a').on('click', function() {
      $('#url').val($(this).text()).trigger('blur');
    });
  },

  save_setting: function(key, value) {
    var data = {}
    data[key] = value;
    chrome.storage.sync.set(data, function() {
      if (!chrome.runtime.lastError) {
        console.log('Saved', key, value);
      }
    });
  },
}

// Main
if ($('#main').length) { newTab.init_newtab(); }
if ($('#options').length) { newTab.init_options(); }
