const handleTitle = (titleDiv) => {
	const uniqueIssuesIds = Array.from(new Set(issuesIds)).sort(
		(a, b) => a - b
	);
	if (uniqueIssuesIds.length <= 0) return;
	addIssuesLinksToTitle(uniqueIssuesIds);
	addIssuesLinksToDescription(uniqueIssuesIds);
	let titleText = !TEST_MODE ? titleDiv.innerHTML : testTitle;
	const issuesIds = findIssuesIds(titleText);
};

const findIssuesIds = (title) => {
	if (!title) return [];
	return title.match(ISSUE_NAME_REGEX) ?? [];
};

const addIssuesLinksToTitle = (issuesIds) => {
	const titleDiv = document.querySelector(TITLE_SELECTOR);
	if (!titleDiv) return;

	let titleText = !TEST_MODE ? titleDiv.innerHTML : testTitle;

	titleText = titleText.replace(ISSUE_NAME_REGEX, (match) => {
		return `<a href="${getLinkToIssue(
			match
		)}" target="_blank">${match}</a>`;
	});

	titleDiv.innerHTML = titleText;
};

const addIssuesLinksToDescription = async (issuesIds) => {
	const descriptionDivs = document.getElementsByClassName(
		"issuable-discussion"
	);

	if (!descriptionDivs) return;
	const descriptionDiv = descriptionDivs[0];

	const issuesLinksContainer = document.createElement("div");
	issuesLinksContainer.className =
		"mr-section-container issues-links-container";

	const issuesLinksBody = document.createElement("div");
	issuesLinksBody.className = "mr-widget-body";

	const titleRow = document.createElement("div");
	titleRow.className = "title-row";

	const linearIconContainer = document.createElement("div");
	linearIconContainer.style.color = "#6A79ED";
	linearIconContainer.style.display = "flex";
	linearIconContainer.style.alignItems = "center";
	linearIconContainer.style.justifyContent = "center";
	linearIconContainer.innerHTML = LINEAR_ICON;
	titleRow.appendChild(linearIconContainer);

	const relatedIssuesText = document.createElement("div");
	relatedIssuesText.innerText = pluralize("Related Linear issue", issuesIds);
	relatedIssuesText.className = "main-title gl-font-weight-bold";
	titleRow.appendChild(relatedIssuesText);

	const myInboxLink = document.createElement("a");
	myInboxLink.className =
		"linear-quick-link badge gl-bg-transparent! gl-inset-border-1-gray-100! gl-mr-3 badge-muted badge-pill gl-badge md";
	myInboxLink.href = "https://linear.app/inbox";
	myInboxLink.target = "_blank";

	const myInboxText = document.createElement("div");
	myInboxText.innerText = "Inbox";

	myInboxLink.innerHTML = INBOX_ICON;

	myInboxLink.appendChild(myInboxText);
	titleRow.appendChild(myInboxLink);

	const myIssuesLink = document.createElement("a");
	myIssuesLink.className =
		"linear-quick-link badge gl-bg-transparent! gl-inset-border-1-gray-100! gl-mr-3 badge-muted badge-pill gl-badge md";
	myIssuesLink.href = "https://linear.app/my-issues/assigned";
	myIssuesLink.target = "_blank";

	myIssueText = document.createElement("div");
	myIssueText.innerText = "My issues";

	myIssuesLink.innerHTML = MY_ISSUES_ICON;

	myIssuesLink.appendChild(myIssueText);
	titleRow.appendChild(myIssuesLink);

	issuesLinksBody.appendChild(titleRow);

	const issuesCardsContainer = document.createElement("div");
	issuesCardsContainer.className = "issues-cards-container";

	const issueCards = await Promise.all(
		issuesIds.map(
			async (issueId, index) => await generateIssueCard(issueId, index)
		)
	);

	issueCards.forEach((issueCard) => {
		try {
			issuesCardsContainer.appendChild(issueCard);
		} catch (error) {}
	});

	issuesLinksBody.appendChild(issuesCardsContainer);

	issuesLinksContainer.appendChild(issuesLinksBody);
	descriptionDiv.prepend(issuesLinksContainer);
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
