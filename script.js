const nonceValue = "jo7Idaj2143rDAMw131goia61jodjao793";
const APP_NAME = "Better Linear Integration";
const ISSUE_NAME_REGEX = /[A-Za-z]+-\d+/g;

const TITLE_SELECTOR = '[data-qa-selector="title_content"]';
const DESCRIPTION_SELECTOR = '[data-qa-selector="description_content"]';

const mrTitleObserver = new MutationObserver(function (_, mutationInstance) {
	const titleDivs = document.querySelectorAll(TITLE_SELECTOR);
	if (!titleDivs || !titleDivs[0]) return;

	handleTitle(titleDivs[0]);
	mutationInstance.disconnect();
});

const handleTitle = (titleDiv) => {
	const issuesIds = findIssuesIds(titleDiv.innerText);
	const uniqueIssuesIds = Array.from(new Set(issuesIds));
	if (uniqueIssuesIds.length <= 0) return;

	addIssuesLinksToTitle(uniqueIssuesIds);
	addIssuesLinksToDescription(uniqueIssuesIds);
};

const findIssuesIds = (title) => {
	if (!title) return [];
	return title.match(ISSUE_NAME_REGEX) ?? [];
};

const addIssuesLinksToDescription = (issuesIds) => {
	const descriptionDiv = document.querySelector(DESCRIPTION_SELECTOR);
	if (!descriptionDiv) return;
	console.log("descriptionDiv: ", descriptionDiv);

	const issuesLinksDiv = document.createElement("div");
	issuesLinksDiv.id = "issuesLinksDiv";

	const relatedIssuesDiv = document.createElement("div");
	relatedIssuesDiv.innerText = `${pluralize("Related issue", issuesIds)}:`;
	issuesLinksDiv.appendChild(relatedIssuesDiv);

	const issuesLinksUl = document.createElement("ul");
	issuesLinksUl.id = "issuesLinksUl";
	issuesLinksDiv.appendChild(issuesLinksUl);

	issuesIds.forEach((issueId) => {
		const issueLinkLi = document.createElement("li");
		issueLinkLi.innerHTML = `<a href="https://linear.app/issue/${issueId}" target="_blank">${issueId}</a>`;
		issuesLinksUl.appendChild(issueLinkLi);
	});

	// add br inside descriptionDiv
	const br = document.createElement("br");
	descriptionDiv.appendChild(br);

	descriptionDiv.appendChild(issuesLinksDiv);
};

const addIssuesLinksToTitle = (issuesIds) => {
	const titleDiv = document.querySelector(TITLE_SELECTOR);
	if (!titleDiv) return;

	// Find issues text in the title and replace them with their associated links
	let titleText = titleDiv.innerHTML;

	issuesIds.forEach((issueId) => {
		const link = `<a href="https://linear.app/issue/${issueId}" target="_blank">${issueId}</a>`;
		titleText = titleText.replace(issueId, link);
	});

	titleDiv.innerHTML = titleText;
};

mrTitleObserver.observe(document, {
	childList: true,
	subtree: true,
});

const pluralize = (word, array) => {
	return `${word}${array?.length > 1 ? "s" : ""}`;
};
