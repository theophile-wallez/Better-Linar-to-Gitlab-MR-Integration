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
	const uniqueIssuesIds = Array.from(new Set(issuesIds));
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

	issuesIds.forEach(async (issueId) => {
		const issueCard = await generateIssueCard(issueId);
		issuesCardsContainer.appendChild(issueCard);
	});

	issuesLinksBody.appendChild(issuesCardsContainer);

	issuesLinksContainer.appendChild(issuesLinksBody);
	descriptionDiv.prepend(issuesLinksContainer);
};

const generateIssueCard = async (issueId) => {
	const issueData = await getIssueData(issueId);
	if (!issueData) return;
	console.log("issueData: ", issueData);

	const issueCard = document.createElement("a");
	issueCard.href = issueData.url ?? getLinkToIssue(issueId);
	issueCard.target = "_blank";
	issueCard.className = "issue-card";
	const cardStyle = {
		textDecoration: "none",
		color: "var(--gray-600, #89888d)",
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
			.sort((a, b) => b.length - a.length)
			.forEach((label) => {
				const labelTag = generateLabel(label);
				issueCard.appendChild(labelTag);
			});
	}

	if (issueData.parent) {
		const isParent = true;
		const parentTag = generateFamilyTag(issueData.parent, isParent);
		issueCard.appendChild(parentTag);
	}

	if (issueData.children?.nodes?.length > 0) {
		const isParent = false;
		issueData.children.nodes.forEach((child) => {
			const childTag = generateFamilyTag(child, isParent);
			issueCard.appendChild(childTag);
		});
	}

	const hasblockIssues = issueData.relations?.nodes?.length > 0;
	if (hasblockIssues) {
		const isblocking = true;
		issueData.relations.nodes.forEach((relation) => {
			const relationTag = generateRelationTag(
				issueData,
				relation.relatedIssue,
				isblocking
			);
			issueCard.appendChild(relationTag);
		});
	}

	const hasBlockedByIssues = issueData.inverseRelations?.nodes?.length > 0;
	if (hasBlockedByIssues) {
		const isblocking = false;
		issueData.inverseRelations.nodes.forEach((relation) => {
			const relationTag = generateRelationTag(
				issueData,
				relation.issue,
				isblocking
			);
			issueCard.appendChild(relationTag);
		});
	}

	return issueCard;
};

const getSimpleTag = (text) => {
	const tag = document.createElement("div");
	tag.innerText = text;
	tag.className = "linear-tag";
	return tag;
};

const generateStatus = (status) => {
	const statusTag = document.createElement("div");
	statusTag.innerText = status.name;
	statusTag.className = "linear-tag";
	statusTag.style.outlineColor = status.color;

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

const generateFamilyTag = (family, isParent = true) => {
	const familyTag = document.createElement("a");
	familyTag.href = family.url;
	familyTag.target = "_blank";
	familyTag.innerText = `${isParent ? "👩‍👦" : "👶"}  ${family.identifier}`;

	familyTag.style.color = "inherit";
	familyTag.style.textDecoration = "none";
	familyTag.className = "linear-tag clickable-tag";

	return familyTag;
};

const generateRelationTag = (mainIssue, relatedIssue, isblocking = true) => {
	const isIssueDone = mainIssue.state.name === "Done";

	const relationTag = document.createElement("a");
	relationTag.href = relatedIssue.url;
	relationTag.target = "_blank";
	relationTag.style.color = "inherit";
	relationTag.style.textDecoration = "none";
	relationTag.className = "linear-tag clickable-tag";

	const action = isIssueDone ? "was" : "is";
	const relationType = isblocking ? "blocking" : "blocked by";

	const title = `${mainIssue.identifier} ${action} ${relationType} ${relatedIssue.identifier} - ${relatedIssue.title}`;
	relationTag.title = title;

	const relationIconContainer = document.createElement("div");
	relationIconContainer.style.display = "flex";
	relationIconContainer.style.alignItems = "center";
	relationIconContainer.style.justifyContent = "center";
	relationIconContainer.innerHTML = isblocking
		? BLOCKS_ICON
		: BLOCKED_BY_ICON;

	if (isIssueDone) {
		relationIconContainer.style.color = "#00aa5c";
	} else if (isblocking) {
		relationIconContainer.style.color = "#f55859";
	} else {
		relationIconContainer.style.color = "#d47718";
	}
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
      		}
    	}
    	parent {
      		identifier
			url
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

mrTitleObserver.observe(document, {
	childList: true,
	subtree: true,
});
