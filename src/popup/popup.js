document.addEventListener("DOMContentLoaded", () => {
	const apiKeyInput = document.getElementById("api-key");
	const value = apiKeyInput.value;

	if (!value) prefillApiKeyInput(apiKeyInput);

	const saveButton = document.getElementById("save");

	saveButton.addEventListener("click", () => {
		onSave(apiKeyInput.value);
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

const onSave = (newLinearApiKey) => {
	chrome.storage.local.set({linearApiKey: newLinearApiKey});
};

document;
