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
	var meterTab;
	var niceButton;
	var naughtyButton;
	var childStatus;
	var loginBackground;
	var loginModal;
	var PINdigits;
	var numberPad;
	var loginCancelBtn;
	var loginSubmitBtn;
	var confirmDialog;

	var userData;
	var userSession;
	var PINentered = "";

	// pull user data
	userData = getLocalData();
	userSession = getSessionData();

	// init DOM elements on DOM-ready
	if (document.readyState != "interactive" && document.readyState != "complete") {
		document.addEventListener("DOMContentLoaded",init);
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
		meterTab = getElementByRel("js-meter-tab");
		niceButton = getElementByRel("js-nice-btn");
		naughtyButton = getElementByRel("js-naughty-btn");
		childStatus = getElementByRel("js-child-status");
		loginBackground = getElementByRel("js-login");
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
	}

	function openMenu(evt) {
		closeChildPicker();

		if (menu.style.display != "block") {
			stopEvent(evt);
			menu.style.display = "block";
			document.addEventListener("click",closeMenu,false);
		}
	}

	function closeMenu(evt) {
		if (menu.style.display != "none") {
			stopEvent(evt);
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
			getElementByRel("js-confirm-msg",confirmDialog).innerHTML = msg;
		}
	}

	function closeConfirm() {
		if (confirmDialog.style.display != "none") {
			confirmDialog.style.display = "none";
			getElementByRel("js-confirm-msg",confirmDialog).innerHTML = "";
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
		openConfirm("Clear all data?");

		// global event handler for dialog "modal" behavior
		document.addEventListener("click",dialogCaptureClicks,/*eventCapturingPhase:*/true);

		// confirm button events
		confirmDialog.addEventListener("click",function onDialogBtn(evt){
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
			confirmDialog.removeEventListener("click",onDialogBtn,false);

			// unregister global event handler
			document.removeEventListener("click",dialogCaptureClicks,true);
		},false);
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
		selectedChild.removeAttribute("data-child");
		childName.innerHTML = "&mdash; your child &mdash;";

		// remove child-picker options
		while (childOptions.children.length > 0) {
			childOptions.removeChild(childOptions.firstChild);
		}

		updateGoodness();
	}

	function resetSelectedChild() {
		if (userData.children) {
			selectedChild.setAttribute("data-child",userData.children.length-1);
			childName.innerHTML = userData.children[userData.children.length-1].name;
		}
		else {
			selectedChild.removeAttribute("data-child");
			childName.innerHTML = "&mdash; your child &mdash;";
		}
	}

	function openChildPicker(evt) {
		closeMenu();

		if (childPicker.style.display != "block") {
			stopEvent(evt);
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
	}

	function closeChildPicker(evt) {
		if (childPicker.style.display == "block") {
			stopEvent(evt);
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
		loginBackground.style.display = "block";
		loginModal.style.display = "block";
	}

	function closeLogin(evt) {
		stopEvent(evt);
		loginBackground.style.display = "none";
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
				PINdigits[i].innerHTML = "";
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
				childStatus.innerHTML = "Careful";
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

	function addChildName(name,index) {
		var childBtn = document.createElement("button");
		childBtn.className = "child-option";
		childBtn.setAttribute("rel","js-child-option");
		childBtn.setAttribute("data-index",String(index));
		childBtn.innerHTML = name;
		childOptions.insertBefore(childBtn,childOptions.firstChild);
	}

	function childPressed(evt) {
		stopEvent(evt);
		var rel = evt.target.getAttribute("rel");

		if (/\bjs-child-option\b/.test(rel)) {
			var index = evt.target.getAttribute("data-index");
			pickChild(index);
			closeChildPicker();
			updateGoodness();
		}
	}

	function pickChild(index) {
		index = Number(index);
		if (!(index >= 0 && index <= 3)) {
			index = 0;
		}
		selectedChild.setAttribute("data-child",String(index));
		childName.innerHTML = userData.children[index].name;
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
			name = name.replace(/[^a-zA-Z0-9\s\.'"]+/,"").substr(0,20).toUpperCase();
			if (name.length > 0) {
				userData.children.push({ name: name, score: 100 });

				// at limit of kids?
				if (userData.children.length >= 4) {
					addChild.style.display = "none";
				}

				addChildName(name,userData.children.length - 1);
				pickChild(userData.children.length - 1);
				setLocalData("children",userData.children);
				updateGoodness();
			}

			closeChildPicker();
		}
		else {
			startAddChild();
		}
	}

	function nicePressed(evt) {
		stopEvent(evt);
		var index = Number(selectedChild.getAttribute("data-child"));
		if (
			userData.children &&
			userData.children[index] &&
			userData.children[index].score < 100
		) {
			userData.children[index].score += 20;
			setLocalData("children",userData.children);
			updateGoodness();
		}
	}

	function naughtyPressed(evt) {
		stopEvent(evt);
		var index = Number(selectedChild.getAttribute("data-child"));
		if (
			userData.children &&
			userData.children[index] &&
			userData.children[index].score > 0
		) {
			userData.children[index].score -= 20;
			setLocalData("children",userData.children);
			updateGoodness();
		}
	}


	// **********************

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
