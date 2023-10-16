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
			try {
				issuesCardsContainer.appendChild(issueCard);
			} catch (error) {}
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
			.filter(
				(label) =>
					!label.name.includes("API") || !label.name.includes("UI")
			)
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

getIssueData = async (issueId) => {
	const issueQuery = issueQueryBuilder(issueId);
	const rawData = await fetchLinearAPI(issueQuery);
	return rawData?.data?.issue;
};

const getLinkToIssue = (issueId) => `https://linear.app/issue/${issueId}`;
