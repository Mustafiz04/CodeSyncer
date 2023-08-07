let problemStatement, problemTitle, problemDifficulties, questionNameFromUrl, solutionSumbitted, questionPastStatus
const timeoutPromise = (timeout) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout));

console.log("solutionSumbitted >>>", solutionSumbitted)
async function main() {
  const url = window.location.href
  console.log("URLLL ...", url)
  // https://leetcode.com/problems/check-completeness-of-a-binary-tree/description/
  questionNameFromUrl = url.split('/')[4]
  console.log("url.split('/')[4] >>>", questionNameFromUrl)
  if (url.split('/')[3] == 'problems' && (url.split('/')[5] == '' || url.split('/')[5] == 'description')) {
    await runLoopWithTimeout();
    questionPastStatus = document.querySelectorAll('div[class="rounded p-[3px] text-lg transition-colors duration-200 text-green-s dark:text-dark-green-s"] > svg')[0] ? true : false
    const questionDetails = {
      problemStatement,
      problemTitle,
      problemDifficulties,
      questionPastStatus
    }
    chrome.storage.local.set({ questionNameFromUrl: questionDetails }, () => {
      console.log(`questionNameFromUrl is set to ${JSON.stringify(questionDetails)}`)
    })
  } else {
    return
  }
}

async function runLoopWithTimeout() {
  try {
    await Promise.race([
      (async () => { problemStatement = await getProblemStatement(); })(),
      (async () => { problemTitle = await getProblemTitle(); })(),
      (async () => { problemDifficulties = await getProblemDifficultites(); })(),
      timeoutPromise(30000)
    ]);

    if (!problemStatement || !problemTitle || !problemDifficulties) {
      throw new Error('Loop did not complete successfully within 30 seconds.');
    }
    document.getElementsByClassName("mt-3 flex space-x-4")[0].innerHTML += "<span style='color:green;'>Successfully retrieved the question's details</span>"
  } catch (error) {
    document.getElementsByClassName("mt-3 flex space-x-4")[0].innerHTML += "<span style='color:red;'>Error fetching the question details. Please refesh or skip</span>"
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
  const tag = document.getElementsByClassName("inline-flex items-center whitespace-nowrap text-xs rounded-full bg-blue-0 dark:bg-dark-blue-0")
  console.log("TAG <<<>>>", tag)
  if (tag) {
    const tagText = tag[0].innerText
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
  const poblemTitleDiv = document.querySelectorAll('div[class="flex h-full items-center"] > a[class="mr-2 text-label-1 dark:text-dark-label-1 hover:text-label-1 dark:hover:text-dark-label-1 text-lg font-medium"]')[0]
  if (poblemTitleDiv) {
    return poblemTitleDiv.innerHTML
  }
  return ""
}

async function getProblemDifficultites() {
  const problemDifficultyDiv = document.querySelectorAll('div[class="mt-3 flex items-center space-x-4"] > div')[0]
  if (problemDifficultyDiv) {
    return problemDifficultyDiv.innerHTML
  }
  return ""
}

async function getCode() {
  try {
    const divElement = document.getElementsByClassName("group flex h-[40px] cursor-pointer items-center");
    console.log("divElement >>>", divElement[0]);

    // Simulate a click event on the div element
    divElement[0].click();

    // Wait for a short delay using a Promise
    await new Promise(resolve => setTimeout(resolve, 1000)); // Adjust the delay as needed

    // Get a reference to the pre element
    const preElement = document.querySelector('pre');

    // Check if the pre element exists and is visible
    if (preElement && window.getComputedStyle(preElement).display !== 'none') {
      // Extract the data from the pre element
      const extractedData = preElement.innerText;

      // You can do whatever you want with the extracted data here
      return extractedData;
    } else {
      console.log("Pre element is not visible");
      return null;
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return null;
  }
}

const checkPageLoaded = setInterval(() => {
  if (document.readyState == "complete") {
    clearInterval(checkPageLoaded)
    main()
  }
}, 2500)

async function pushCodeToGithub(token, difficulty, content, owner, reponame, filePath, commitMessage, committer, commitType, commitAction, sha) {
  try {
    if (commitType == 'readme' && sha) {
      return
    }
    const url = `https://api.github.com/repos/${owner}/${reponame}/contents/${filePath}`
    let data = {
      message: commitMessage,
      content: btoa(unescape(encodeURIComponent(content))),
      committer,
    };

    if (sha && commitAction == 'update') {
      data['sha'] = sha
    }

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
    console.log("push error", error)
  }
}

async function pushCode(code, difficulty, problemName, problemStatement, language, platform) {
  /* Get necessary payload data */
  chrome.storage.local.get(['githubToken', 'githubRepoLinked', 'githubUserAuthenticated', 'linkRepoName', 'githubUserName', 'githubUserEmail', 'userStatistics'], async (userData) => {
    let readmeSha = '', codeSha = '';
    const token = userData.githubToken;
    const isAuthenticated = userData.githubUserAuthenticated
    const isRepoLinked = userData.githubRepoLinked
    const repoName = userData.linkRepoName
    const username = userData.githubUserName
    const email = userData.githubUserEmail
    let { userStatistics } = userData;
    console.log("userStatistics >>> inside there ///", userStatistics)

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
      const readmeCommitMessage = "Create README - CodeSyncer"
      const codeCommitMessage = "Added solution - CodeSyncer"
      const committer = {
        name: username,
        email: email
      }
      const content = code

      const readmeContent = `# ${problemName}\n## ${difficulty}\n${problemStatement}`;

      if (userStatistics) {
        console.log("userStatistics.sha[filePath] >>>", userStatistics.sha[readmeFilePath])
        console.log("userStatistics.sha[filePath] >>>", userStatistics.sha[codeFilePath])
        readmeSha = userStatistics.sha[readmeFilePath]
        codeSha = userStatistics.sha[codeFilePath]
        console.log("readmeSha", readmeSha)
        console.log("codeSha", codeSha)
      }

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

      // API call to push code
      if (problemStatement && !readmeSha) {
        const commitAction = 'new'
        await pushCodeToGithub(token, difficulty, readmeContent, owner, repoName, readmeFilePath, readmeCommitMessage, committer, 'readme', commitAction, readmeSha)
      }

      await delay(5000);

      if (code) {
        let commitAction = 'new'
        if (codeSha) {
          commitAction = 'update'
        }
        await pushCodeToGithub(token, difficulty, content, owner, repoName, codeFilePath, codeCommitMessage, committer, 'code', commitAction, codeSha)
      }

      solutionSumbitted = true
      // chrome.storage.local.remove(['questionNameFromUrl'], function (Items) {
      //   console.log("Question details removed")
      // })
      document.querySelectorAll('div[class="flex flex-1 flex-nowrap items-center gap-4"]')[0].innerHTML +=
        `<h3 id='successTagCode' style='color: green; display:flex; flexGap'><span><svg xmlns='http://www.w3.org/2000/svg' viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" class="h-5 w-5"><path fill-rule="evenodd" d="M20 12.005v-.828a1 1 0 112 0v.829a10 10 0 11-5.93-9.14 1 1 0 01-.814 1.826A8 8 0 1020 12.005zM8.593 10.852a1 1 0 011.414 0L12 12.844l8.293-8.3a1 1 0 011.415 1.413l-9 9.009a1 1 0 01-1.415 0l-2.7-2.7a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg></span> &nbsp <span>Your code has been successfully uploaded to GitHub.</span></h3>`
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
    const submitBtn = document.querySelector("button[class='py-1.5 font-medium items-center whitespace-nowrap focus:outline-none inline-flex text-label-r bg-green-s dark:bg-dark-green-s hover:bg-green-3 dark:hover:bg-dark-green-3 h-[28px] select-none rounded px-5 text-[13px] leading-[18px]']")
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const submission = setInterval(async () => {
          const questionStatusDiv = document.querySelector('div[class="text-green-s dark:text-dark-green-s flex flex-1 items-center gap-2 text-[16px] font-medium leading-6"] > span')
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