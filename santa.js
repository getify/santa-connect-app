(function SantaConnect(){
	"use strict";

	var menuIcon;
	var menu;
	var menuLogout;
	var menuReset;
	var selectedChild;
	var childName;
	var childPicker;
	var childOptions;
	var newChild;
	var addChild;
	var goodnessScale;
	var meter;
	var meterTab;
	var niceButton;
	var naughtyButton;
	var childStatus;
	var wishlistBtn;
	var wishlistModal;
	var wishlistClose;
	var wishlistName;
	var wishlistItems;
	var wishlistItemsList;
	var pageCover;
	var splash;
	var loginModal;
	var PINdigits;
	var numberPad;
	var loginCancelBtn;
	var loginSubmitBtn;
	var confirmDialog;
	var confirmMsg;

	var userData;
	var userSession;
	var PINentered = "";
	var meterRect;
	var lockOrientation;

	// detect orientation locking
	lockOrientation =
	(window.screen.lockOrientation ?
		window.screen.lockOrientation.bind(window.screen) : null
	) ||
	(window.screen.mozLockOrientation ?
		window.screen.mozLockOrientation.bind(window.screen) : null
	) ||
	(window.screen.msLockOrientation ?
		window.screen.msLockOrientation.bind(window.screen) : null
	) ||
	((window.screen.orientation && window.screen.orientation.lock) ?
		window.screen.orientation.lock.bind(window.screen.orientation) : null
	) ||
	null;

	// lock orientation to portrait, if possible
	if (lockOrientation) {
		lockOrientation("portrait").catch(function noop(){});
	}

	// pull user data
	userData = getLocalData();
	userSession = getSessionData();

	// init DOM elements on DOM-ready
	if (document.readyState != "interactive" && document.readyState != "complete") {
		document.addEventListener("DOMContentLoaded",init,false);
	}
	else {
		init();
	}


	// **********************

	function init() {
		// setup DOM element refs
		menuIcon = getElementByRel("js-menu-icon");
		menu = getElementByRel("js-menu");
		menuLogout = getElementByRel("js-menu-logout");
		menuReset = getElementByRel("js-menu-reset");
		selectedChild = getElementByRel("js-selected-child");
		childName = getElementByRel("js-child-name");
		childPicker = getElementByRel("js-child-picker");
		childOptions = getElementByRel("js-child-options");
		newChild = getElementByRel("js-new-child");
		addChild = getElementByRel("js-add-child-btn");
		goodnessScale = getElementByRel("js-goodness-scale");
		meter = getElementByRel("js-meter");
		meterTab = getElementByRel("js-meter-tab");
		niceButton = getElementByRel("js-nice-btn");
		naughtyButton = getElementByRel("js-naughty-btn");
		childStatus = getElementByRel("js-child-status");
		wishlistBtn = getElementByRel("js-wishlist-btn");
		wishlistModal = getElementByRel("js-wishlist-modal");
		wishlistClose = getElementByRel("js-wishlist-close");
		wishlistName = getElementByRel("js-wishlist-name");
		wishlistItems = getElementByRel("js-wishlist-items");
		wishlistItemsList = [
			getElementByRel("js-wishlist-item-1").children[0],
			getElementByRel("js-wishlist-item-2").children[0],
			getElementByRel("js-wishlist-item-3").children[0],
			getElementByRel("js-wishlist-item-4").children[0],
			getElementByRel("js-wishlist-item-5").children[0]
		];
		pageCover = getElementByRel("js-page-cover");
		splash = getElementByRel("js-splash");
		loginModal = getElementByRel("js-login-modal");
		PINdigits = [
			getElementByRel("js-digit-1"),
			getElementByRel("js-digit-2"),
			getElementByRel("js-digit-3"),
			getElementByRel("js-digit-4")
		];
		numberPad = getElementByRel("js-number-pad");
		loginCancelBtn = getElementByRel("js-pad-cancel");
		loginSubmitBtn = getElementByRel("js-pad-submit");
		confirmDialog = getElementByRel("js-confirm-dialog");
		confirmMsg = getElementByRel("js-confirm-msg");

		// hide title splash now that we've loaded
		splash.style.display = "none";

		// has user entered any children?
		if (userData.children && userData.children.length > 0) {
			for (var i = 0; i < userData.children.length; i++) {
				addChildName(userData.children[i].name,i);
			}

			// pick the first child by default
			selectedChild.setAttribute("data-child",String(userData.children.length-1));
			childName.innerHTML = userData.children[userData.children.length-1].name;

			// at limit of kids?
			if (userData.children.length >= 4) {
				addChild.style.display = "none";
			}

			// show goodness scale for selected child
			updateGoodness();

			wishlistBtn.style.display = "block";
		}

		// has user created a PIN?
		if (userData.PIN && userData.PIN.length == 4) {
			loginSubmitBtn.innerHTML = "Login";

			// user correctly logged in?
			if (userSession.PIN && userSession.PIN == userData.PIN) {
				closeLogin();
			}
			// otherwise, show login modal to login
			else {
				openLogin();
			}
		}
		// otherwise, only show login modal to create PIN
		else {
			openLogin();
		}

		// setup events
		numberPad.addEventListener("click",numberPadPressed,false);
		menuIcon.addEventListener("click",openMenu,false);
		menu.addEventListener("click",stopEvent,false);
		menuLogout.addEventListener("click",logout,false);
		menuReset.addEventListener("click",resetPressed,false);
		selectedChild.addEventListener("click",openChildPicker,false);
		childOptions.addEventListener("click",childPressed,false);
		childPicker.addEventListener("click",stopEvent,false);
		addChild.addEventListener("click",addChildPressed,false);
		newChild.children[0].addEventListener("keypress",newNameKeyPressed,false);
		niceButton.addEventListener("click",nicePressed,false);
		naughtyButton.addEventListener("click",naughtyPressed,false);
		wishlistBtn.addEventListener("click",openWishlist,false);
		wishlistModal.addEventListener("click",stopEvent,false);
		wishlistClose.addEventListener("click",closeWishlist,false);
		wishlistItems.addEventListener("keydown",updateWishlistData,false);
		wishlistItems.addEventListener("change",updateWishlistData,/*eventCapturingPhase:*/true);
		wishlistItems.addEventListener("focus",activateWishlistItem,/*eventCapturingPhase:*/true);
		wishlistItems.addEventListener("blur",deactivateWishlistItems,/*eventCapturingPhase:*/true);
		wishlistItems.addEventListener("keypress",wishlistKeyPressed,false);
		meter.addEventListener("touchstart",meterDragStart,false);
		meter.addEventListener("mousedown",meterDragStart,false);
	}

	function openMenu(evt) {
		stopEvent(evt);

		closeChildPicker();
		closeWishlist();

		if (menu.style.display != "block") {
			menu.style.display = "block";
			document.addEventListener("click",closeMenu,false);
		}
	}

	function closeMenu(evt) {
		stopEvent(evt);

		if (menu.style.display == "block") {
			menu.style.display = "none";
			document.removeEventListener("click",closeMenu,false);
		}
	}

	function logout(evt) {
		stopEvent(evt);

		setSessionData("PIN","");
		resetSelectedChild();
		updateGoodness();
		openLogin();
	}

	function openConfirm(msg) {
		if (confirmDialog.style.display != "block") {
			confirmDialog.style.display = "block";
			confirmMsg.innerHTML = msg;
		}
	}

	function closeConfirm() {
		if (confirmDialog.style.display == "block") {
			confirmDialog.style.display = "none";
			confirmMsg.innerHTML = "";
		}
	}

	function dialogCaptureClicks(evt) {
		var rel = evt.target.getAttribute("rel");
		if (!/\bjs-confirm-(?:yes|no)\b/.test(rel)) {
			stopEvent(evt);
		}
	}

	function resetPressed(evt) {
		stopEvent(evt);

		closeMenu();
		closeChildPicker();
		closeWishlist();

		openConfirm("Clear all data?");

		// global event handler for dialog "modal" behavior
		document.addEventListener("click",dialogCaptureClicks,/*eventCapturingPhase:*/true);

		// confirm button events
		confirmDialog.addEventListener("click",onConfirmClear,false);
	}

	function onConfirmClear(evt){
		stopEvent(evt);

		var rel = evt.target.getAttribute("rel");

		if (/\bjs-confirm-yes\b/.test(rel)) {
			closeConfirm();
			reset();
			openLogin();
		}
		else if (/\bjs-confirm-no\b/.test(rel)) {
			closeConfirm();
		}
		else {
			return;
		}

		// unregister this event handler now
		confirmDialog.removeEventListener("click",onConfirmClear,false);

		// unregister global event handler
		document.removeEventListener("click",dialogCaptureClicks,/*eventCapturingPhase:*/true);
	}

	function reset() {
		try {
			localStorage.removeItem("user-data");
			sessionStorage.removeItem("user-data");
		}
		catch (err) {}

		userData = {};
		userSession = {};
		loginSubmitBtn.innerHTML = "Set Code";
		addChild.style.display = "block";

		// remove child-picker options
		while (childOptions.children.length > 0) {
			childOptions.removeChild(childOptions.firstChild);
		}

		resetSelectedChild();
		updateGoodness();

		wishlistBtn.style.display = "none";
	}

	function resetSelectedChild() {
		if (userData.children && userData.children.length > 0) {
			selectedChild.setAttribute("data-child",userData.children.length-1);
			childName.innerHTML = userData.children[userData.children.length-1].name;
		}
		else {
			selectedChild.removeAttribute("data-child");
			childName.innerHTML = "&mdash; your child &mdash;";
		}
	}

	function openChildPicker(evt) {
		stopEvent(evt);

		closeMenu();
		closeWishlist();

		if (childPicker.style.display != "block") {
			childPicker.style.display = "block";
			document.addEventListener("click",closeChildPicker,false);

			// need to show the existing child options?
			if (userData.children && userData.children.length > 0) {
				childOptions.style.display = "block";

				// reset add-child
				resetAddChild();
			}
			// otherwise, hide options container
			else {
				childOptions.style.display = "none";

				// start add-child flow by default
				startAddChild();
			}
		}
		else {
			closeChildPicker();
		}
	}

	function closeChildPicker(evt) {
		stopEvent(evt);

		if (childPicker.style.display == "block") {
			if (userData.children && userData.children.length > 0) {
				resetAddChild();
			}
			childPicker.style.display = "none";
			newChild.children[0].blur();
			document.removeEventListener("click",closeChildPicker,false);
		}
	}

	function openLogin(evt) {
		stopEvent(evt);

		closeMenu();
		closeChildPicker();

		pageCover.style.display = "block";
		loginModal.style.display = "block";
	}

	function closeLogin(evt) {
		stopEvent(evt);

		pageCover.style.display = "none";
	}

	function numberPadPressed(evt) {
		stopEvent(evt);

		var btn = evt.target;
		var rel = btn.getAttribute("rel");

		// number pad button pressed?
		if (rel && /\bjs-pad-/.test(rel)) {
			// cancel button pressed?
			if (/\bjs-pad-cancel\b/.test(rel)) {
				PINentered = "";
			}
			// submit button pressed?
			else if (/\bjs-pad-submit\b/.test(rel)) {
				checkPIN(PINentered);
				loginSubmitBtn.innerHTML = "Login";
				PINentered = "";
			}
			// otherwise, numeric button pressed
			else {
				var num = Number(rel.match(/\bjs-pad-(\d)\b/)[1]);
				if (num >= 0 && num <= 9 && PINentered.length < 4) {
					PINentered += String(num);
				}
			}
		}

		updatePIN(PINentered);
		loginCancelBtn.disabled = (PINentered.length == 0);
		loginSubmitBtn.disabled = (PINentered.length < 4);
	}

	function updatePIN(PIN) {
		// update PIN digits
		for (var i = 0; i < 4; i++) {
			// PIN digit entered so far?
			if (i < PIN.length) {
				PINdigits[i].innerHTML = "*";
			}
			// otherwise, not entered yet
			else {
				PINdigits[i].innerHTML = "&nbsp;";
			}
		}
	}

	function checkPIN(PIN) {
		// PIN need to be created?
		if (!userData.PIN || userData.PIN.length != 4) {
			setLocalData("PIN",PIN);
			setSessionData("PIN",PIN);
			closeLogin();
		}
		// does the PIN match?
		else if (PIN == userData.PIN) {
			setSessionData("PIN",PIN);
			closeLogin();
		}
	}

	function resetAddChild() {
		newChild.style.display = "none";
		newChild.children[0].value = "";
		addChild.innerHTML = "+";
		newChild.children[0].blur();
	}

	function startAddChild() {
		newChild.style.display = "block";
		newChild.children[0].value = "";
		addChild.innerHTML = "✓";
		newChild.children[0].focus();
	}

	function updateGoodness() {
		var child = selectedChild.getAttribute("data-child");
		if (
			userData.children &&
			userData.children.length > 0 &&
			typeof child == "string" &&
			child != ""
		) {
			child = Number(child);

			goodnessScale.style.display = "block";

			var childScore = Number(userData.children[child].score);

			if (!(childScore >= 0) || childScore % 20 != 0) {
				childScore = 100;
			}

			userData.children[child].score = childScore;
			setLocalData("children",userData.children);

			meterTab.className = "p" + childScore;

			if (childScore >= 80) {
				childStatus.innerHTML = "Nice!";
			}
			else if (childScore == 60) {
				childStatus.innerHTML = "Watch out!";
			}
			else if (childScore == 40) {
				childStatus.innerHTML = "Uh oh...";
			}
			else {
				childStatus.innerHTML = "Naughty";
			}
		}
		else {
			goodnessScale.style.display = "none";
		}
	}

	function addChildName(name,childIndex) {
		var childBtn = document.createElement("button");
		childBtn.className = "child-option";
		childBtn.setAttribute("rel","js-child-option");
		childBtn.setAttribute("data-index",String(childIndex));
		childBtn.innerHTML = name;
		childOptions.insertBefore(childBtn,childOptions.firstChild);
	}

	function childPressed(evt) {
		stopEvent(evt);

		var rel = evt.target.getAttribute("rel");

		if (/\bjs-child-option\b/.test(rel)) {
			var childIndex = evt.target.getAttribute("data-index");
			pickChild(childIndex);
			closeChildPicker();
			updateGoodness();
		}
	}

	function pickChild(childIndex) {
		childIndex = Number(childIndex);
		if (!(childIndex >= 0 && childIndex <= 3)) {
			childIndex = 0;
		}
		selectedChild.setAttribute("data-child",String(childIndex));
		childName.innerHTML = userData.children[childIndex].name;
	}

	function newNameKeyPressed(evt) {
		// enter pressed?
		if (evt.charCode == 13) {
			stopEvent(evt);
			addChildPressed(evt);
		}
	}

	function addChildPressed(evt) {
		stopEvent(evt);

		// already entering child's name?
		if (newChild.style.display != "none") {
			if (!userData.children) {
				userData.children = [];
			}

			var name = newChild.children[0].value;
			name = name
				.replace(/[^a-zA-Z0-9\s\.'"]+/,"")
				.replace(/^\s+/,"")
				.replace(/\s+$/,"")
				.substr(0,20)
				.toUpperCase();
			if (name.length > 0) {
				userData.children.push({ name: name, score: 100, wishlist: [] });

				// at limit of kids?
				if (userData.children.length >= 4) {
					addChild.style.display = "none";
				}

				addChildName(name,userData.children.length - 1);
				pickChild(userData.children.length - 1);
				setLocalData("children",userData.children);
				updateGoodness();
				wishlistBtn.style.display = "block";
			}

			closeChildPicker();
		}
		else {
			startAddChild();
		}
	}

	function nicePressed(evt) {
		stopEvent(evt);

		closeMenu();
		closeChildPicker();
		closeWishlist();

		var childIndex = Number(selectedChild.getAttribute("data-child"));
		if (
			userData.children &&
			userData.children[childIndex] &&
			userData.children[childIndex].score < 100
		) {
			userData.children[childIndex].score += 20;
			setLocalData("children",userData.children);
			updateGoodness();
		}
	}

	function naughtyPressed(evt) {
		stopEvent(evt);

		closeMenu();
		closeChildPicker();
		closeWishlist();

		var childIndex = Number(selectedChild.getAttribute("data-child"));
		if (
			userData.children &&
			userData.children[childIndex] &&
			userData.children[childIndex].score > 0
		) {
			userData.children[childIndex].score -= 20;
			setLocalData("children",userData.children);
			updateGoodness();
		}
	}

	function meterDragStart(evt) {
		stopEvent(evt);

		closeMenu();
		closeChildPicker();
		closeWishlist();

		meterRect = meter.getBoundingClientRect();
		meterDragMove(evt);
		meter.addEventListener("touchmove",meterDragMove,false);
		meter.addEventListener("mousemove",meterDragMove,false);
		document.addEventListener("touchcancel",meterDragEnd,false);
		document.addEventListener("touchend",meterDragEnd,false);
		document.addEventListener("mouseup",meterDragEnd,false);
	}

	function meterDragMove(evt) {
		stopEvent(evt);

		evt = normalizeClickTouchEvent(evt);
		if (evt.clientY >= meterRect.top && evt.clientY <= meterRect.bottom) {
			var percent = Math.max(
				0,
				Math.min(
					100,
					Math.round((meterRect.bottom - evt.clientY) / meterRect.height * 5) * 20
				)
			);

			var childIndex = Number(selectedChild.getAttribute("data-child"));
			userData.children[childIndex].score = percent;
			setLocalData("children",userData.children);
			updateGoodness();
		}
	}

	function meterDragEnd(evt) {
		stopEvent(evt);

		meter.removeEventListener("touchmove",meterDragMove,false);
		meter.removeEventListener("mousemove",meterDragMove,false);
		document.removeEventListener("touchcancel",meterDragEnd,false);
		document.removeEventListener("touchend",meterDragEnd,false);
		document.removeEventListener("mouseup",meterDragEnd,false);
	}

	function openWishlist(evt) {
		stopEvent(evt);

		closeMenu();
		closeChildPicker();

		if (wishlistModal.style.display != "block") {
			var childIndex = Number(selectedChild.getAttribute("data-child"));
			if (!userData.children[childIndex].wishlist) {
				userData.children[childIndex].wishlist = [];
			}

			// filter wishlist items to avoid empty slots
			userData.children[childIndex].wishlist =
				userData.children[childIndex].wishlist.filter(function isNonEmpty(val){
					return (val != "" && /[^\s]/.test(val));
				});
			setLocalData("children",userData.children);

			wishlistModal.style.display = "block";
			wishlistName.innerHTML = userData.children[childIndex].name;

			// how many wishlist items are enabled (based on goodness)?
			var numEnabled = 5;
			if (userData.children[childIndex].score < 80) numEnabled = 4;
			if (userData.children[childIndex].score < 60) numEnabled = 3;
			if (userData.children[childIndex].score < 40) numEnabled = 2;
			if (userData.children[childIndex].score < 20) numEnabled = 0;

			// populate wishlist items and focus first empty entry
			if (!wishlistItemsList[0].disabled) {
				wishlistItemsList[0].focus();
			}
			for (var i = wishlistItemsList.length - 1; i >= 0; i--) {
				if (i > (numEnabled - 1)) {
					wishlistItemsList[i].disabled = true;
				}
				if (userData.children[childIndex].wishlist[i] != null) {
					wishlistItemsList[i].value = userData.children[childIndex].wishlist[i];
				}
				else if (wishlistItemsList[i].disabled) {
					wishlistItemsList[i].value = "|||||||||||||||||||||";
				}
				if (wishlistItemsList[i].value == "" && !wishlistItemsList.disabled) {
					wishlistItemsList[i].focus();
				}
			}

			document.addEventListener("click",closeWishlist,false);
		}
		else {
			closeWishlist();
		}
	}

	function updateWishlistData() {
		var childIndex = Number(selectedChild.getAttribute("data-child"));

		for (var i = 0; i < wishlistItemsList.length; i++) {
			if (!wishlistItemsList[i].disabled) {
				wishlistItemsList[i].value = wishlistItemsList[i].value
					.replace(/^\s+/,"")
					.substr(0,15);
				userData.children[childIndex].wishlist[i] = wishlistItemsList[i].value.toUpperCase();
			}
		}

		setLocalData("children",userData.children);
	}

	function closeWishlist(evt) {
		stopEvent(evt);

		if (wishlistModal.style.display == "block") {
			var childIndex = Number(selectedChild.getAttribute("data-child"));
			wishlistModal.style.display = "none";
			wishlistName.innerHTML = "";
			updateWishlistData();

			// filter wishlist items to avoid empty slots
			userData.children[childIndex].wishlist =
				userData.children[childIndex].wishlist
					.filter(function isNonEmpty(val){
						return (val != "" && /[^\s]/.test(val));
					})
					.map(function trim(val){
						return val.replace(/\s+$/,"");
					});
			setLocalData("children",userData.children);

			// empty wishlist items
			for (var i = 0; i < wishlistItemsList.length; i++) {
				wishlistItemsList[i].disabled = false;
				wishlistItemsList[i].value = "";
				wishlistItemsList[i].className = "";
			}

			document.removeEventListener("click",closeWishlist,false);
		}
	}

	function deactivateWishlistItems() {
		for (var i = 0; i < wishlistItemsList.length; i++) {
			wishlistItemsList[i].className = "";
		}
	}

	function activateWishlistItem(evt) {
		deactivateWishlistItems();
		evt.target.className = "active";
	}

	function wishlistKeyPressed(evt) {
		// enter pressed?
		if (evt.charCode == 13) {
			stopEvent(evt);
			updateWishlistData();

			// move focus to next list item
			var index = Number(evt.target.parentNode.getAttribute("rel").match(/(\d)$/)[1]) - 1;
			for (var i = 0; i < wishlistItemsList.length; i++) {
				index = (index + 1) % 5;
				if (!wishlistItemsList[index].disabled) {
					wishlistItemsList[index].focus();
					break;
				}
			}
		}
	}


	// **********************

	function normalizeClickTouchEvent(evt) {
		if (evt && TouchEvent && evt instanceof TouchEvent && evt.touches) {
			return evt.touches[0];
		}
		return evt;
	}

	function stopEvent(evt) {
		if (evt) {
			evt.preventDefault();
			evt.stopPropagation();
			evt.stopImmediatePropagation();
		}
	}

	function getElementByRel(relVal,el) {
		if (!el) el = document;
		return el.querySelector("[rel~=" + relVal + "]");
	}

	function getLocalData() {
		var data;

		try {
			data = localStorage.getItem("user-data");
			if (data) {
				data = JSON.parse(data);
				return data;
			}

			localStorage.setItem("user-data",JSON.stringify({}));
		}
		catch (err) {}

		return {};
	}

	function getSessionData() {
		var data;

		try {
			data = sessionStorage.getItem("user-data");
			if (data) {
				data = JSON.parse(data);
				return data;
			}

			sessionStorage.setItem("user-data",JSON.stringify({}));
		}
		catch (err) {}

		return {};
	}

	function setLocalData(prop,val) {
		var data;
		userData[prop] = val;

		try {
			data = JSON.stringify(userData);
			localStorage.setItem("user-data",data);
		}
		catch (err) {}
	}

	function setSessionData(prop,val) {
		var data;
		userSession[prop] = val;

		try {
			data = JSON.stringify(userSession);
			sessionStorage.setItem("user-data",data);
		}
		catch (err) {}
	}

})();
