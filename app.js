const consentInput = document.querySelector("#sms-consent");
const remindersInput = document.querySelector("#appointment-reminders");
const careUpdatesInput = document.querySelector("#care-updates");
const consentStatus = document.querySelector("#consent-status");
const reminderButton = document.querySelector("#send-reminder");
const themeButton = document.querySelector("#theme-toggle");
const thread = document.querySelector("#message-thread");
const quickReplies = document.querySelector("#quick-replies");
const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message-input");
const sendButton = document.querySelector("#send-message");

let consentState = "pending";
let hasSentReminder = false;
let messages = [];

function addMessage(text, sender) {
	messages.push({ text, sender, time: new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date()) });
	renderMessages();
}

function renderMessages() {
	thread.replaceChildren();

	for (const [index, message] of messages.entries()) {
		if (index === 0) {
			const date = document.createElement("div");
			date.className = "ts";
			date.textContent = "Text Message · SMS";
			thread.append(date);
		}

		const bubble = document.createElement("div");
		bubble.className = message.sender === "patient" ? "m me" : "m";
		bubble.textContent = message.text;
		thread.append(bubble);

		const time = document.createElement("div");
		time.className = message.sender === "patient" ? "dl" : "ts";
		time.textContent = message.sender === "patient" ? `Delivered ${message.time}` : message.time;
		thread.append(time);
	}

	thread.scrollTop = thread.scrollHeight;
	renderQuickReplies();
}

function renderQuickReplies() {
	const suggestions = consentState === "active"
		? ["C", "R", "STOP", "HELP"]
		: consentState === "stopped"
			? ["START", "HELP"]
			: ["YES", "STOP", "HELP"];

	quickReplies.replaceChildren();
	for (const suggestion of suggestions) {
		const button = document.createElement("button");
		button.type = "button";
		button.textContent = suggestion;
		button.setAttribute("aria-label", `Reply ${suggestion}`);
		button.addEventListener("click", () => handlePatientMessage(suggestion));
		quickReplies.append(button);
	}
}

function updatePreferences() {
	const isActive = consentState === "active" && consentInput.checked;
	consentStatus.textContent = consentState === "active"
		? "Opted in"
		: consentState === "stopped"
			? "Opted out"
			: "Not opted in";
	consentStatus.classList.toggle("on", isActive);
	remindersInput.disabled = !isActive;
	careUpdatesInput.disabled = !isActive;
	reminderButton.disabled = !isActive || !remindersInput.checked || hasSentReminder;
}

function handlePatientMessage(rawText) {
	const text = rawText.trim();
	if (!text) return;

	addMessage(text, "patient");
	const command = text.toUpperCase();

	if (command === "STOP" || command === "UNSUBSCRIBE" || command === "CANCEL" || command === "END" || command === "QUIT") {
		consentState = "stopped";
		consentInput.checked = false;
		updatePreferences();
		addMessage("You are unsubscribed and will receive no more SMS messages. Reply START to opt in again.", "health");
	} else if (command === "YES" || command === "START") {
		consentState = "active";
		consentInput.checked = true;
		updatePreferences();
		addMessage("You are opted in to Northstar Health text messages. Message and data rates may apply. Reply STOP to opt out or HELP for help.", "health");
	} else if (command === "HELP") {
		addMessage("Northstar Health demo: reply YES to opt in, STOP to opt out, or call (800) 555-0100 for support. Msg & data rates may apply.", "health");
	} else if (consentState === "active" && command === "C" && hasSentReminder) {
		addMessage("Thanks. Your appointment reminder is marked confirmed in this demo.", "health");
	} else if (consentState === "active" && command === "R" && hasSentReminder) {
		addMessage("To reschedule, please call (800) 555-0100. This demo does not change appointments.", "health");
	} else if (consentState === "active") {
		addMessage("Thanks for your message. This prototype does not connect to a care team.", "health");
	} else {
		addMessage("Reply YES to opt in, STOP to opt out, or HELP for more information.", "health");
	}

	messageInput.value = "";
	sendButton.disabled = true;
}

consentInput.addEventListener("change", () => {
	if (consentInput.checked) {
		consentState = "active";
		addMessage("You are opted in to Northstar Health text messages. Message and data rates may apply. Reply STOP to opt out or HELP for help.", "health");
	} else if (consentState === "active") {
		consentState = "stopped";
		addMessage("Your SMS preferences have been turned off in this demo.", "health");
	}
	updatePreferences();
	renderQuickReplies();
});

remindersInput.addEventListener("change", updatePreferences);
careUpdatesInput.addEventListener("change", updatePreferences);

messageInput.addEventListener("input", () => {
	sendButton.disabled = messageInput.value.trim().length === 0;
});

messageForm.addEventListener("submit", (event) => {
	event.preventDefault();
	handlePatientMessage(messageInput.value);
});

reminderButton.addEventListener("click", () => {
	if (consentState !== "active" || !remindersInput.checked) return;
	hasSentReminder = true;
	addMessage("Reminder: You have an appointment tomorrow at 9:30 AM. Reply C to confirm or R to reschedule.", "health");
	updatePreferences();
});

themeButton.addEventListener("click", () => {
	const isDark = document.documentElement.dataset.theme !== "dark";
	document.documentElement.dataset.theme = isDark ? "dark" : "light";
	themeButton.textContent = isDark ? "Use light theme" : "Use dark theme";
	themeButton.setAttribute("aria-pressed", String(isDark));
});

document.querySelector("#reset-demo").addEventListener("click", () => {
	consentState = "pending";
	hasSentReminder = false;
	messages = [];
	consentInput.checked = false;
	remindersInput.checked = true;
	careUpdatesInput.checked = false;
	document.documentElement.dataset.theme = "light";
	themeButton.textContent = "Use dark theme";
	themeButton.setAttribute("aria-pressed", "false");
	addMessage("Northstar Health: Reply YES to opt in to appointment reminders by text. Message and data rates may apply. Reply STOP to opt out or HELP for help.", "health");
	updatePreferences();
});

addMessage("Northstar Health: Reply YES to opt in to appointment reminders by text. Message and data rates may apply. Reply STOP to opt out or HELP for help.", "health");
updatePreferences();
