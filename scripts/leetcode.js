let problemStatement, problemTitle, problemDifficulties, questionNameFromUrl, solutionSumbitted, questionPastStatus
console.log("solutionSumbitted >>>", solutionSumbitted)
async function main() {
  const url = window.location.href
  console.log("URLLL ...", url)
  // https://leetcode.com/problems/check-completeness-of-a-binary-tree/description/
  questionNameFromUrl = url.split('/')[4]
  console.log("url.split('/')[4] >>>", questionNameFromUrl)
  if (questionNameFromUrl === 'all' || !questionNameFromUrl) {
    return
  } else if( url.split('/')[5] == '' || url.split('/')[5] == 'description' ) {
    while (!problemStatement || !problemTitle || !problemDifficulties) {
      problemStatement = await getProblemStatement()
      problemTitle = await getProblemTitle()
      problemDifficulties = await getProblemDifficultites()
    }
    questionPastStatus = document.querySelectorAll('div[class="rounded p-[3px] text-lg transition-colors duration-200 text-green-s dark:text-dark-green-s"] > svg')[0] ? true: false
    document.getElementsByClassName("mt-3 flex space-x-4")[0].innerHTML += "<span style='color:green;'>Question details fetch successfully</span>"
    const questionDetails = {
      problemStatement,
      problemTitle,
      problemDifficulties,
      questionPastStatus
    }
    chrome.storage.local.set({ questionNameFromUrl: questionDetails }, () => {
      console.log(`questionNameFromUrl is set to ${JSON.stringify(questionDetails)}`)
    })
  }
}

const languages = {
  Python: '.py',
  Python3: '.py',
  'C++': '.cpp',
  C: '.c',
  Java: '.java',
  'Java (1.8)': '.java',
  'C#': '.cs',
  JavaScript: '.js',
  Javascript: '.js',
  Ruby: '.rb',
  Swift: '.swift',
  Go: '.go',
  Kotlin: '.kt',
  Scala: '.scala',
  Rust: '.rs',
  PHP: '.php',
  TypeScript: '.ts',
  MySQL: '.sql',
  'MS SQL Server': '.sql',
  Oracle: '.sql',
};

const toKebabCase = (string) => {
  return string
    .replace(/[^a-zA-Z0-9\. ]/g, '') // remove special chars
    .replace(/([a-z])([A-Z])/g, '$1-$2') // get all lowercase letters that are near to uppercase ones
    .replace(/[\s_]+/g, '-') // replace all spaces and low dash
    .toLowerCase(); // convert to lower case
};


async function findLanguage() {
  const tag = document.querySelectorAll('div[class="mb-4"] > span[class="inline-flex items-center whitespace-nowrap text-xs rounded-full bg-blue-0 dark:bg-dark-blue-0 text-blue-s dark:text-dark-blue-s px-3 py-1 font-medium leading-4"]')[0]
  console.log("TAG <<<>>>", tag)
  if (tag) {
    const tagText = tag.innerText
    return languages[tagText]
  }
  return "";
}

async function getProblemStatement() {
  const problemStatementDiv = document.querySelectorAll('div[class="_1l1MA"]')[0]
  if (problemStatementDiv) {
    return problemStatementDiv.innerHTML
  }
  return ""
}

async function getProblemTitle() {
  const poblemTitleDiv = document.querySelectorAll('div[class="h-full"] > span[class="mr-2 text-lg font-medium text-label-1 dark:text-dark-label-1"]')[0]
  if (poblemTitleDiv) {
    return poblemTitleDiv.innerHTML
  }
  return ""
}

async function getProblemDifficultites() {
  const problemDifficultyDiv = document.querySelectorAll('div[class="mt-3 flex space-x-4"] > div')[0]
  if (problemDifficultyDiv) {
    return problemDifficultyDiv.innerHTML
  }
  return ""
}

async function getCode() {
  const codeElement = document.querySelectorAll('code');
  let codeText = '';

  codeElement.forEach((item) => {
    codeText += item.textContent;
  });

  return codeText
}

const checkPageLoaded = setInterval(() => {
  if (document.readyState == "complete") {
    clearInterval(checkPageLoaded)
    main()
  }
}, 2500)

async function pushCodeToGithub(token, difficulty, content, owner, reponame, filePath, commitMessage, committer, commitType, commitAction) {
  try {
    const url = `https://api.github.com/repos/${owner}/${reponame}/contents/${filePath}`
    let data = {
      message: commitMessage,
      content: btoa(unescape(encodeURIComponent(content))),
      committer,
    };

    // if(questionPastStatus) {
    //   data['sha'] = ''
    // }

    console.log("data ???", data)
    console.log("url ???", url)

    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 201) {
          console.log("JSON.parse(xhr.responseText) ??? COMMIT CODE ", JSON.parse(xhr.responseText))
          const updatedSha = JSON.parse(xhr.responseText).content.sha;

          chrome.storage.local.get(['userStatistics'], (res) => {
            let { userStatistics } = res;
            console.log("userStatistics >>>", userStatistics)
            if (userStatistics === null || userStatistics === {} || userStatistics === undefined) {
              // create userStatistics object
              userStatistics = {};
              userStatistics.total = 0;
              userStatistics.easy = 0;
              userStatistics.medium = 0;
              userStatistics.hard = 0;
              userStatistics.sha = {}
            }
            // Only increment solved problems statistics once
            // New submission commits twice (README and problem)
            if (commitType === 'code' && commitAction === 'new') {
              console.log("HERER >>>> 1312")
              userStatistics.total += 1;
              userStatistics.easy += difficulty === 'Easy' ? 1 : 0;
              userStatistics.medium += difficulty === 'Medium' ? 1 : 0;
              userStatistics.hard += difficulty === 'Hard' ? 1 : 0;
            }
            userStatistics.sha[filePath] = updatedSha; // update sha key.
            chrome.storage.local.set({ userStatistics }, () => {
              console.log(`Successfully committed ${filePath} to github`, userStatistics);
            });
          });
        }
      }
    });

    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    await xhr.send(JSON.stringify(data));
  } catch (error) {
    console.log(error)
  }
}

async function pushCode(code, difficulty, problemName, problemStatement, language, platform, questionPastStatus) {
  /* Get necessary payload data */
  chrome.storage.local.get(['githubToken', 'githubRepoLinked', 'githubUserAuthenticated', 'linkRepoName', 'githubUserName', 'githubUserEmail', 'sha'], async (userData) => {
    const token = userData.githubToken;
    const isAuthenticated = userData.githubUserAuthenticated
    const isRepoLinked = userData.githubRepoLinked
    const repoName = userData.linkRepoName
    const username = userData.githubUserName
    const email = userData.githubUserEmail
    const allSha = userData.sha || {}

    console.log("isAuthenticated >>>", isAuthenticated)
    console.log("isRepoLinked >>>", isRepoLinked)
    console.log("token >>>", token)
    console.log("repoName >>>", repoName)
    console.log("username >>>", username)
    // isAuthenticated && isRepoLinked && token
    if (true) {
      const owner = username
      const repoame = repoName
      const codeFilePath = `${platform}/${toKebabCase(problemName)}/solution${language}`
      const readmeFilePath = `${platform}/${toKebabCase(problemName)}/README.md`
      const readmeCommitMessage = "Create README - CodeHub"
      const codeCommitMessage = "Added solution - CodeHub"
      const committer = {
        name: username,
        email: email
      }
      const content = code

      const readmeContent = `# ${problemName}\n## ${difficulty}\n${problemStatement}`;

      console.log({
        token,
        email,
        problemStatement,
        owner,
        repoame,
        readmeFilePath,
        codeFilePath,
        readmeCommitMessage,
        codeCommitMessage,
        committer,
        readmeContent
      })
      // if ( stats !== undefined && stats.sha !== undefined && stats.sha[filePath] !== undefined ) {
      //   sha = stats.sha[filePath];
      // }

      // API call to push code
      if (problemStatement) {
        await pushCodeToGithub(token, difficulty, readmeContent, owner, repoName, readmeFilePath, readmeCommitMessage, committer, 'readme', 'new')
      }

      await delay(10000);

      if (code) {
        await pushCodeToGithub(token, difficulty, content, owner, repoName, codeFilePath, codeCommitMessage, committer, 'code', 'new')
      }

      solutionSumbitted = true
      chrome.storage.local.remove(['questionNameFromUrl'], function (Items) {
        console.log("Question details removed")
      })
      document.querySelectorAll('div[class="mr-2 flex flex-1 flex-nowrap items-center space-x-4"]')[0].innerHTML +=
        `<h3 id='successTagCode' style='color: green; display:flex;'><span><svg xmlns='http://www.w3.org/2000/svg' viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" class="h-5 w-5"><path fill-rule="evenodd" d="M20 12.005v-.828a1 1 0 112 0v.829a10 10 0 11-5.93-9.14 1 1 0 01-.814 1.826A8 8 0 1020 12.005zM8.593 10.852a1 1 0 011.414 0L12 12.844l8.293-8.3a1 1 0 011.415 1.413l-9 9.009a1 1 0 01-1.415 0l-2.7-2.7a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg></span> Your code is successfully pushed to GitHub</h3>`
    }
  });
}

const delay = ms => new Promise(res => setTimeout(res, ms));

let START_MONITOR = true
const leetcodeLoader = setInterval(async () => {
  let questionStatus
  if (solutionSumbitted) {
    clearInterval(leetcodeLoader)
  }
  if (
    window.location.href.includes('leetcode.com/problems')
  ) {
    const submitBtn = document.querySelector("button[class='px-3 py-1.5 font-medium items-center whitespace-nowrap transition-all focus:outline-none inline-flex text-label-r bg-green-s dark:bg-dark-green-s hover:bg-green-3 dark:hover:bg-dark-green-3 rounded-lg']")
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const submission = setInterval(async () => {
          const questionStatusDiv = document.querySelector('div[class="text-green-s dark:text-dark-green-s flex items-center gap-2 text-[16px] font-medium leading-6"] > span')
          if (solutionSumbitted) {
            clearInterval(leetcodeLoader);
            clearInterval(submission);
          }
          if (questionStatusDiv) {
            questionStatus = questionStatusDiv.innerText
            if (questionStatus === 'Accepted' && START_MONITOR) {
              console.log("HERE INSIDE THE SUCCESS TAG", questionStatus)

              START_MONITOR = false;
              clearInterval(leetcodeLoader);
              clearInterval(submission);
              const code = await getCode()
              const languageUsed = await findLanguage()

              console.log("language >>>", languageUsed)
              console.log("CODE >>>", code)

              chrome.storage.local.get(['questionNameFromUrl'], async (res) => {
                const { questionNameFromUrl: { problemDifficulties = '', problemTitle = '', problemStatement = '' } } = res
                await pushCode(code, problemDifficulties, problemTitle, problemStatement, languageUsed, 'leetcode')
              })
            }
          } else {
            console.log("HERE INSIDE the failTag")
            // clearInterval(submission);
          }
        }, 1000)
      })
    }
  }
}, 1000)