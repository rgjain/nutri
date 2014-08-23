// Event binding for all the functionality
var $body = $("body");

$body.on("submit", "#recipeSearchForm", function (e) {
	e.preventDefault();

	var searchOptions = {
			searchKeyword : $(this).find("#recipeSearchInput").val(),
			page : 1,
			rpp : 20
		},
		url = '/getrecipes/' + searchOptions.searchKeyword + '/' + searchOptions.page + '/' + searchOptions.rpp;

	showLoader ({
		selector : "body",
		curtain : true
	});
	searchRecipeJson(url);
});

$body.on("click", ".get-recipe", function (e) {
	e.preventDefault();
	var href = $(this).prop("href");
	getRecipeJson(href);
});

$body.on("click", "#fetch-nutrition", function (e) {
	e.preventDefault();
	getNutritionInfoJson();
});

$body.on("click", ".action-btn", function (e) {
	e.preventDefault();
	var el = $(this);

	if (el.hasClass("remove")) {
		el.closest("tr").remove();
	}
	if (el.hasClass("add")) {
		var elClone = $("#ingredientInfo tbody").find("tr:last").clone();
		if (elClone.find(".action-btn.remove").length == 0) {
			elClone.find("td:last").html('<a href="javascript:void(0)" class="action-btn remove" >&times;</a>');
		}
		elClone.find("td:first").text(parseInt(elClone.find("td:first").text()) + 1);
		elClone.find('input').val("");
		console.log(elClone.find('td .ing-unit'));
		elClone.find('.ing-unit').replaceWith($("#metricDropDownDummy").clone());
		elClone.find("#metricDropDownDummy").removeClass("hidden");
		$("#ingredientInfo tbody").append(elClone);
	}
});

$body.on("click", "#recipeOverlay .prev, #recipeOverlay .next", function () {
	var el = $(this),
		currRecipeLI = $("#recipe_" + getRecipeId()),
		requiredRecipeLI = (el.hasClass("prev")) ? currRecipeLI.prev() : currRecipeLI.next();
		url = requiredRecipeLI.find(".get-recipe").prop("href");
		
	removeRecipeOverlay();
	getRecipeJson(url);
})
/*$body.on("mouseenter", "#recipeOverlay", function (e) {
	$("#recipeNavigation").addClass("hover")
});
$body.on("mouseleave", "#recipeOverlay", function (e) {
	$("#recipeNavigation").removeClass("hover")
});
*/
// Service calls
// Make an ajax call to the big oven api to get the results based on the keyword.
function searchRecipeJson(url, renderType, lazyload) {

	if (typeof lazyload != 'undefined' && lazyload == true) {
		var selector = $("#resultsGrid"),
			llanchor = selector.find(".next-page");
			url = llanchor.prop('href');

		llanchor.remove();
		selector.find('div#loader').show();
	}

	if (typeof url != 'undefined' && url != "") {
		$.ajax({
			type: "GET",
			dataType: 'json',
			url: url,
			success: function (resultsObject) {
				doRenderForSearch(resultsObject, renderType);
			}
		});
	}
}

// Make an ajax call to the big oven api to get the recipe based on the recipe id.
function getRecipeJson(href) {
	var url = href;

	showLoader ({
		selector : "body",
		curtain : true
	});
	
	$.ajax({
		type: "GET",
		dataType: 'json',
		cache: false,
		url: url,
		success: function (resultsObject) {
			doRenderForRecipe(resultsObject);
		}
	});
}

// Make an ajax call to the edamam api to get the nutrition info.
function getNutritionInfoJson() {
	var url = '/getnutrition';

	showLoader ({
		selector : "body",
		curtain : true
	});
	
	// request JSON object generation
	var title = $("#recipeInfo .title").text(),
		ingTR = $("#ingredientInfo tbody").find("tr"),
		ingCollateArray = [],
		requestObject = {
			title : title,
			ingr : []
		};

	$.each(ingTR, function(index, val) {
		var el = $(val),
			ingQty = el.find(".ing-qty").val(),
			ingUnit = el.find(".ing-unit").text(),
			ingName = el.find(".ing-name").val();

		ingCollateArray.push(ingQty + " " + ingUnit + " " + ingName);
	});

	requestObject.ingr = ingCollateArray;

	$.ajax({
		type: "POST",
		dataType: 'json',
		cache: false,
		url: url,
		data : requestObject,
		success: function (resultsObject) {
			doRenderForNutritionInfo(resultsObject);
		}
	});
}

// Rendering Logic
function doRenderForSearch (resultsObject, renderType) {
	resultsGridRender(resultsObject, renderType);
	paginationRender(resultsObject);
}

function doRenderForRecipe (resultsObject) {
	createCurtain();
	renderRecipeOverlay(resultsObject);
	disableWindowScroll();
}

function doRenderForNutritionInfo (resultsObject) {
	renderNutrientInfo(resultsObject);
	scrollDiv();
}

// Rendering handlebars
function resultsGridRender (resultsObject, renderType) {
	var tmpl = $("#recipeResultsTmpl").html(),
		target = "#resultsGrid",
		template = Handlebars.compile(tmpl),
		rendered = template(resultsObject);

	if (renderType == "append") {
		$(target).append(rendered);	
	} else {
		$(target).html(rendered);
	}
}

function paginationRender (resultsObject) {
	var tmpl = $("#paginationTmpl").html(),
		target = "#pagination",
		template = Handlebars.compile(tmpl),
		rendered = template(resultsObject);

	$(target).html(rendered);
}

function renderRecipeOverlay (resultsObject) {
	var tmpl = $("#recipeOverlayTmpl").html(),
		target = "body",
		template = Handlebars.compile(tmpl),
		rendered = template(resultsObject);

	$(target).append(rendered);
}

function renderNutrientInfo (resultsObject) {
	var tmpl = $("#nutrientInfoTmpl").html(),
		target = "#nutrientInfoWrapper",
		template = Handlebars.compile(tmpl),
		rendered = template(resultsObject);

	$(target).html(rendered);
}

// Other functions
function createCurtain () {
	var curtainMarkup = '<div id="curtain"></div>';
	$body.append(curtainMarkup);

	$body.on("click", "#curtain", function (e) {
		removeRecipeOverlay();
	});
}

function removeRecipeOverlay () {
	$("#recipeOverlay").fadeOut("100", function () {
		$(this).remove();
		removeRecipeNavigation();
		removeCurtain();
		enableWindowScroll();
	});
}

function removeCurtain () {
	$("#curtain").fadeOut("100", function () {
		$(this).remove();
	})
}

function removeRecipeNavigation () {
	$("#recipeNavigation").fadeOut("100", function () {
		$(this).remove();
	})
}

function showLoader (options) {
	var loaderMarkup = '<div id="loader"></div>',
		curtainMarkup = '<div id="loader-curtain"></div>',
		curtainObject = $("#loader-curtain"),
		targetElement = $(options.selector);

	if (options.curtain != false) {
		targetElement.append(curtainMarkup);
		targetElement.append(loaderMarkup);
	}
	targetElement.append(loaderMarkup);
}

function hideLoader () {
	$("#loader, #loader-curtain").fadeOut(100, function(){
		$(this).remove();
	})
}
/*
$(document).ajaxStart(function() {
	showLoader ({
		selector : "body",
		curtain : true
	});
});
*/
$(document).ajaxComplete(function() {
	hideLoader ();
});

function disableWindowScroll () {
	$("html, body").css("overflow", "hidden");
}

function enableWindowScroll () {
	$("html, body").css("overflow", "auto");
}

// Infinite scroll
function infiniteScroll () {	
	$(window).scroll(function()	{

	    if($(window).scrollTop() > $(document).height() - $(window).height() - 150) {
			searchRecipeJson("", "append", true);
	    }
	});
}
function getRecipeId () {
	return $("#recipeOverlay").attr("data-recipeid");
}

function scrollDiv () {
	var height = $("#recipeOverlay .right-col")[0].scrollHeight;
	$("#recipeOverlay .right-col").animate({
		scrollTop : height	
	}, 1000);
}