const ISSUE_NAME_REGEX = /[A-Za-z]+-\d+/g;
const TITLE_SELECTOR = '[data-qa-selector="title_content"]';
const DESCRIPTION_SELECTOR = '[data-qa-selector="description_content"]';
const API_CONFIG = {
	personnalKey: "<your_linear_api_key>",
	url: "https://api.linear.app/graphql",
};

const mrTitleObserver = new MutationObserver(function (_, mutationInstance) {
	const titleDivs = document.querySelectorAll(TITLE_SELECTOR);
	if (!titleDivs || !titleDivs[0]) return;

	handleTitle(titleDivs[0]);
	mutationInstance.disconnect();
});

const handleTitle = (titleDiv) => {
	const issuesIds = findIssuesIds(titleDiv.innerText);
	const uniqueIssuesIds = Array.from(new Set(issuesIds)).sort(
		(a, b) => a - b
	);
	if (uniqueIssuesIds.length <= 0) return;
	addIssuesLinksToTitle(uniqueIssuesIds);
	addIssuesLinksToDescription(uniqueIssuesIds);
};

const findIssuesIds = (title) => {
	if (!title) return [];
	return title.match(ISSUE_NAME_REGEX) ?? [];
};

const addIssuesLinksToTitle = (issuesIds) => {
	const titleDiv = document.querySelector(TITLE_SELECTOR);
	if (!titleDiv) return;

	// Find issues text in the title and replace them with their associated links
	let titleText = titleDiv.innerHTML;

	issuesIds.forEach((issueId) => {
		const link = `<a href="${getLinkToIssue(
			issueId
		)}" target="_blank">${issueId}</a>`;
		titleText = titleText.replace(issueId, link);
	});

	titleDiv.innerHTML = titleText;
};

const addIssuesLinksToDescription = (issuesIds) => {
	const descriptionDivs = document.getElementsByClassName(
		"issuable-discussion"
	);

	if (!descriptionDivs) return;
	const descriptionDiv = descriptionDivs[0];

	const issuesLinksContainer = document.createElement("div");
	issuesLinksContainer.className = "mr-section-container";
	issuesLinksContainer.style.marginTop = "1rem";
	issuesLinksContainer.style.transition = "all 0.2s ease-in-out";

	const issuesLinksBody = document.createElement("div");
	issuesLinksBody.className = "mr-widget-body";

	const titleRow = document.createElement("div");
	titleRow.style.display = "flex";
	titleRow.style.justifyContent = "space-between";
	titleRow.style.alignItems = "center";
	titleRow.style.marginBottom = "0.5rem";

	const relatedIssuesText = document.createElement("div");
	relatedIssuesText.innerText = pluralize(
		"🔗 Related Linear issue",
		issuesIds
	);
	relatedIssuesText.className = "main-title gl-font-weight-bold";
	titleRow.appendChild(relatedIssuesText);

	const myInboxLink = document.createElement("a");
	myInboxLink.className =
		"badge gl-bg-transparent! gl-inset-border-1-gray-100! gl-mr-3 gl-display-none gl-sm-display-block badge-muted badge-pill gl-badge md";
	myInboxLink.href = "https://linear.app/inbox";
	myInboxLink.target = "_blank";
	myInboxLink.style.textDecoration = "none";
	myInboxLink.style.display = "flex";
	myInboxLink.style.alignItems = "center";
	myInboxLink.style.gap = "5px";

	const myInboxText = document.createElement("div");
	myInboxText.innerText = "Inbox";

	myInboxLink.innerHTML = INBOX_ICON;

	myInboxLink.appendChild(myInboxText);
	titleRow.appendChild(myInboxLink);

	const myIssuesLink = document.createElement("a");
	myIssuesLink.className =
		"badge gl-bg-transparent! gl-inset-border-1-gray-100! gl-mr-3 gl-display-none gl-sm-display-block badge-muted badge-pill gl-badge md";
	myIssuesLink.href = "https://linear.app/my-issues/assigned";
	myIssuesLink.target = "_blank";
	myIssuesLink.style.textDecoration = "none";
	myIssuesLink.style.display = "flex";
	myIssuesLink.style.alignItems = "center";
	myIssuesLink.style.gap = "5px";

	myIssueText = document.createElement("div");
	myIssueText.innerText = "My issues";

	myIssuesLink.innerHTML = MY_ISSUES_ICON;

	myIssuesLink.appendChild(myIssueText);
	titleRow.appendChild(myIssuesLink);

	issuesLinksBody.appendChild(titleRow);

	const issuesCardsContainer = document.createElement("div");
	issuesCardsContainer.style.display = "flex";
	issuesCardsContainer.style.flexDirection = "column";
	issuesCardsContainer.style.gap = "8px";
	Promise.all(
		issuesIds.map(
			async (issueId, index) => await generateIssueCard(issueId, index)
		)
	).then((values) => {
		values.forEach((issueCard) => {
			issuesCardsContainer.appendChild(issueCard);
		});
		issuesLinksBody.appendChild(issuesCardsContainer);

		issuesLinksContainer.appendChild(issuesLinksBody);
		descriptionDiv.prepend(issuesLinksContainer);
	});
};

const generateIssueCard = async (issueId, index) => {
	const issueData = await getIssueData(issueId);
	if (!issueData) return;

	const issueCard = document.createElement("a");
	issueCard.href = issueData.url ?? getLinkToIssue(issueId);
	issueCard.target = "_blank";
	issueCard.className = "issue-card";
	const cardStyle = {
		textDecoration: "none",
		color: "var(--gray-600, #89888d)",
		zIndex: `${200 - index}`,
	};

	Object.assign(issueCard.style, cardStyle);
	// Issue title
	const issueTitle = document.createElement("div");
	issueTitle.innerText = `${issueData.identifier} - ${issueData.title}`;
	issueTitle.className = "gl-text-gray-900";
	issueTitle.style.flexShrink = "0";
	issueTitle.style.flexGrow = "1";
	issueCard.appendChild(issueTitle);

	const hasStatus = issueData.state;

	if (hasStatus) {
		const statusTag = generateStatus(issueData.state);
		issueCard.appendChild(statusTag);
	}
	const hasLabels = issueData.labels?.nodes?.length > 0;

	if (hasLabels) {
		issueData.labels.nodes
			.sort((a, b) => b.identifier - a.identifier)
			.forEach((label) => {
				const labelTag = generateLabel(label);
				issueCard.appendChild(labelTag);
			});
	}

	if (issueData.parent) {
		const parentTag = generateParentTag(issueData, issueData.parent);
		issueCard.appendChild(parentTag);
	}

	if (issueData.children?.nodes?.length > 0) {
		const expendableTagContainer = generateExpendedTagsContainer(
			issueData.children.nodes.length
		);

		const expendableTags = document.createElement("div");
		expendableTags.className = "expendable-tags";

		issueData.children.nodes.forEach((child) => {
			const childTag = generateChildTag(issueData, child);
			expendableTags.appendChild(childTag);
		});

		expendableTagContainer.appendChild(expendableTags);
		issueCard.appendChild(expendableTagContainer);
	}

	const hasblockIssues = issueData.relations?.nodes?.length > 0;
	if (hasblockIssues) {
		const isblocking = true;
		const expendableTagContainer = generateExpendedTagsContainer(
			issueData.relations.nodes.length
		);

		const expendableTags = document.createElement("div");
		expendableTags.className = "expendable-tags";

		issueData.relations.nodes.forEach((relation) => {
			const relationTag = generateRelationTag(
				issueData,
				relation.relatedIssue,
				isblocking
			);
			expendableTags.appendChild(relationTag);
		});

		expendableTagContainer.appendChild(expendableTags);
		issueCard.appendChild(expendableTagContainer);
	}

	const hasBlockedByIssues = issueData.inverseRelations?.nodes?.length > 0;
	if (hasBlockedByIssues) {
		const isblocking = false;
		const expendableTagContainer = generateExpendedTagsContainer(
			issueData.inverseRelations.nodes.length
		);

		const expendableTags = document.createElement("div");
		expendableTags.className = "expendable-tags";

		issueData.inverseRelations.nodes.forEach((relation) => {
			const relationTag = generateRelationTag(
				issueData,
				relation.issue,
				isblocking
			);
			expendableTags.appendChild(relationTag);
		});

		expendableTagContainer.appendChild(expendableTags);
		issueCard.appendChild(expendableTagContainer);
	}
	return issueCard;
};

const getSimpleTag = (text) => {
	const tag = document.createElement("div");
	tag.innerText = text;
	tag.className = "linear-tag";
	return tag;
};

const generateExpendedTagsContainer = (amount) => {
	const expendableTagContainer = document.createElement("div");
	expendableTagContainer.className = "expendable-tag-container";

	if (amount > 1) {
		const tagChipCounter = document.createElement("div");
		tagChipCounter.className = "tag-chip-counter";
		tagChipCounter.innerText = amount;
		expendableTagContainer.appendChild(tagChipCounter);
	}
	return expendableTagContainer;
};

const generateStatus = (status) => {
	const statusTag = document.createElement("div");
	statusTag.className = "linear-tag";
	statusTag.style.outlineColor = status.color;
	statusTag.style.boxShadow = `0px 0px 17px -8px ${status.color}`;
	const icon = statusToIconMap[status.name];
	if (icon) {
		const statusIconContainer = document.createElement("div");
		statusIconContainer.className = "icon-container";
		statusIconContainer.innerHTML = icon;
		statusIconContainer.style.color = status.color;
		statusTag.appendChild(statusIconContainer);
	}

	const statusText = document.createElement("div");
	statusText.innerText = status.name;

	statusTag.appendChild(statusText);
	return statusTag;
};

const generateLabel = (label) => {
	const labelTag = document.createElement("div");
	labelTag.innerText = label.name;
	labelTag.className = "linear-tag";

	if (label.color) {
		const labelDot = document.createElement("div");
		labelDot.className = "label-dot";
		labelDot.style.backgroundColor = label.color;
		labelTag.prepend(labelDot);
	}

	return labelTag;
};

const generateParentTag = (currentIssue, parent) => {
	const parentTag = document.createElement("a");
	parentTag.href = parent.url;
	parentTag.target = "_blank";
	parentTag.innerText = `👩‍👦  ${parent.identifier}`;

	parentTag.title = `${currentIssue.identifier} is a sub-issue of ${parent.identifier} - ${parent.title}}`;

	parentTag.style.color = "inherit";
	parentTag.style.textDecoration = "none";
	parentTag.className = "linear-tag clickable-tag";

	return parentTag;
};

const generateChildTag = (currentIssue, child) => {
	const childTag = document.createElement("a");
	childTag.href = child.url;
	childTag.target = "_blank";
	childTag.innerText = `👶  ${child.identifier}`;

	childTag.title = `${currentIssue.identifier} is a parent issue of ${child.identifier} - ${child.title}}`;

	childTag.style.color = "inherit";
	childTag.style.textDecoration = "none";
	childTag.className = "expendable-tag";

	return childTag;
};

const generateRelationTag = (mainIssue, relatedIssue, isblocking = true) => {
	const isIssueDone = mainIssue.state.name === "Done";

	const relationTag = document.createElement("a");
	relationTag.href = relatedIssue.url;
	relationTag.target = "_blank";
	relationTag.style.color = "inherit";
	relationTag.style.textDecoration = "none";
	relationTag.className = "expendable-tag";

	const action = isIssueDone ? "was" : "is";
	const relationType = isblocking ? "blocking" : "blocked by";
	relationTag.title = `${mainIssue.identifier} ${action} ${relationType} ${relatedIssue.identifier} - ${relatedIssue.title}`;

	const relationIconContainer = document.createElement("div");
	relationIconContainer.className = "icon-container";
	relationIconContainer.innerHTML = isblocking
		? BLOCKS_ICON
		: BLOCKED_BY_ICON;

	let relationIconColor = "#d47718"; // is blocked by
	if (isIssueDone) {
		relationIconColor = "#00aa5c";
	} else if (isblocking) {
		relationIconColor = "#f55859";
	}
	relationIconContainer.style.color = relationIconColor;
	relationTag.append(relationIconContainer);

	const relationText = document.createElement("div");
	relationText.innerText = relatedIssue.identifier;
	relationText.style.color = "var(--gray-600, #89888d);";

	relationTag.append(relationText);

	return relationTag;
};

const pluralize = (word, array) => {
	return `${word}${array?.length > 1 ? "s" : ""}`;
};

getIssueData = async (issueId) => {
	const issueQuery = issueQueryBuilder(issueId);
	const rawData = await fetchLinearAPI(issueQuery);
	return rawData?.data?.issue;
};

const fetchLinearAPI = async (query) => {
	try {
		const res = await fetch(API_CONFIG.url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: API_CONFIG.personnalKey,
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

const issueQueryBuilder = (issueId) => `{ 
	issue (id: "${issueId}") { 
		identifier
    	title
		url
    	labels {
      		nodes {
        		name
				color
      		}
    	}
 		state {
			name
    		color
   		}
		children {
      		nodes {
        		identifier
				url
				title
      		}
    	}
    	parent {
      		identifier
			url
			title
    	}
		relations {
      		nodes {
        		relatedIssue {
          			identifier
					url
					title
        		}
      		}
    	}
    	inverseRelations {
      		nodes {
        		issue {
          			identifier
					url
					title
        		}
      		}
    	}
	} 
}`;

const getLinkToIssue = (issueId) => `https://linear.app/issue/${issueId}`;

const ISSUE_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="#858699"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.5 11.2204C13.3829 10.8346 13.9999 9.95362 13.9999 8.92853V4.5C13.9999 3.11929 12.8806 2 11.4999 2H7.07132C6.04623 2 5.16524 2.61697 4.77942 3.49983L10 3.49983C11.3807 3.49983 12.5 4.61912 12.5 5.99983V11.2204ZM4.5 13.9998C3.11929 13.9998 2 12.8805 2 11.4998V7.07126C2 5.69055 3.11929 4.57126 4.5 4.57126L8.92853 4.57126C10.3092 4.57126 11.4285 5.69055 11.4285 7.07126V11.4998C11.4285 12.8805 10.3092 13.9998 8.92853 13.9998H4.5ZM8 9.49979C8 10.3282 7.32843 10.9998 6.5 10.9998C5.67157 10.9998 5 10.3282 5 9.49979C5 8.67136 5.67157 7.99979 6.5 7.99979C7.32843 7.99979 8 8.67136 8 9.49979ZM9.5 9.49979C9.5 11.1566 8.15685 12.4998 6.5 12.4998C4.84315 12.4998 3.5 11.1566 3.5 9.49979C3.5 7.84293 4.84315 6.49979 6.5 6.49979C8.15685 6.49979 9.5 7.84293 9.5 9.49979Z"></path></svg>`;
const BLOCKS_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="#f55859"><path d="M12.566 9a.6.6 0 0 1 .4.154l2.888 2.593a.4.4 0 0 1 0 .595l-2.887 2.592a.6.6 0 0 1-1.001-.446v-1.114c-4.667-.604-7-1.06-7-1.372 0-.406 4.825-1.139 7.001-1.403l-.001-.998a.6.6 0 0 1 .6-.6ZM2.75 1.04a.75.75 0 0 1 .743.648l.007.102v12.476a.75.75 0 0 1-1.493.102L2 14.266V1.79a.75.75 0 0 1 .75-.75Zm2.343-.023.077.027 7.535 3.375a.5.5 0 0 1 .094.858l-.082.05L5.183 8.95a.5.5 0 0 1-.71-.368l-.007-.083V1.501a.5.5 0 0 1 .627-.484Z"></path></svg>`;
const BLOCKED_BY_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="#d47718"><path d="M8.387 9a.6.6 0 0 1 .6.6l-.002.999c2.177.264 7.002.997 7.002 1.403 0 .311-2.334.768-7 1.371v1.115a.6.6 0 0 1-1.001.446l-2.887-2.592a.4.4 0 0 1 0-.595l2.887-2.593a.6.6 0 0 1 .4-.153ZM2.75 1.04a.75.75 0 0 1 .743.648l.007.102v12.476a.75.75 0 0 1-1.493.102L2 14.266V1.79a.75.75 0 0 1 .75-.75Zm2.343-.023.077.027 7.535 3.375a.5.5 0 0 1 .094.858l-.082.05L5.183 8.95a.5.5 0 0 1-.71-.368l-.007-.083V1.501a.5.5 0 0 1 .627-.484Z"></path></svg>`;
const INBOX_ICON = `<svg width="14" height="14" viewBox="0 0 16 16" fill="#858699" class="sc-hvKAgf hrphtG"><path d="M10.5914 1C11.9984 1 13.2164 1.97789 13.5205 3.35169L14.8819 9.50233C14.9604 9.85714 15 10.2195 15 10.5829V12.5181C15 13.8888 13.8888 15 12.5181 15H3.48193C2.1112 15 1 13.8888 1 12.5181V10.5829C1 10.2195 1.03962 9.85714 1.11815 9.50233L2.47949 3.35169C2.78356 1.97789 4.00156 1 5.4086 1H10.5914ZM10.5914 2.5H5.4086C4.70508 2.5 4.09608 2.98894 3.94405 3.67584L2.5827 9.82649L2.548 10.01L5.01028 10.0108C5.55851 10.0108 6.00293 10.4552 6.00293 11.0034C6.00293 11.5517 6.44735 11.9961 6.99557 11.9961H9.05948C9.6077 11.9961 10.0521 11.5517 10.0521 11.0034C10.0521 10.4552 10.4965 10.0108 11.0448 10.0108L13.4528 10.0102C13.4426 9.94867 13.4308 9.88742 13.4173 9.82649L12.056 3.67584C11.9039 2.98894 11.2949 2.5 10.5914 2.5Z"></path></svg>`;
const MY_ISSUES_ICON = `<svg width="14" height="14" viewBox="0 0 16 16" fill="#858699" class="sc-ekXops ggngB"><path d="M14.2458 10C14.6255 10 14.9393 10.2822 14.9889 10.6482L14.9958 10.75V12.2475C14.9958 13.7083 13.8567 14.9034 12.4177 14.9922L12.2504 14.9975L10.7513 15C10.3371 15.0007 10.0007 14.6655 10 14.2513C9.99936 13.8716 10.281 13.5573 10.647 13.507L10.7487 13.5L12.2479 13.4975C12.8943 13.4964 13.4255 13.0047 13.4893 12.3751L13.4958 12.2475V10.75C13.4958 10.3358 13.8316 10 14.2458 10ZM1.75 10C2.16421 10 2.5 10.3358 2.5 10.75V12.2475C2.5 12.937 3.05836 13.4963 3.74789 13.4975L5.24703 13.5C5.66125 13.5007 5.99646 13.8371 5.99576 14.2513C5.99506 14.6655 5.65871 15.0007 5.2445 15L3.74535 14.9975C2.22839 14.9949 1 13.7644 1 12.2475V10.75C1 10.3358 1.33579 10 1.75 10ZM8 6C9.10457 6 10 6.89543 10 8C10 9.10457 9.10457 10 8 10C6.89543 10 6 9.10457 6 8C6 6.89543 6.89543 6 8 6ZM10.7513 1L12.2504 1.00254C13.7674 1.0051 14.9958 2.23556 14.9958 3.75253V5.25C14.9958 5.66422 14.66 6 14.2458 6C13.8316 6 13.4958 5.66422 13.4958 5.25V3.75253C13.4958 3.063 12.9374 2.5037 12.2479 2.50253L10.7487 2.5C10.3345 2.4993 9.9993 2.16295 10 1.74873C10.0007 1.33452 10.3371 0.999302 10.7513 1ZM5.24873 1C5.66295 0.999303 5.9993 1.33452 6 1.74873C6.0007 2.16295 5.66548 2.4993 5.25127 2.5L3.75212 2.50253C3.06259 2.5037 2.50424 3.063 2.50424 3.75253V5.25C2.50424 5.66422 2.16845 6 1.75424 6C1.34002 6 1.00424 5.66422 1.00424 5.25V3.75253C1.00424 2.23556 2.23262 1.0051 3.74959 1.00254L5.24873 1Z"></path></svg>`;

const BACKLOG_ICON = `<svg width="14" height="14" viewBox="0 0 14 14" aria-label="Backlog" fill="#bec2c8" class="color-override sc-gDgOZg bLDfhd"><path d="M13.9408 7.91426L11.9576 7.65557C11.9855 7.4419 12 7.22314 12 7C12 6.77686 11.9855 6.5581 11.9576 6.34443L13.9408 6.08573C13.9799 6.38496 14 6.69013 14 7C14 7.30987 13.9799 7.61504 13.9408 7.91426ZM13.4688 4.32049C13.2328 3.7514 12.9239 3.22019 12.5538 2.73851L10.968 3.95716C11.2328 4.30185 11.4533 4.68119 11.6214 5.08659L13.4688 4.32049ZM11.2615 1.4462L10.0428 3.03204C9.69815 2.76716 9.31881 2.54673 8.91341 2.37862L9.67951 0.531163C10.2486 0.767153 10.7798 1.07605 11.2615 1.4462ZM7.91426 0.0591659L7.65557 2.04237C7.4419 2.01449 7.22314 2 7 2C6.77686 2 6.5581 2.01449 6.34443 2.04237L6.08574 0.059166C6.38496 0.0201343 6.69013 0 7 0C7.30987 0 7.61504 0.0201343 7.91426 0.0591659ZM4.32049 0.531164L5.08659 2.37862C4.68119 2.54673 4.30185 2.76716 3.95716 3.03204L2.73851 1.4462C3.22019 1.07605 3.7514 0.767153 4.32049 0.531164ZM1.4462 2.73851L3.03204 3.95716C2.76716 4.30185 2.54673 4.68119 2.37862 5.08659L0.531164 4.32049C0.767153 3.7514 1.07605 3.22019 1.4462 2.73851ZM0.0591659 6.08574C0.0201343 6.38496 0 6.69013 0 7C0 7.30987 0.0201343 7.61504 0.059166 7.91426L2.04237 7.65557C2.01449 7.4419 2 7.22314 2 7C2 6.77686 2.01449 6.5581 2.04237 6.34443L0.0591659 6.08574ZM0.531164 9.67951L2.37862 8.91341C2.54673 9.31881 2.76716 9.69815 3.03204 10.0428L1.4462 11.2615C1.07605 10.7798 0.767153 10.2486 0.531164 9.67951ZM2.73851 12.5538L3.95716 10.968C4.30185 11.2328 4.68119 11.4533 5.08659 11.6214L4.32049 13.4688C3.7514 13.2328 3.22019 12.9239 2.73851 12.5538ZM6.08574 13.9408L6.34443 11.9576C6.5581 11.9855 6.77686 12 7 12C7.22314 12 7.4419 11.9855 7.65557 11.9576L7.91427 13.9408C7.61504 13.9799 7.30987 14 7 14C6.69013 14 6.38496 13.9799 6.08574 13.9408ZM9.67951 13.4688L8.91341 11.6214C9.31881 11.4533 9.69815 11.2328 10.0428 10.968L11.2615 12.5538C10.7798 12.9239 10.2486 13.2328 9.67951 13.4688ZM12.5538 11.2615L10.968 10.0428C11.2328 9.69815 11.4533 9.31881 11.6214 8.91341L13.4688 9.67951C13.2328 10.2486 12.924 10.7798 12.5538 11.2615Z" stroke="none"></path></svg>`;
const DOING_ICON = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-label="In Progress" class="color-override sc-gDgOZg bLDfhd"><rect x="1" y="1" width="12" height="12" rx="6" stroke="#F2C94C" stroke-width="2" fill="none"></rect><path fill="#F2C94C" stroke="none" d="M 3.5,3.5 L3.5,0 A3.5,3.5 0 0,1 6.531088913245535, 1.749999999999999 z" transform="translate(3.5,3.5)"></path></svg>`;
const TODO_ICON = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-label="Todo" class="color-override sc-gDgOZg bLDfhd"><rect x="1" y="1" width="12" height="12" rx="6" stroke="#e2e2e2" stroke-width="2" fill="none"></rect><path fill="#e2e2e2" stroke="none" d="M 3.5,3.5 L3.5,0 A3.5,3.5 0 0,1 3.5, 0 z" transform="translate(3.5,3.5)"></path></svg>`;
const PENDING_ICON = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-label="In Progress" class="color-override sc-gDgOZg bLDfhd"><rect x="1" y="1" width="12" height="12" rx="6" stroke="#f2994a" stroke-width="2" fill="none"></rect><path fill="#f2994a" stroke="none" d="M 3.5,3.5 L3.5,0 A3.5,3.5 0 0,1 6.531088913245535, 5.249999999999998 z" transform="translate(3.5,3.5)"></path></svg>`;
const MERGED_ICON = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-label="In Progress" class="color-override sc-gDgOZg bLDfhd"><rect x="1" y="1" width="12" height="12" rx="6" stroke="#4cb782" stroke-width="2" fill="none"></rect><path fill="#4cb782" stroke="none" d="M 3.5,3.5 L3.5,0 A3.5,3.5 0 0,1 3.5, 7 z" transform="translate(3.5,3.5)"></path></svg>`;
const DONE_ICON = `<svg width="14" height="14" viewBox="0 0 14 14" aria-label="Done" fill="#5e6ad2" class="color-override sc-gDgOZg bLDfhd"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0ZM11.101 5.10104C11.433 4.76909 11.433 4.23091 11.101 3.89896C10.7691 3.56701 10.2309 3.56701 9.89896 3.89896L5.5 8.29792L4.10104 6.89896C3.7691 6.56701 3.2309 6.56701 2.89896 6.89896C2.56701 7.2309 2.56701 7.7691 2.89896 8.10104L4.89896 10.101C5.2309 10.433 5.7691 10.433 6.10104 10.101L11.101 5.10104Z"></path></svg>`;
const CANCELED_ICON = `<svg width="14" height="14" viewBox="0 0 14 14" aria-label="Canceled" fill="#95a2b3" class="color-override sc-gDgOZg bLDfhd"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14ZM5.03033 3.96967C4.73744 3.67678 4.26256 3.67678 3.96967 3.96967C3.67678 4.26256 3.67678 4.73744 3.96967 5.03033L5.93934 7L3.96967 8.96967C3.67678 9.26256 3.67678 9.73744 3.96967 10.0303C4.26256 10.3232 4.73744 10.3232 5.03033 10.0303L7 8.06066L8.96967 10.0303C9.26256 10.3232 9.73744 10.3232 10.0303 10.0303C10.3232 9.73744 10.3232 9.26256 10.0303 8.96967L8.06066 7L10.0303 5.03033C10.3232 4.73744 10.3232 4.26256 10.0303 3.96967C9.73744 3.67678 9.26256 3.67678 8.96967 3.96967L7 5.93934L5.03033 3.96967Z" stroke="none"></path></svg>`;

const statusToIconMap = {
	Backlog: BACKLOG_ICON,
	Doing: DOING_ICON,
	Todo: TODO_ICON,
	"Pending Review": PENDING_ICON,
	Merged: MERGED_ICON,
	Done: DONE_ICON,
	Canceled: CANCELED_ICON,
	Duplicate: CANCELED_ICON,
};

mrTitleObserver.observe(document, {
	childList: true,
	subtree: true,
});
