const getAPIKey = async () =>
	new Promise((resolve, reject) => {
		chrome.storage.local.get(["linearApiKey"], function (result) {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			} else {
				resolve(result.linearApiKey);
			}
		});
	});

const fetchLinearAPI = async (query) => {
	try {
		let keyAPI = await getAPIKey();
		if (!keyAPI) {
			return;
		}
		const res = await fetch(API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: keyAPI,
			},
			body: JSON.stringify({query}),
		});
		if (!res.ok)
			throw new Error("Error while fetching data from Linear API");
		return await res.json();
	} catch (error) {
		throw new Error(error);
	}
};
