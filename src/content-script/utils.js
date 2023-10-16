const pluralize = (word, array) => {
	return `${word}${array?.length > 1 ? "s" : ""}`;
};

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
