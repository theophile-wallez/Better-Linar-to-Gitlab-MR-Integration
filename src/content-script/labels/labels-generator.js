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
