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
// New Tab Options
//------------------------------
var NewTab = {

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
    var options = ['url','iframe', 'sort_delay', 'folders_first'];
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
    console.log('Background!');
  },

};


// Main
if ($('#main').length) { NewTab.init_newtab(); }
if ($('#options').length) { NewTab.init_options(); }
if ($('#popup').length) { TabGroups.init(); }
if ($('#background').length) { Background.init(); }
