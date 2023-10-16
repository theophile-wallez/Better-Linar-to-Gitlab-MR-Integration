document.addEventListener("DOMContentLoaded", function () {
	const apiKeyInput = document.getElementById("api-key");
	const value = apiKeyInput.value;

	if (!value) {
		prefillApiKeyInput(apiKeyInput);
	}

	const saveButton = document.getElementById("save");

	saveButton.addEventListener("click", function () {
		onSave(apiKeyInput);
	});
});

const prefillApiKeyInput = (apiKeyInput) => {
	chrome.storage.local.get("linearApiKey", function (result) {
		const linearApiKey = result.linearApiKey;

		if (linearApiKey) {
			apiKeyInput.value = linearApiKey;
		}
	});
};

const onSave = (apiKeyInput) => {
	const linearApiKey = apiKeyInput.value;
	chrome.storage.local.set({linearApiKey: linearApiKey});
};

document;
