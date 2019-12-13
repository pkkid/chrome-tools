// Encoding: UTF-8
// Chrome New Tab Options
'use strict';

var save_setting = function(key, value, callback) {
  var data = {};
  data[key] = value;
  chrome.storage.sync.set(data, function() {
    if (!chrome.runtime.lastError) {
      console.log('Saved', key, value);
      if (callback) { callback(); }
    }
  });
};


//------------------------------
// Options
//------------------------------
var Options = {
  init: function() {
    // Load initial values from storage
    if ($('#options').length) {
      chrome.storage.sync.get(null, function(result) {
        console.log(result);
        $('#url').val(result.url || '');
        $('#iframe').attr('checked', result.iframe || false);
        $('#sort_delay').attr('value', result.sort_delay || 45);
        $('#folders_first').attr('checked', result.folders_first || true);
        $('#bookmarks_sort').val(result.bookmarks_sort || 'none');
        $('#bookmarks_sub').val(result.bookmarks_sub || 'none');
        $('#mobile_sort').val(result.mobile_sort || 'none');
        $('#mobile_sub').val(result.mobile_sub || 'none');
        $('#other_sort').val(result.other_sort || 'none');
        $('#other_sub').val(result.other_sub || 'none');
      });
    }
    // Save new values to storage when modified
    $('#url').on('blur', function() { save_setting('url', $(this).val()); });
    $('#iframe').on('change', function() { save_setting('iframe', $(this).is(':checked')); });
    $('.special.help a').on('click', function() { $('#url').val($(this).text()).trigger('blur'); });
    // Bookmark sort options
    $('#sort_delay').on('change', function() { save_setting('sort_delay', $(this).val()); });
    $('#folders_first').on('change', function() { save_setting('folders_first', $(this).is(':checked')); });
    $('#bookmarks_sort').on('change', function() { save_setting('bookmarks_sort', $(this).val()); });
    $('#bookmarks_sub').on('change', function() { save_setting('bookmarks_sub', $(this).val()); });
    $('#mobile_sort').on('change', function() { save_setting('mobile_sort', $(this).val()); });
    $('#mobile_sub').on('change', function() { save_setting('mobile_sub', $(this).val()); });
    $('#other_sort').on('change', function() { save_setting('other_sort', $(this).val()); });
    $('#other_sub').on('change', function() { save_setting('other_sub', $(this).val()); });
  },
};


//------------------------------
// New Tab
//------------------------------
var NewTab = {
  init: function() {
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
  },
};


//------------------------------
// Tab Groups
//------------------------------
var TabGroups = {

  init: function() {
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
    $('.groups').on('click', '.row .actionsbtn', function(event) {
      event.preventDefault();
      var row = $(this).parents('.row');
      row.siblings().find('.actions').slideUp('fast');
      row.find('.actions').slideToggle('fast');
    });
    // Load the specified Tab Group
    $('.groups').on('click', '.row .name', function(event) {
      event.preventDefault();
      self.load_group($(this).parents('.row').data('key'));
    });
    // Update the specified Tab Group
    $('.groups').on('click', 'button.update', function(event) {
      event.preventDefault();
      console.log($(this).parents('.row').data('name'));
      self.save_group($(this).parents('.row').data('name'));
    });
    // Delete the specified Tab Group
    $('.groups').on('click', 'button.delete', function(event) {
      event.preventDefault();
      self.delete_group($(this).parents('.row').data('key'));
    });
  },

  // Load all Saved Groups in the popup window
  init_popup: function() {
    chrome.storage.sync.get(null, function(groups) {
      $('.groups').html('');
      for (var key in groups) {
        if (key.startsWith('group_')) {
          var row = groups[key];
          var template = [
            '<div class="row" data-key="'+key+'" data-name="'+row.name+'">',
            '  <div class="actionsbtn">&#8942;</div>',
            '  <div class="name"><span class="mdi mdi-tab"></span>'+ row.name +'</div>',
            '  <div class="actions" style="display:none;">',
            '    <button class="delete">delete</button>',
            '    <button class="update">update</button>',
            '  </div>',
            '</div>'
          ].join('\n');
          $('.groups').append(template);
        }
      }
    });
  },

  // Save a Tab Group
  save_group: function(name) {
    var self = this;
    if (name) {
      chrome.tabs.query({pinned:true, currentWindow:true}, function(pinned) {
        var urls = pinned.map(tab => tab.url);
        if (urls.length > 0) {
          var key = 'group_'+ window.btoa(name);
          save_setting(key, {name:name, tabs:urls}, function() {
            $('.saverow input').val('');
            self.init_popup(); 
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
      chrome.tabs.query({pinned:true, currentWindow:true}, function(pinned) {
        var pinned_ids = pinned.map(tab => tab.id);
        chrome.tabs.remove(pinned_ids);
        for (var tab of tabs) {
          chrome.tabs.create({url:tab, active:false, pinned:true});
        }
        console.log('Loaded tabs for idX: '+ id);
        window.close();
      });
    });
  },

  // Delete a Tab Group
  delete_group: function(id) {
    var self = this;
    chrome.storage.sync.remove(id, function() {
      self.init_popup();
    });
  },

};

//------------------------------
// Background
//------------------------------
var Background = {

  init: function() {
    var self = this;
    chrome.storage.sync.get(null, function(result) {
      self.sort_delay = result.sort_delay || 45;
      self.folders_first = result.folders_first || true;
      self.sort_options = [  // Options based on starting path
        ['/Bookmarks bar/', result.bookmarks_sub || 'none'],
        ['/Bookmarks bar', result.bookmarks_sort || 'none'],
        ['/Mobile bookmarks/', result.mobile_sub || 'none'],
        ['/Mobile bookmarks', result.mobile_sort || 'none'],
        ['/Other bookmarks/', result.other_sub || 'none'],
        ['/Other bookmarks', result.other_sort || 'none'],
      ];
      self.import_active = false;  // True when import is occuring
      self.sort_timer = 1;  // Countdown to sort
      self.init_triggers();
      setInterval(function() { self.sort_everything(self); }, 1000);
    });
  },

  // Initialize sorting triggers
  init_sort_triggers: function() {
    var self = this;
    chrome.bookmarks.onImportBegan.addListener(function() { console.log('Import active'); self.import_active = true; });
    chrome.bookmarks.onImportEnded.addListener(function() { console.log('Import ended'); self.import_active = false; self.sort_timer = self.sort_delay; });
    chrome.bookmarks.onMoved.addListener(function() { console.log('Bookmark moved'); self.sort_timer = self.sort_delay; });
    chrome.bookmarks.onCreated.addListener(function() { console.log('Bookmark created'); self.sort_timer = self.sort_delay; });
    chrome.bookmarks.onChanged.addListener(function() { console.log('Bookmark changed'); self.sort_timer = self.sort_delay; });
    chrome.bookmarks.onMoved.addListener(function() { console.log('Bookmark moved'); self.sort_timer = self.sort_delay; });
    chrome.bookmarks.onChildrenReordered.addListener(function() { console.log('Bookmark reordered'); self.sort_timer = self.sort_delay; });
  },

  // Get sort option for the specified path
  get_sortby: function(path) {
    for (var i=0; i<this.sort_options.length; i++) {
      var prefix = this.sort_options[i][0];
      var sortby = this.sort_options[i][1];
      if (path.startsWith(prefix)) { return sortby; }
    }
    return 'none';
  },

  // Sort all bookmarks in all folders
  sort_everything: function(self) {
    self.sort_timer = Math.max(-1, self.sort_timer-1);
    if ((self.sort_timer == 0) && !self.import_active) {
      console.log('Sort Everything!');
      chrome.bookmarks.getTree(function(root) {
        self.iter_folders('', root[0]);
      });
    }
  },

  // Iter Folders
  iter_folders: function(path, folder) {
    if (path != '') { this.sort_folder(path, folder); }
    for (var i=0; i<folder.children.length; i++) {
      var subfolder = folder.children[i];
      var subpath = `${path}/${subfolder.title}`;
      if (subfolder.url === undefined) {
        this.iter_folders(subpath, subfolder);
      }
    }
  },

  // Sort Folder
  sort_folder: function(path, folder) {
    // check we want to sort this folder
    var sortby = this.get_sortby(path);  
    if (sortby == 'none') { return null; }
    console.log(path, sortby, folder);
  },
};


//------------------------------
// Main
//------------------------------
if ($('#main').length) { NewTab.init(); }
if ($('#options').length) { Options.init(); }
if ($('#popup').length) { TabGroups.init(); }
if ($('#background').length) { Background.init(); }
