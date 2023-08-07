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

/* Commit messages */
const README_MSG = 'Create README - LeetHub';
const SUBMIT_MSG = 'Added solution - LeetHub';
const UPDATE_MSG = 'Updated solution - LeetHub';
let START_MONITOR = true;
const toKebabCase = (string) => {
  return string
    .replace(/[^a-zA-Z0-9\. ]/g, '') // remove special chars
    .replace(/([a-z])([A-Z])/g, '$1-$2') // get all lowercase letters that are near to uppercase ones
    .replace(/[\s_]+/g, '-') // replace all spaces and low dash
    .toLowerCase(); // convert to lower case
};

function findGfgLanguage() {
  const ele = document.getElementsByClassName('divider text')[0].innerText;
  const lang = ele.split('(')[0].trim();
  if (lang.length > 0 && languages[lang]) {
    return languages[lang];
  }
  return null;
}

function findTitle() {
  const ele = document.querySelector('h3[class="g-m-0"]').innerText;
  if (ele != null) {
    return ele;
  }
  return '';
}

function findDifficulty() {
  const ele = document.querySelector('div[class="problems_header_description__t_8PB"] span > strong').innerText;
  if (ele != null) {
    return ele;
  }
  return '';
}

function getProblemStatement() {
  const ele = document.querySelector('[class^="problems_problem_content"]');
  return `${ele.outerHTML}`;
}

async function getCode() {
  try {
    const divElement = document.getElementsByClassName("green item problems_header_menu__items__BUrou")
    console.log("divElement >>>", divElement[2]);

    // Simulate a click event on the div element
    divElement[2].click();

    // Wait for a short delay using a Promise
    await new Promise(resolve => setTimeout(resolve, 1000)); // Adjust the delay as needed

    const table = document.querySelector('.ui.unstackable.table')
    const tableRow = table.querySelector('tbody tr:first-child td:last-child');
    const aTag = tableRow.querySelector('a');

    aTag.click()
    // Wait for a short delay using a Promise
    await new Promise(resolve => setTimeout(resolve, 1000)); // Adjust the delay as needed

    // Get a reference to the pre element
    const preElement = document.getElementsByClassName('prettyprint prettyprinted');

    // Check if the pre element exists and is visible
    if (preElement) {
      // Extract the data from the pre element
      const extractedData = preElement[0].innerText;

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


async function pushCode(code, difficulty, problemName, problemStatement, language, platform) {
  /* Get necessary payload data */
  chrome.storage.local.get(['githubToken', 'githubRepoLinked', 'githubUserAuthenticated', 'linkRepoName', 'githubUserName', 'githubUserEmail', 'userStatistics'], async (userData) => {
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
      const readmeCommitMessage = "Create README - CodeHub"
      const codeCommitMessage = "Added solution - CodeHub"
      const committer = {
        name: username,
        email: email
      }
      const content = code  // convert to base64

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
      // if ( stats !== undefined && stats.sha !== undefined && stats.sha[filePath] !== undefined ) {
      //   sha = stats.sha[filePath];
      // }

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

      const closebtn = document.getElementsByClassName("close icon")
      if(closebtn) {
        closebtn[1].click()
      }
      let newParagraph = document.createElement('div')
      newParagraph.innerHTML = `<p id='successTagCode' style='color: green; display:flex; flexGap'><span><svg xmlns='http://www.w3.org/2000/svg' viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" class="h-5 w-5"><path fill-rule="evenodd" d="M20 12.005v-.828a1 1 0 112 0v.829a10 10 0 11-5.93-9.14 1 1 0 01-.814 1.826A8 8 0 1020 12.005zM8.593 10.852a1 1 0 011.414 0L12 12.844l8.293-8.3a1 1 0 011.415 1.413l-9 9.009a1 1 0 01-1.415 0l-2.7-2.7a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg></span> &nbsp <span>Your code has been successfully uploaded to GitHub.</span></p>`
      const parentDiv = document.querySelector('.problems_footer__uv1_E');
      const secondChild = parentDiv.children[1];
      parentDiv.insertBefore(newParagraph, secondChild);
    }
  });
}

const delay = ms => new Promise(res => setTimeout(res, ms));

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
              userStatistics.total += 1;
              userStatistics.easy += difficulty === 'Easy' ? 1 : 0;
              userStatistics.medium += difficulty === 'Medium' ? 1 : 0;
              userStatistics.hard += difficulty === 'Hard' ? 1 : 0;
            }
            userStatistics.sha[filePath] = updatedSha; // update sha key.
            chrome.storage.local.set({ userStatistics }, () => {
              console.log(`Successfully committed ${filePath} to github`,);
            });
          });
        }
      }
    });

    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Accept', 'application/vnd.github.v3+json');
    xhr.send(JSON.stringify(data));
  } catch (error) {
    console.log("push error", error)
  }
}

const gfgLoader = setInterval(() => {
  let code, problemStatement, title, language, difficulty;
  if (
    window.location.href.includes('practice.geeksforgeeks.org/problems')
  ) {
    const submitBtn = document.querySelector('button[class="ui button problems_submit_button__6QoNQ"]')
    submitBtn.addEventListener('click', function () {
      START_MONITOR = true;
      const submission = setInterval(async () => {
        let questionStatus
        const questionStatusDiv = document.querySelector('div[class="problems_content_pane__nexJa"] > div > h3 ');
        if (questionStatusDiv) {
          questionStatus = questionStatusDiv.innerText
          if (questionStatus === 'Problem Solved Successfully' && START_MONITOR) {
            console.log("HERE INSIDE the successTag", questionStatus)
            START_MONITOR = false;
            clearInterval(gfgLoader);
            clearInterval(submission);

            title = findTitle().trim();
            difficulty = findDifficulty();
            problemStatement = getProblemStatement();
            // code = await getCodeScript();
            code = await getCode();
            language = findGfgLanguage();
            // const probName = `${title} - GFG`;
            // problemStatement = `# ${title}\n## ${difficulty}\n${problemStatement}`;

            console.log("title <<<<>>>", title)
            console.log("difficulty >>>", difficulty)
            console.log("problemStatement >>>", problemStatement)
            console.log("language >>>>", language)
            console.log("code >>>>", code)

            await pushCode(code, difficulty, title, problemStatement, language, 'gfg')
          } else if (questionStatus === 'Wrong Answer. !!!' || questionStatus === 'Compilation Error') {
            console.log("HERE INSIDE the failTag", questionStatus)
            clearInterval(submission);
          }
        }
      }, 1000);
    });
  }
}, 1000);