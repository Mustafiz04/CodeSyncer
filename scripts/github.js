const link = window.location.href;

if (window.location.host === 'github.com') {
  console.log("LINK >>>", link)
  chrome.storage.local.get(['githubToken', 'githubUserAuthenticated'], (res) => {
    console.log("res.githubToken >>>", res.githubToken)
    console.log("res.githubUserAuthenticated >>>", res.githubUserAuthenticated)
    if (!res.githubToken) {
      console.log("HERE >>>>")
      parseAccessCode(link);
    }
  })
}

async function parseAccessCode(url) {
  if (url.match(/\?error=(.+)/)) {
    chrome.tabs.getCurrent(function (tab) {
      chrome.tabs.remove(tab.id, function () { });
    });
  } else {
    // eslint-disable-next-line
    const searchParams = new URLSearchParams(url.split('?')[1]);
    // console.log("searchParams ....", searchParams)
    const code = searchParams.get("code")
    await this.requestToken(code);
  }
}

async function requestToken(code) {
  try {
    console.log("CODE >>>", code)

    const body = {
      client_id: "806acb3c07d1af17f11f",
      client_secret: "c1c76ffc402b4c814939ff29b7e6e0ed594690fe",
      code: code
    };
    const url = 'https://github.com/login/oauth/access_token';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(body)
    })
      .then((res) => res.json())
      .catch((err) => {
        console.log({ err });
        return err;
      });
    console.log("RESPONSE >>>", response)

    // access_token : "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"
    // scope:  "repo"
    // token_type : "bearer"
    const { access_token = '' } = response
    chrome.storage.local.set({ "githubToken": access_token }, () => {
      console.log("GITHUB USER ACCESS TOKEN SET SUCCESSFULLY...")
    })
    fetchUserProfile(access_token)

  } catch (error) {
    console.log(error)
  }
}

async function fetchUserProfile(token) {
  try {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          console.log("JSON.parse(xhr.responseText) ??? USER", JSON.parse(xhr.responseText))
          const userProfile = JSON.parse(xhr.responseText)

          const { email = '' } = userProfile
          if (!email) {
            fetchEmail(token)
          }

          chrome.storage.local.set({ "githubUserAuthenticated": true }, () => {
            console.log("GITHUB USER AUTHENTICATED...")
          })

          chrome.runtime.sendMessage({ userProfile })
        }
      }
    });
    xhr.open('GET', 'https://api.github.com/user', true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send();
  } catch (error) {
    console.log("ERRROR >>>", error)
  }
}

async function fetchEmail(token) {
  try {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          console.log("JSON.parse(xhr.responseText) ??? EMAIL ", JSON.parse(xhr.responseText))
          const userEmails = JSON.parse(xhr.responseText)

          if (userEmails && userEmails.length > 0) {
            // TODO: check for primary: true. loop and check primary = true set 
            userEmails.map((e) => {
              const { email = '', primary } = e
              if(primary) {
                chrome.storage.local.set({ "githubUserEmail": email }, () => {
                  console.log("GITHUB USER's EMAIL IS SET")
                })
                return
              }
            }) 


          }
        }
      }
    });
    xhr.open('GET', 'https://api.github.com/user/emails', true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send();
  } catch (error) {

  }
}