chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

  const json = JSON.parse(request);

  if (json.type == "token") {
    nm_getToken().then((msg) => {
      sendResponse(msg);
    });
  };

  if (json.type == "m_link") {
    m_getLink(json).then((msg) => {
      sendResponse(msg);
    });
  };

  if (json.type == "nm_link") {
    nm_getLink(json).then((msg) => {
      sendResponse(msg);
    });
  };
  
  return true;
});

async function m_getLink(json) {
  
  const referrer = "https://m4uhd.tv";
  const payload = "referrer=" + referrer;

  const response = await fetch(json.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
  });

  const json_data = await response.json()
  return json_data;
}

async function nm_getLink(json) {

  const referrer = "https://m4uhd.tv";
  const payload = "referrer=" + referrer + "&" + "namekey=" + json.namekey + "&" + "data=" + json.data + "&" + "token=" + json.token;

  const response = await fetch(json.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
  });

const json_data = await response.json()
return json_data;
}

async function nm_getToken() {
  const url =
    "https://www.google.com/recaptcha/api2/anchor?k=6LfMlo8lAAAAAEKUWwq9Zuc2Wo_w2ObqSN8ebeCa&co=aHR0cHM6Ly9wbGF5OXN0ci5wbGF5bTR1Lnh5ejo0NDM.&size=invisible";

  const response = await fetch(url, {
    method: "GET",
  });

  const body = await response.text();

  return body;
}
