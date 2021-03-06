$(document).ready(function() {
	var hover = 1;
	var hints = true;
  var deck_id = $('#impress').attr('deck_id');
	var attrs = true;

	if(hints == true) {
		showHints();
		hints = false;
	}
	$('#format-button').hover( 
		function() { 
			$('.format-helper').fadeIn('fast'); 
			clearTimeout();
			hover = 1;
		},
		
		function() {
			hover = 0;
			setTimeout(function() {
				if(hover == 0) { 
					$('.format-helper').fadeOut('fast'); 
				}
			}, 500);
		});
	
	establishEventListeners();

	$.ajax({
		url:  window.location.origin + "/decks/" + deck_id,
		dataType: 'json',
		success: function(data) {
		   database.deckData = data;
			if (dataLoaded()) { 
				constructTree();
			
			 }
		}
	});
	
	$.ajax({
		url:  window.location.origin + "/templates",
		dataType: 'json',
		success: function(data) {
			database.templateData = data;
			if (dataLoaded()) { constructTree() }
		}
	});
	
	$('.ux-helper').html("Press <span class='keyboard'>ENTER</span> to edit.");
});

var database = {};

var showHints = function() {
	$('.hint').on({
		click: function() {
			$(this).fadeOut('fast');
		},
		
		blur: function() {
			$(this).fadeOut('fast');
		},
		
		keyup: function(e) {
			if(e.keyCode == 13 || e.keyCode == 27 || e.keyCode == 8) {
				$(this).fadeOut('fast');
			}
		}
	});
}

var resetImpress = function() {
    window.impress().reset();
    window.impress();
};

var establishEventListeners = function() {
	document.addEventListener("click", function ( event ) {
		if (mode == "prezi") {
			event.stopImmediatePropagation();
		}
	});

	document.addEventListener("keydown", function ( event ) {
		if (mode == "edit") {
			event.stopImmediatePropagation();
		}
	});

	document.addEventListener("keyup", function ( event ) {
		if (mode == "edit") {
			event.stopImmediatePropagation();
		} else if (event.keyCode == 13) { 
      	event.stopImmediatePropagation();
        $('.editable.active').click();
    }
	});
}

var	markdown_to_html = function(string) {
		var controlCharTags = {0:{symbol:'*', open_tag:'<b>', close_tag:'</b>'}, 1:{symbol:'_', open_tag:'<em>', close_tag:'</em>'}}
		
		var controlChars = ['*', '_']
		for(var i = 0; i < controlChars.length; i++) {
  			var controlChar = controlChars[i];
  			var controlTag = controlCharTags[i];
  			var count = 0
  			var output = ''
  			for(var x = 0; x < string.length; x++) {
    				if(string[x] !== controlChar) {
      				output = output + string[x]
    				} else {
      					count++
      					if((string.split(controlChar).length - 1) % 2 === 0) {
        						if(count == 1) {
          							output = output + controlTag.open_tag
        						} else if(count == 2) {
        								output = output + controlTag.close_tag
        								count = 0
        						}
      					}
    				}
   			}
  			var string = output;
		}
		return output
}

var grabStepContent = function(step) {
  	return database.deckData.steps[getSlideIndexNumber(step)].content;
}

var createInlineEditor = function() {
	$(function() {
		var currentSlide = null,
				activeInput  = false,
				textarea     = document.createElement('textarea'),
				inlineEditor = $(textarea);
			
		inlineEditor.attr('id', 'inline-editor');
		inlineEditor.attr('placeholder', 'Start typing...');
		inlineEditor.prop('wrap', 'HARD');

		var divbox = document.createElement('div'),
            hoverbox = $(divbox);
        
        hoverbox.text('Click to add text')
        hoverbox.attr('id', 'hoverbox');
        hoverbox.attr('class', 'editor');

		$(".editable").on({
    	mouseenter: function(e) {
				if (mode === 'prezi' && grabStepContent($(this))  == '' && $(this).hasClass('active')) {
        	$(this).html(hoverbox.fadeIn(350));
        }
      },
			
			mouseleave: function(e) {
      	$('#hoverbox').fadeOut(150);
      },

            mouseleave: function(e) {
            	$('#hoverbox').fadeOut(150)
            },

            click: function(e) {

                if (!$(this).hasClass('active')) { return false; }
								if($('div.hint').css('opacity') == 1) {$('.hint').fadeOut('fast');}

                var currentSlide = $(this),
                    slideIndexNumber = getSlideIndexNumber(currentSlide);
                    currentText = database.deckData.steps[slideIndexNumber].content;

                activeInput = false;

                inlineEditor.val(currentText);
                e.stopImmediatePropagation();

                if (activeInput == false) {
                    activeInput = true;
                    mode = 'edit';
					$('.ux-helper').html("Press <span class='keyboard'>ESC</span> to stop editing.");
                    currentSlide.html(inlineEditor);
					console.log(database.deckData.steps[slideIndexNumber]['font-size']);
					inlineEditor.css('font-size', database.deckData.steps[slideIndexNumber]['font-size']);
                    inlineEditor.focus();
                    // show save text button
                    // show cancel edit button
                } else {
                    activeInput = false;
                    mode = 'prezi';
                    inlineEditor.blur();
                    e.stopImmediatePropagation();
                }

                inlineEditor.on({    
                    keyup: function(e) {
												$(this).blur();
												$('.editable').click();
                        if (e.keyCode == 27) {
                            $(this).blur();
                            activeInput = false;
                        }
                    },
                    click: function(e) {
                        e.stopPropagation();
                    },
                    blur: function(e) {
                        currentInput = $(this).val();
                        database.deckData.steps[slideIndexNumber].content = currentInput;
                        currentSlide.html(markdown_to_html(currentInput.replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;')));
                        e.stopImmediatePropagation();
                        $(this).val('');
                        mode = 'prezi';
						$('.ux-helper').html("Press <span class='keyboard'>ENTER</span> to edit.");
                        // hide save text button
                        // hide cancel edit button
                    }
                });
		        }    
		    });
		return false;
    });

}

var buildTree = function() {
	var deck        = database.deckData,
		deck_length 	= deck.steps.length,
		template   		= database.templateData[deck.template_id - 1];

	for(var i = 0; i < deck_length; i++) {
		$('#impress').append('<div></div>');
		$('#impress > div').last().attr('class', template['klass']);
		$('#impress > div').last().attr('data-x', template['data-x'] * i);
		$('#impress > div').last().attr('data-y', template['data-y'] * i);
		$('#impress > div').last().attr('data-z', template['data-z'] * i);
		$('#impress > div').last().attr('data-rotate-x', template['data-rotate-x'] * i);
		$('#impress > div').last().attr('data-rotate-y', template['data-rotate-y'] * i);
		$('#impress > div').last().attr('data-rotate-z', template['data-rotate-z'] * i);
		$('#impress > div').last().css('font-size', deck.steps[i]['font-size']);
		if (template['data-scale'] == false) {
        $('#impress > div').last().attr('data-scale', 1);
    } else {
        $('#impress > div').last().attr('data-scale', template['data-scale'] * (i + 1));
    }
		$('#impress > div').last().html(markdown_to_html(deck.steps[i].content.replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;')));
	}
}

var constructTree = function() {
	destroyTree();
	buildTree();
	resetImpress();
	if ($('#impress').attr('data-mode') == 'edit') { createInlineEditor(); }
}

var dataLoaded = function() {
	return Boolean(database.templateData && database.deckData);
}

var destroyTree = function() {
	$('#impress > div').remove();
}

var getSlideIndexNumber = function(slide) {
  return parseInt(slide.attr('id').slice(5)) - 1;
}

var sendViaAjax = function(redirect_url) {
	$.ajax({
		type: "PUT",
		data:  { deck: database.deckData },
		url:  window.location.origin + '/decks/' + database.deckData.id,
		success: function() { 
			if (redirect_url) { 
				window.location.href = redirect_url; 
			}
	  },
		failure: function() { console.log(err); }
	});
}

setInterval(function() { sendViaAjax(); } , 2000);

$('#preview-button').click(function() {
	$('.navbar').slideUp('fast');
	$('#preview-mode').fadeIn('fast');
	sendViaAjax();
});

$('#impress-button').click(function() {
	var deck_url = window.location.origin + '/decks/' + database.deckData.id;
	sendViaAjax(deck_url);
	$('#impress').css({pointerEvents: 'none'});
});

$('a.edit-button').click(function(e) {
	$('.navbar').slideDown('fast').delay(50).css({display: 'block'});
	$('#preview-mode').fadeOut('fast');
	$('#impress').css({pointerEvents: ''});
});

$('#impress-button').click(function() {
	sendViaAjax(window.location.origin + '/decks/' + database.deckData.id);
});

$('.prev_slide').click(function() {
    impress().prev();
});

$('.next_slide').click(function() {
    impress().next();
});

$('.add_slide').click(function() {
	var currentSlide     = $('.active'),
		slideIndexNumber = getSlideIndexNumber(currentSlide),
		deck             = database.deckData;

	database.deckData.steps.splice(slideIndexNumber + 1, 0, { content: '', 
	    'font-size': database.templateData[deck.template_id - 1].default_font_size,
		'text-align': database.templateData[deck.template_id - 1].default_alignment });
	constructTree();
	impress().next();
});

$('.delete_slide').click(function() {
	var deckContent = database.deckData.steps
	var currentSlide = $('.active');
	var slideIndexNumber = getSlideIndexNumber(currentSlide);


    if (deckContent.length == 1) { 
        deckContent.push({ content: '', 'font-size': 16, 'text-align': 'left' }); 
        deckContent.splice(0, 1);
    } else {
        deckContent.splice(slideIndexNumber, 1);
    }

    constructTree();
    if (slideIndexNumber == deckContent.length) { impress().prev(); }
});

$('.temp_dropdown').change(function() {
	database.deckData.template_id = parseInt($(this).val());
	constructTree();
});



// $('.size_dropdown').change(function() {
// 	var deckContent = database.deckData.steps
// 	var currentSlide = $('.active');
// 	var slideIndexNumber = getSlideIndexNumber(currentSlide);
// 	
// 	console.log($('#inline-editor'));
// 	deckContent[slideIndexNumber]['font-size'] = parseInt($(this).val());
// 	$('#inline-editor').css('font-size', database.deckData.steps[slideIndexNumber]['font-size']);
// 	$(currentSlide).css('font-size', database.deckData.steps[slideIndexNumber]['font-size']);
// });

