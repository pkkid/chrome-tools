// Encoding: UTF-8
// Chrome New Tab Options
'use strict';


//------------------------------
// New Tab Options
//------------------------------
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
};


//------------------------------
// Tab Groups
//------------------------------
var tabGroups = {

  init: function() {
    var windowid = null;
    chrome.windows.getCurrent(function(win) { windowid = win.id; });
    this.init_triggers();
    this.init_popup();
  },

  // Initialize all popup triggers
  init_triggers: function() {
    var self = this;
    // Save button clicked or ENTER pressed in input
    $('.saverow button').on('click', function(event) {
      event.preventDefault();
      var name = $('.saverow input').val();
      self.save_group(name);
    });
    $('.saverow input').on('keydown', function(event) {
      if (event.keyCode == 13) {
        event.preventDefault();
        var name = $('.saverow input').val();
        self.save_group(name);
      }
    });
    // Toggle the actions row on a Tab Group
    $('.loadarea').on('click', '.row .actionsbtn', function(event) {
      event.preventDefault();
      $(this).parents('.row').find('.actions').slideToggle('fast');
    });
    // Load the specified Tab Group
    $('.loadarea').on('click', '.row .name', function(event) {
      event.preventDefault();
      self.load_group($(this).parents('.row').data('id'));
    });
    // Update the specified Tab Group
    $('.loadarea').on('click', 'button.update', function(event) {
      event.preventDefault();
      console.log($(this).parents('.row').data('name'));
      self.save_group($(this).parents('.row').data('name'));
    });
    // Delete the specified Tab Group
    $('.loadarea').on('click', 'button.delete', function(event) {
      event.preventDefault();
      self.delete_group($(this).parents('.row').data('id'));
    });
  },

  // Load all Saved Groups in the popup window
  init_popup: function() {
    var self = this;
    chrome.storage.sync.get(null, function(groups) {
      chrome.storage.local.get('activeTabs', function(result) {
        var active = result.activeTabs ? result.activeTabs[self.windowid] : null;
        for (var id in groups) {
          if (groups.hasOwnProperty(id)) {
            var row = groups[id];
            var isactive = active === id ? 'active' : '';
            var template = [
              '<div class="row '+isactive+'" data-id="'+id+'" data-name="'+row.name+'">',
              '  <div class="actionsbtn">&#8942;</div>',
              '  <div class="name"><span class="mdi mdi-tab"></span>'+ row.name +'</div>',
              '  <div class="actions" style="display:none;">',
              '    <button class="delete">delete</button>',
              '    <button class="update">update</button>',
              '  </div>',
              '</div>'
            ].join('\n');
            $('.loadarea').append(template);
          }
        }
      });
    });
  },

  // Set the Active Tab Group
  set_active: function(uid) {
    var self = this;
    chrome.storage.local.get(['activeTabs'], function(result) {
      var atabs = result.activeTabs || {};
      atabs[self.windowid] = uid;
      chrome.storage.local.set({'activeTabs': atabs}, function() {
        console.log('Active tabset: '+ uid);
        window.location.href = 'popup.html';
      });
    });
  },

  // Save a Tab Group
  save_group: function(name) {
    var self = this;
    if (name) {
      var urilist = [];
      chrome.tabs.query({pinned:true, currentWindow:true}, function(tabs) {
        for (var i=0; i < tabs.length; i++) {
          urilist[i] = tabs[i].url;
        }
        if (urilist.length > 0) {
          var saveobj = {};
          var id = window.btoa(name);
          saveobj[id] = {name:name, tabs:urilist};
          chrome.storage.sync.set(saveobj, function() {
            self.set_active(id);
          });
        }
      });
    }
  },

  // Load a Tab Group
  load_group: function(id) {
    var self = this;
    chrome.storage.sync.get(id, function(group) {
      var tabs = group[id].tabs;
      chrome.tabs.query({pinned:true, windowId:self.windowid}, function(curtabs) {
        var list = [];
        for (var tab of curtabs) {
          list.push(tab.id);
        }
        chrome.tabs.remove(list);
        for (tab of tabs) {
          chrome.tabs.create({windowId:self.windowid, url:tab, active:false, pinned:true});
        }
        console.log('Loaded tabs for id: '+ id);
        self.set_active(id);
      });
    });
  },

  // Delete a Tab Group
  delete_group: function(id) {
    chrome.storage.sync.remove(id, function() {
      window.location.href = 'popup.html';
    });
  },

};


// Main
if ($('#main').length) { newTab.init_newtab(); }
if ($('#options').length) { newTab.init_options(); }
if ($('#popup').length) { tabGroups.init(); }
