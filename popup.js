document.addEventListener("DOMContentLoaded", function () {
	const apiKeyInput = document.getElementById("api-key");
	const value = apiKeyInput.value;

	if (!value) {
		// Retrieve the API key from Chrome's local storage
		chrome.storage.local.get("linearApiKey", function (result) {
			const linearApiKey = result.linearApiKey;

			if (linearApiKey) {
				apiKeyInput.value = linearApiKey;
			}
		});
	}

	const saveButton = document.getElementById("save");

	saveButton.addEventListener("click", function () {
		const linearApiKey = apiKeyInput.value;

		// Store the API key in Chrome's local storage
		chrome.storage.local.set({linearApiKey: linearApiKey});
	});
});

document;
