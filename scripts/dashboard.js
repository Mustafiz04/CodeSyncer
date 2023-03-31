// const githubUserame = document.getElementById('githubUsername')
const githubName = document.getElementById('githubName')
const linkRepoBtn = document.getElementById('linkRepoBtn')
const repoNameInput = document.getElementById('repoName')
const unlinkRepoName = document.getElementById('unlinkRepoName')
const unlinkButton = document.getElementById('unlink')
const linkingDiv = document.getElementById('linking')
// var x = document.querySelector('input[name="colors"]:checked').value;
const statsDiv = document.getElementById('stats')
const easyCountSpan = document.getElementById('easyCount')
const mediumCountSpan = document.getElementById('mediumCount')
const githubRepoLinkA = document.getElementById('githubRepoLink')
const hardCountSpan = document.getElementById('hardCount')
let githubOwner, token

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function () {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }
  });
}

chrome.storage.local.get(
  ['githubUserName', 'githubName', 'githubToken', 'linkRepoName', 'likedRepoFullname', 'userStatistics'],
  (res) => {
    console.log("res.likedRepoFullname >>", res.linkRepoName)
    // githubUserame.innerHTML = res.githubUserName
    githubName.innerHTML = res.githubName
    unlinkRepoName.innerText = res.likedRepoFullname || ""
    githubOwner = res.githubUserName
    token = res.githubToken
    githubRepoLinkA.href = "https://github.com/" + res.likedRepoFullname

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

    if (res.linkRepoName) {
      linkingDiv.style.display = 'none'
    } else {
      unlinkButton.style.display = 'none'
    }
  })


linkRepoBtn.addEventListener('click', async () => {
  const linkRepoType = document.querySelector('input[name="linkRepo"]:checked').value;
  const reponame = repoNameInput.value
  console.log("repoNameInputValue >>>", reponame, linkRepoType)
  if (linkRepoType == 'existing') {
    await linkRepo(reponame)
  } else {
    await createNewPrivateRepo(reponame)
  }
})

unlinkButton.addEventListener('click', async () => {
  chrome.storage.local.remove(['likedRepoFullname', 'linkRepoName'], function (Items) {
    console.log("Removed")
    linkingDiv.style.display = 'block'
    unlinkButton.style.display = 'none'
    githubRepoLinkA.style.display = 'none'

  })
})

function handleResponse(res) {
  try {

    chrome.storage.local.set({ "githubRepoLinked": true }, () => {
      console.log("GITHUB USER's REPO LINKED SUCCESSFULLY...")
    })

    const repoName = res.name
    const fullName = res.full_name
    if (repoName) {
      linkingDiv.style.display = 'none'
      unlinkButton.style.display = 'inline'
      githubRepoLinkA.style.display = 'inline'
      unlinkRepoName.innerText = fullName || ""
      githubRepoLinkA.href = "https://github.com/" + repoName
    } else {
      unlinkButton.style.display = 'none'
    }
    chrome.storage.local.set({ 'linkRepoName': repoName, 'likedRepoFullname': fullName }, () => {
      console.log(`${repoName} is linked`)
      console.log(`${fullName} is linked`)
    })
    // chrome.storage.local.set({ 'likedRepoFullname': fullName }, () => {
    //   console.log(`${fullName} is linked`)
    // })

    chrome.storage.local.get(['userStatistics'], (previousSolved) => {
      const { userStatistics: {
        easy: easyQuestionSolved = 0,
        mediium: mediumQuestionSolved = 0,
        hard: hardQuestionSolved = 0,
        total: totalQuestionSolved = 0
      } = {} } = previousSolved
      // easyCountSpan.innerText = easyQuestionSolved || 0
      // mediumCountSpan.innerText = mediumQuestionSolved || 0
      // hardCountSpan.innerText = hardQuestionSolved || 0

      // totalCountSpan.innerText = totalQuestionSolved || 0
    })
  } catch (error) {
    throw error
  }
}

async function linkRepo(reponame) {
  try {
    const url = `https://api.github.com/repos/${githubOwner}/${reponame}`
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          console.log("JSON.parse(xhr.responseText) Success ???", JSON.parse(xhr.responseText))
          const res = JSON.parse(xhr.responseText)
          handleResponse(res)
          // chrome.runtime.sendMessage({repoName, fullName})
        } else if (xhr.status === 404) {
          console.log("JSON.parse(xhr.responseText) failed ???", JSON.parse(xhr.responseText))
        }
      }
    });
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send();
  } catch (error) {
    console.log(error)
  }
}

async function createNewPrivateRepo(repoName) {
  try {
    const url = "https://api.github.com/user/repos"
    const data = {
      name: repoName,
      private: true,
      auto_init: true,
      description: 'Private Repository create by CodeSyncer Extenstion',
    }
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 201) {
          console.log("JSON.parse(xhr.responseText) Success ???", JSON.parse(xhr.responseText))
          const res = JSON.parse(xhr.responseText)
          handleResponse(res)
        } else if (xhr.status === 404) {
          console.log("JSON.parse(xhr.responseText) failed ???", JSON.parse(xhr.responseText))
        }
      }
    });
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    xhr.send(JSON.stringify(data));
  } catch (error) {
    console.log(error)
  }
}