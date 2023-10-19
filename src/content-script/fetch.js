const getApiKeyFromStorage = async () =>
	new Promise((resolve, reject) => {
		chrome.storage.local.get(["linearApiKey"], (result) => {
			if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
			else resolve(result.linearApiKey);
		});
	});

const fetchLinearAPI = async (query) => {
	try {
		let keyAPI = await getApiKeyFromStorage();
		if (!keyAPI) return;

		const res = await fetch(API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: keyAPI,
			},
			body: JSON.stringify({query}),
		});
		if (!res.ok) {
			console.log("res: ", res);
			console.error(
				"Error while fetching data from Linear API, your API key may be invalid."
			);
		}
		return await res.json();
	} catch (error) {
		console.error(error.message);
	}
};
