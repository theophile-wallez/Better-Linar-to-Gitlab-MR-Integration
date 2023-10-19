# Better Linar to Gitlab MR Integration
## 🎯 Goal of this extension

This extension helps you swiftly visualize key informations about Linear issues related to your merge requests.

<img width="830" alt="image" src="https://github.com/theophile-wallez/Better-Linar-to-Gitlab-MR-Integration/assets/66305625/6e866bbd-a5f2-4dcf-8150-9b1095e53f9a">


### 📃 What infos are displayed?

Depending on your issue, those infos are displayed:
- Status
- Labels
- Parent issue
- Sub-issues *(as an hoverable list of links)*
- Issue that is/was blocking the current issue
- Issues that are/were blocked by the current issue *(as an hoverable list of links)*

## 💻 Install Locally

1. Download the latest release `.zip` file and un-zip it.
3. Open chrome and navigate to extensions page using this URL: chrome://extensions.
4. Enable the "Developer mode".
5. Click "Load unpacked extension" button and select the unzipped extension's folder.

## 🔑 Linear API key

Your Linear API key is used to fetch data related to the issues found the merge request's title on the [Linear GraphQL API](https://studio.apollographql.com/public/Linear-API/variant/current/explorer). 

### Where can I find it?

Generate your Linear API key here: [Settings > My Account > API > Personal API keys](https://linear.app/settings/api)

<img width="665" alt="image" src="https://github.com/theophile-wallez/Better-Linar-to-Gitlab-MR-Integration/assets/66305625/5eada9da-4c2b-4353-a2f9-be4f3fd79c75"/>  
<br />
<br />

> This extension does not currently work without it, some features should in the `v0.0.5` version.

## 🙋‍♀️ How does it work?
### Getting the issues IDs

The Linear issues IDs are retrieved by searching in the MR title for anything that matches this: 
```js
const issuePattern = /[A-Za-z]+-\d+/g; // or <anything>-<anything>
```

The issues IDs are then replaced by Linear links in the MR title.

### Displaying issues' informations

For each found IDs, a `POST` request is sent to the [Linear GraphQL API](https://studio.apollographql.com/public/Linear-API/variant/current/explorer) using your API key.

## 🔒 Confidentiality

- Your Linear API key is stored in your browser local storage.
- No data is collected


