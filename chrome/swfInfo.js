var $swfInfoDiv;

/**
 * Returns a String with the URL of the SWF file
 */
function getSwfUrl(/**Element**/ aObject)
{
	var url = '';
	var undef = 'undefined';
	
	// has this element the correct MIME type?
	if(typeof aObject.type !== undef &&
		aObject.type.search('application/x-shockwave-flash') === -1 )
	{
		return undef;
	}
	
	if (aObject.tagName.toLowerCase() === 'object')
	{
		if (typeof aObject.data === undef || aObject.data === '') {
			return undef;
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
			return undef;
		}
		url = aObject.src;
	}
	return url;
}

function showButton(aEvent) {
	if ( aEvent.type === "mouseenter" ) {
		console.log('mouse entered');
		var position = $(this).offset();
		var w = $(this).width();
		var href = getSwfUrl(this);
		if (href === 'undefined')
			return;
		console.log('the SWF URL is ' + href);
		var titl = (href.length > 100) ? (href.substring(0, 100) + '...') : href;
		
		$swfInfoDiv.addClass('swfInfoTab');
		
		$swfInfoDiv.stop(true, true).hide();
		$swfInfoDiv.css({ "top": position.top, "left": position.left + w });
		$swfInfoDiv.fadeIn(500);

		$swfInfoDiv.unbind('click');
		$swfInfoDiv.click(function(e) {
			e.preventDefault();
			$.nyroModalManual({
				bgColor: '#333333',
				width: $(window).width() - 600,
				height: $(window).height() - 200,
				windowResize: true,
				type: '',
				resizable: true,
				zIndexStart: 10000,
				title: titl,
				url: 'http://software.pedrofaustino.com/swfinfo/sidebar/index-with-flattr.html?url=' + href
			});

			$swfInfoDiv.stop(true, true).hide();
			return false;
		});			
	
	} else {
		$swfInfoDiv.stop(true, true).delay(4000).fadeOut(2000);
	}	
}


$(document).ready(function() {
	
	//create the preview button
    $swfInfoDiv = jQuery('<div/>', {
        id: 'swfInfoDiv',
        css: {
            borderWidth: '0px',
            position: 'absolute',
            top: '10px',
            left: '10px',
            width: '15px',
            height: '57px',
            zindex: '9999',
            cursor: 'pointer'
        }
    });
	
	//append the button to the body of the html document
    $('body').append($swfInfoDiv);
    $swfInfoDiv.hide();
	
	//jquery 1.4.1 supports hover in live() function
	$("object").live( 'hover', showButton);
	$("embed").live( 'hover', showButton);

});