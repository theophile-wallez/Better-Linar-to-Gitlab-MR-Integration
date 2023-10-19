# Better Linar to Gitlab MR Integration
## 🎯 Goal of this extension

This extension helps you swiftly visualize key informations about Linear issues related to your merge requests.

<img width="830" alt="SCR-20231019-2rt" src="https://github.com/theophile-wallez/Better-Linar-to-Gitlab-MR-Integration/assets/66305625/e36721c0-bd9f-41ec-b5e2-f657941628bb">


### 📃 What infos are displayed?

Depending on the issue, those infos can be displayed:
- ⚡️ Status
- 🏷️ Labels
- 👩‍👦 Parent issue
- 👶 Sub-issues *(as an hoverable list of links)*
- 🚩 Issue that is/was blocking the current issue
- ✋ Issues that are/were blocked by the current issue *(as an hoverable list of links)*
- ~~📋 Project~~
- ~~⌛️ Cycle~~
- ~~🔸 Milestones~~

## 💻 Install Locally

1. Download the latest release `.zip` file and un-zip it.
3. Open chrome and navigate to extensions page using this URL: chrome://extensions.
4. Enable the "Developer mode".
5. Click "Load unpacked extension" button and select the unzipped extension's folder.

## 🔑 Linear API key

Your Linear API key is used to fetch data related to the issues found in the merge request's title using the [Linear GraphQL API](https://studio.apollographql.com/public/Linear-API/variant/current/explorer). 

### Where can I find it?

Generate your Linear API key here: [Settings > My Account > API > Personal API keys](https://linear.app/settings/api)

> This extension does **not** currently work without it, some features should in the `v0.0.5` version.

## 🙋‍♀️ How does it work?

The Linear issues IDs are retrieved by searching in the MR's title for anything that matches this: 
```js
const issuePattern = /[A-Za-z]+-\d+/g; // or <anything>-<anything>
```

The issues IDs are then replaced by Linear links in the MR's title.

For each found ID, a `POST` request is sent to the [Linear GraphQL API](https://studio.apollographql.com/public/Linear-API/variant/current/explorer) using your API key.

## 🔒 Confidentiality

- Your Linear API key is **exclusively** stored in your browser local storage and is **only** used to fetch issue's data
- No data is collected


