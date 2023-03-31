chrome.storage.local.get(['linkRepoName', 'likedRepoFullname'], (res) => {
  console.log("linkRepoName >>>>", res.linkRepoName)
  console.log("likedRepoFullname >>>>", res.likedRepoFullname)
})


function handleMessage({ userProfile }) {
  const username = userProfile.login
  const name = userProfile.name
  const email = userProfile.email
  setUsername(username)
  setName(name)
  setEmail(email)

  chrome.tabs.create({ url: chrome.runtime.getURL('../dashboard.html'), active: true });
}

function setUsername(username) {
  chrome.storage.local.set({ 'githubUserName': username }, () => {
    console.log("USERNAME SET to ", username)
  })
}

function setName(name) {
  chrome.storage.local.set({ 'githubName': name }, () => {
    console.log("Name SET to ", name)
  })
}

function setEmail(email) {
  chrome.storage.local.set({ "githubUserEmail": email }, () => {
    console.log("GITHUB USER's EMAIL IS SET")
  })
}

chrome.runtime.onMessage.addListener(handleMessage);

chrome.storage.local.get(
  ['githubUserName', 'githubName', 'githubRepoLinked', 'githubToken'], (userData) => {
    const { githubRepoLinked, githubToken } = userData
    if (githubToken && githubRepoLinked) {
      console.log("CODEHUB IS ALREADY SYNCED....")
    }
  }
)

function getCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
    console.log("tab ????", tab)
    chrome.storage.local.set({ "currentTab": tab.id }, () => {
      console.log("CURRENT TAB ID IS SET", tab)
    })
  });
};

getCurrentTab()

// chrome.tabs.query({ active: true }, function(tabs) {  
//   chrome.tabs.remove(tabs[0].id, () => {
//     alert("TAB IS CLOSED")
//   });   
// }); 