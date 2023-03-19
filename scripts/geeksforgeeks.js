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

function getCode() {
  const scriptContent = `
  var editor = ace.edit("ace-editor");
  var editorContent = editor.getValue();
  var para = document.createElement("pre");
  para.innerText+=editorContent;
  para.setAttribute("id","codeDataLeetHub")
  document.body.appendChild(para);
  `;

  var script = document.createElement('script');
  script.id = 'tmpScript';
  script.appendChild(document.createTextNode(scriptContent));
  (
    document.body ||
    document.head ||
    document.documentElement
  ).appendChild(script);
  const text = document.getElementById('codeDataLeetHub').innerText;

  const nodeDeletionScript = `document.body.removeChild(para)`;
  var script = document.createElement('script');
  script.id = 'tmpScript';
  script.appendChild(document.createTextNode(nodeDeletionScript));
  (
    document.body ||
    document.head ||
    document.documentElement
  ).appendChild(script);

  return text || '';
}

async function getCodeScript() {
  chrome.storage.local.get(["currentTab"], (res) => {
    chrome.scripting.executeScript({
      target: { tabId: res.currentTab },
      func: getCode,
      args: [],
    });
  })
}

async function pushCode(code, difficulty, problemName, problemStatement, language, platform) {
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
      const content = code  // convert to base64

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
    }
  });
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function pushCodeToGithub(token, difficulty, content, owner, reponame, filePath, commitMessage, committer, commitType, commitAction) {
  try {
    const url = `https://api.github.com/repos/${owner}/${reponame}/contents/${filePath}`
    let data = {
      message: commitMessage,
      content: btoa(unescape(encodeURIComponent(content))),
      committer,
    };

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
    console.log(error)
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
        const questionStatus = document.querySelector('div[class="problems_content_pane__nexJa"] > div > h3 ').innerText;
        if (questionStatus === 'Problem Solved Successfully' && START_MONITOR) {
          console.log("HERE INSIDE the successTag", questionStatus)
          START_MONITOR = false;
          clearInterval(gfgLoader);
          clearInterval(submission);

          title = findTitle().trim();
          difficulty = findDifficulty();
          problemStatement = getProblemStatement();
          code = await getCodeScript();
          language = findGfgLanguage();
          // const probName = `${title} - GFG`;
          // problemStatement = `# ${title}\n## ${difficulty}\n${problemStatement}`;


          console.log("title <<<<>>>", title)
          console.log("difficulty >>>", difficulty)
          console.log("problemStatement >>>", problemStatement)
          console.log("language >>>>", language)
          console.log("code >>>>", code)

          pushCode(code, difficulty, title, problemStatement, language, 'gfg')
        } else if (questionStatus === 'Wrong Answer. !!!' || questionStatus === 'Compilation Error') {
          console.log("HERE INSIDE the failTag", questionStatus)
          clearInterval(submission);
        }
      }, 1000);
    });
  }
}, 1000);