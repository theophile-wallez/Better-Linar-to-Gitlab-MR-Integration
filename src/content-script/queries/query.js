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
