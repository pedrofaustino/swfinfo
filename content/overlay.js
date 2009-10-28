/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is SWF Info. Some portions of the code from AdBlock Plus.
 *
 * The Initial Developer of the Original Code is
 * Pedro Faustino.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Portions created by the Contributor are Copyright (C) 2006-2009
 * the Contributor. All Rights Reserved.
 *
 * ***** END LICENSE BLOCK ***** */

var swfinfo = {
	/**
	 * Randomly generated class for object tab nodes.
	 * @type String
	 */
	objtabClass: null,
	
	/**
	 * Randomly generated class for object tab nodes displayed on top of the object.
	 * @type String
	 */
	objtabOnTopClass: null,
	
	/**
	 * Randomly generated property name to be set for object tab nodes.
	 * @type String
	 */
	objtabMarker: null,
	
	/**
	 * Randomly generated class for collapsed nodes.
	 * @type String
	 */
	collapsedClass: null,
	
	/**
	 * init() function
	 */
	init: function ()
	{
		this.initialized = true;
		
		// Generate identifiers for object tabs
		this.objtabClass = '';
		this.objtabOnTopClass = '';
		this.collapsedClass = '';
		this.objtabMarker = 'swfinfoObjTab';
		
		for (var i = 0; i < 20; i++)
		{
			this.objtabClass += String.fromCharCode('a'.charCodeAt(0) + Math.random() * 26);
			this.objtabOnTopClass += String.fromCharCode('a'.charCodeAt(0) + Math.random() * 26);
			this.collapsedClass +=  String.fromCharCode('a'.charCodeAt(0) + Math.random() * 26);
			this.objtabMarker += String.fromCharCode('a'.charCodeAt(0) + Math.random() * 26);
		}
		
		this.initObjectTabCSS();
		
		this.strings = document.getElementById('swfinfo-strings');
		
		var appcontent = document.getElementById('appcontent');   // browser
		if (appcontent)
		{
			appcontent.addEventListener('DOMContentLoaded', 
				function (aLoadEvent) { 
					swfinfo.addSwfTab(aLoadEvent);
				}, 
				true);
			appcontent.addEventListener('resize', 
				function (aResizeEvent) {
					swfinfo.onWindowResize(aResizeEvent);
				}, 
				false);
		}
	},
	
	/**
	 * Executed when the user clicks on Tools
	 */
	onMenuItemCommand: function ()
	{
		var extensionManager = Components.classes['@mozilla.org/extensions/manager;1'].
			getService(Components.interfaces.nsIExtensionManager);
		openDialog('chrome://mozapps/content/extensions/about.xul', '',
			'chrome,centerscreen,modal', 'urn:mozilla:item:swfinfo@software.pedrofaustino.com', extensionManager.datasource);
	},
	
	/**
	 * Executed upon a document load event
	 */
	addSwfTab: function (aEvent)
	{
		// doc is document that triggered 'onload' event
		var doc = aEvent.originalTarget;
		if (doc.nodeName === '#document')
		{
			// look for object and embed elements on the doc
			var elementNames = ['object', 'embed'];
			for (var j = 0; j < elementNames.length; j++)
			{
				var objects = doc.body.getElementsByTagName(elementNames[j]);
				for (var i = 0; i < objects.length; i++)
				{
					var objTab = objects[i].ownerDocument.createElementNS('http://www.w3.org/1999/xhtml', 'a');
					if (objTab) {
						window.setTimeout(swfinfo.addObjectTab, 0, objects[i], objTab);
					}
				}
			}
		}
	},
	
	/**
	 * Executed when there's an unload event
	 */
	onPageUnload: function ()
	{
		window.removeEventListener('load', swfinfo.init(), false);
		window.removeEventListener('unload', swfinfo.onPageUnload(), false);
	},
	
	/**
	 * Executed when there's an resize event on the window
	 */
	onWindowResize: function (aEvent)
	{
		var win = aEvent.originalTarget;
		if (aEvent.originalTarget instanceof ChromeWindow)
		{
			var elements = win.document.body.getElementsByClassName(swfinfo.objtabClass);
			for (var i = 0; i < elements.length; i++) {
				swfinfo.repositionObjectTab(elements[i]);
			}
		}
	},
	
	/**
	 * Loads objtabs.css on startup and registers it globally.
	 */
	initObjectTabCSS: function () {
		var Cc = Components.classes;
		var Ci = Components.interfaces;
		// Load CSS asynchronously (synchronous loading at startup causes weird issues)
		try {
			var ioService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
			var styleService = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService); 
			var channel = ioService.newChannel('chrome://swfinfo/content/objtabs.css', null, null);
			channel.asyncOpen({
				data: '',
				onDataAvailable: function (request, context, stream, offset, count)
				{
					var scriptableStream = Cc['@mozilla.org/scriptableinputstream;1'].createInstance(Ci.nsIScriptableInputStream);
					scriptableStream.init(stream);
					this.data += scriptableStream.read(count);
				},
				onStartRequest: function () { },
				onStopRequest: function ()
				{
					var data = this.data.replace(/%%CLASSNAME%%/g, swfinfo.objtabClass).replace(/%%ONTOP%%/g, swfinfo.objtabOnTopClass).replace(/%%COLLAPSED%%/g, swfinfo.collapsedClass);
					var objtabsCSS = swfinfo.makeURL('data:text/css,' + encodeURIComponent(data));
					Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService).loadAndRegisterSheet(objtabsCSS, styleService.USER_SHEET);
					channel = null;
				}
			}, null);
		} catch (e) { }
	},
	
	/**
	 * Creates a tab above and at the top left of the object node
	 */
	addObjectTab: function (aNode, aTab)
	{
		var swfUrl = swfinfo.getSwfUrl(aNode);
		if (!aNode.parentNode || swfUrl === null) {
			return;
		}
		
		aTab.setAttribute('href', swfUrl);
		aTab.setAttribute('class', swfinfo.objtabClass);
		
		// Insert tab into the document
		if (aNode.nextSibling) {
			aNode.parentNode.insertBefore(aTab, aNode.nextSibling);
		}
		else {
			aNode.parentNode.appendChild(aTab);
		}
		
		aTab.addEventListener('click', 
			function (aEvent) { 
				aEvent.preventDefault(); 
				swfinfo.updateSidebar(swfUrl); 
			},
			false);
		swfinfo.repositionObjectTab(aTab);
	},
	
	/**
	 * Returns a String with the URL of the SWF file
	 */
	getSwfUrl: function (/**Element**/ aObject)
	{
		var url = '';
		var undef = 'undefined';
		if (aObject.tagName.toLowerCase() === 'object')
		{
			if (typeof aObject.data === undef || aObject.data === '') {
				return null;
			}
			// See the Twice-Cooked Method @ http://www.alistapart.com/articles/flashsatay and
			// http://www.w3.org/TR/html40/struct/objects.html#adef-codebase-OBJECT 
			if (typeof aObject.codebase !== undef && aObject.codebase.indexOf(aObject.ownerDocument.location.host) !== -1)
			{
				url = aObject.codebase + aObject.data;
			} 
			else {
				if (aObject.data.indexOf('http', 0) === -1) {
					url = aObject.ownerDocument.location.protocol + '//' + aObject.ownerDocument.location.host + '/' + aObject.data;
				} 
				else {
					url = aObject.data;
				}
			}
		}
		else {
			if (typeof aObject.src === undef || aObject.src === '') {
				return null;
			}
			url = aObject.src;
		}
		return url;
	},
	
	/**
	 * Returns an nsIURI for given url
	 */
	makeURL: function (aUrl)
	{
		var ioService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
		try
		{
			return ioService.newURI(aUrl, null, null);
		}
		catch (e) {
			return null;
		}
	},
	
	/**
	 * Updates position of an object tab to match the object
	 */
	repositionObjectTab: function (/**Element*/ aObjTab)
	{
		var object = aObjTab.previousSibling;
		if (!(object instanceof Ci.nsIDOMHTMLObjectElement || object instanceof Ci.nsIDOMHTMLEmbedElement))
		{
			if (aObjTab.parentNode) {
				aObjTab.parentNode.removeChild(aObjTab);
			}
			return;
		}
		
		var offsetLeft = 0;
		var offsetTop = 0;
		var wmode;
		
		if (object instanceof Ci.nsIDOMHTMLObjectElement)
		{
			var params = object.getElementsByTagName("param");
			for (var i = 0; i < params.length; i++) {
				if (params[i].name === 'wmode') {
					wmode = params[i].value;
				}
			}
		}
		
		if (object instanceof Ci.nsIDOMHTMLEmbedElement)
		{
			wmode = object.getAttribute('wmode')
		}
		
		var firstrun = true;
		while (object) {
			offsetLeft += object.offsetLeft;
			offsetTop += object.offsetTop;
			
			var position = object.ownerDocument.defaultView.getComputedStyle(object, null).getPropertyValue('position');
			if (position !== 'static')
			{
				if (position === 'absolute')
				{
					break;
				}
				if (firstrun && position === 'relative')
				{
					offsetLeft -= object.offsetLeft;
					offsetTop -= object.offsetTop;
					break;
				}
				firstrun = false;
			}
			object = object.offsetParent;
		}
		
		// in case wmode = window (or not set) the stacking order is not respected, 
		// thus display the tab at the bottom left and outside of the SWF area
		if (!(wmode.toLowerCase() === 'opaque' || wmode.toLowerCase() === 'transparent')) {
			offsetTop += (parseInt(aObjTab.previousSibling.height, 10) || 0);
		}
		
		aObjTab.style.setProperty('left', offsetLeft + 'px', 'important');
		aObjTab.style.setProperty('top', offsetTop + 'px', 'important');
		aObjTab.style.removeProperty('visibility');
	},
	
	/**
	 * Updates the sidebar: either makes it visible and requests the full webpage URL
	 * or in case it's already visible creates a new SWF URL change event to be caught by the webpage
	 */
	updateSidebar: function (aSwfUrl) {
		var baseUrl = 'http://software.pedrofaustino.com/swfinfo/sidebar/index.html?url=';
		var eventType = 'swfInfoNewUrl';
		var browserWindow = getTopWin();
		browserWindow.toggleSidebar('viewSwfinfoSidebar', true);
		// See https://developer.mozilla.org/En/Code_snippets/Sidebar
		var sidebarWindow = browserWindow.document.getElementById('sidebar').contentWindow;
		if (sidebarWindow.location.href.match(/^http:\/\/software\.pedrofaustino\.com.*/))
		{
			var sidebarDoc = document.getElementById('sidebar').contentDocument;
			var el = sidebarDoc.getElementById('swfinfoextension');
			el.setAttribute('url', aSwfUrl);
			var evt = sidebarDoc.createEvent('Events');
			evt.initEvent(eventType, true, false);
			el.dispatchEvent(evt);
		} 
		else {
			sidebarWindow.location.replace(baseUrl + escape(aSwfUrl));
		}
	}
	  
};

window.addEventListener('load', swfinfo.init(), false);
window.addEventListener('unload', swfinfo.onPageUnload(), false);