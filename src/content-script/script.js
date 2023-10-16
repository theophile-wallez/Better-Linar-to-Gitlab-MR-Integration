const mrTitleObserver = new MutationObserver(function (_, mutationInstance) {
	const titleDivs = document.querySelectorAll(TITLE_SELECTOR);
	if (!titleDivs || !titleDivs[0]) return;

	handleTitle(titleDivs[0]);
	mutationInstance.disconnect();
});

const observe = async () => {
	const API_KEY = await getAPIKey();
	if (!API_KEY) return;

	mrTitleObserver.observe(document, {
		childList: true,
		subtree: true,
	});
};

observe();
