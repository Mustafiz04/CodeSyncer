const githubUserame = document.getElementById('githubUsername')
const githubName = document.getElementById('githubName')
const githubOauthInitBtn = document.getElementById('githubOauthInit')
const easyCountSpan = document.getElementById('easyCount')
const mediumCountSpan = document.getElementById('mediumCount')
const hardCountSpan = document.getElementById('hardCount')
const totalCountSpan = document.getElementById('totalCount')
const countTabDiv = document.getElementById('countTab')
const unlinkRepoName = document.getElementById('unlinkRepoName')
const openDashboardBtn = document.getElementById('openDashboardBtn')
const githubRepoLinkA = document.getElementById('githubRepoLink')


chrome.storage.local.get(['githubUserName', 'githubName', 'githubToken', 'githubUserEmail', 'likedRepoFullname'], (res) => {
  console.log("res.githubToken >>>", res.githubToken)
  console.log("res.githubUserName >>>", res.githubUserName)
  console.log("res.githubName >>>", res.githubName)
  console.log("res.githubUserEmail >>>", res.githubUserEmail)
  if(res.likedRepoFullname) {
    unlinkRepoName.innerText = res.likedRepoFullname || ""
    unlinkRepoName.style.color = 'blue'
    githubRepoLinkA.href = "https://github.com/" + res.likedRepoFullname
  }

  if (res.githubToken) {
    githubOauthInitBtn.style.display = 'none'
  } else {
    githubRepoLinkA.style.display = 'none'
    countTabDiv.style.display = 'none'
    openDashboardBtn.style.display = 'none'
  }
})

chrome.storage.local.get(['userStatistics'], (res) => {
  const { userStatistics: {
    easy: easyQuestionSolved = 0,
    medium: mediumQuestionSolved = 0,
    hard: hardQuestionSolved = 0,
    total: totalQuestionSolved = 0
  } = {} } = res
  easyCountSpan.innerText = easyQuestionSolved || 0
  mediumCountSpan.innerText = mediumQuestionSolved || 0
  hardCountSpan.innerText = hardQuestionSolved || 0

  totalCountSpan.innerText = totalQuestionSolved || 0
})

githubOauthInitBtn.addEventListener('click', async () => {
  githubAuthorizePage()
})

openDashboardBtn.addEventListener('click', async () => {
  const dashboardPage = chrome.runtime.getURL('dashboard.html');
  chrome.tabs.create({ url: dashboardPage, active: true });
})

function githubAuthorizePage() {
  const url = `https://github.com/login/oauth/authorize?client_id=ac58a3ad6a629746c03e&redirect_uri=https://github.com/&scope=repo,read:user,user:email`
  chrome.storage.local.set({ pipe_codehub: true }, () => {
    chrome.tabs.create({ url, active: true }, function () {
      window.close();
      chrome.tabs.getCurrent(function (tab) {
        chrome.tabs.remove(tab.id, function () { });
      });
    });
  });
}