"use strict";
//HTML Parser
const parser = new DOMParser();

//load
main();

async function main() {
  var pageType = "";

  if ($("#playhq").length > 0) {
    pageType = document.getElementById("playhq").innerHTML;
    setBtn(pageType);
    return;
  }

  isEpisodeType();
}

function isEpisodeType() {
  if ($(".episode")[0]) {
    $(".episode").click(function () {
      observeDom();
    });
  }
}

function setBtn(pageType) {
  if (pageType == "#M") {
    addBtn("Get m3u8 Link", "mLinkBtn").addEventListener("click", () =>
      m_getUrl("link")
    );
    addBtn("Download sub", "mSubBtn").addEventListener("click", () =>
      m_getUrl("sub")
    );
  }

  if (pageType == "#NM") {
    addBtn("Get m3u8 Link", "nmLinkBtn").addEventListener("click", () =>
      nm_getUrl("link")
    );
    addBtn("Download sub", "nmSubBtn").addEventListener("click", () =>
      nm_getUrl("sub")
    );
  }
}

function observeDom() {
  const domObserver = new MutationObserver((mutationList, observer) => {
    // document.body has changed! Do something.
    if ($("#playhq").length > 0) {
      const pageType = document.getElementById("playhq").innerHTML;
      setBtn(pageType);
    }
    // No need to observe anymore. Clean up!
    observer.disconnect();
  });

  domObserver.observe(document.getElementById("myplayer_new"), {
    childList: true,
    subtree: true,
  });
}

function addBtn(str, id) {
  // 1. Create the button
  var button = document.createElement("button");
  button.innerHTML = str;
  button.id = id;
  button.style.backgroundColor = "#17a2b8";
  button.style.color = "#fff";
  button.style.margin = "0px 5px";
  button.style.padding = "4px 10px";
  button.style.border = "0px";
  button.style.borderRadius = "4px";

  // 2. Append somewhere
  var location = document.getElementsByClassName("le-server")[0];
  location.appendChild(button);

  return button;
}

function getIframeUrl() {
  var link_data = $("#playhq").attr("data");
  var token = $('input[name="_token"]').val();
  var url = "";

  $.ajax({
    url: "https://m4uhd.tv/ajax",
    data: { m4u: link_data, _token: token },
    async: false,
    type: "POST",
    success: function (data) {
      url = $(data).find("iframe").attr("src");
    },
  });

  return url;
}

async function m_getUrl(btn) {
  var url = getIframeUrl();

  const body = await fetch(url, {
    method: "GET",
  });

  const str = await body.text();
  const idfile = getString(str, "var idfile = ", 14, ";", -1);
  const iduser = getString(str, "var idUser = ", 14, ";", -1);
  const idsub = getString(str, "var idSub = ", 13, ";", -1);
  const domain_api = getString(str, "var DOMAIN_API = ", 18, ";", -1);

  var m_data = {
    type: "m_link",
    url: domain_api + iduser + "/" + idfile,
  };

  var request = JSON.stringify(m_data);
  var response = await chrome.runtime.sendMessage(request);

  if (btn == "link") {
    //copy to clipboard
    await navigator.clipboard.writeText(response.data);
    //show message
    const promptMsg =
      "m3u8 link:\n" +
      response.data +
      "\n\nThe link has been copied to clipboard.";
    prompt(promptMsg, response.data);
  }

  if (btn == "sub") {
    const subBaseUrl = "https://sub.ourmovie.net/sub/sub/";
    const sub = subBaseUrl + idsub;
    window.open(sub);
  }
}

async function nm_getUrl(btn) {
  const url = getIframeUrl();

  const body = await fetch(url, {
    method: "GET",
  });

  const str = await body.text();
  const idfile = getString(str, "var idfile = ", 14, ";", -1);
  const iduser = getString(str, "var idUser = ", 14, ";", -1);
  const domain_api = getString(str, "var DOMAIN_API = ", 18, ";", -1);
  const namekey = getString(str, "var NameKeyV3 = ", 17, ";", -1);

  var nm_data = {
    type: "nm_link",
    url: domain_api,
    token: await nm_getToken(),
    data: nm_getData(iduser, idfile),
    namekey: namekey,
  };

  var request = JSON.stringify(nm_data);
  var response = await chrome.runtime.sendMessage(request);

  if (btn == "link") {
    //copy to clipboard
    await navigator.clipboard.writeText(response.data);
    //show message
    const promptMsg =
      "m3u8 link:\n" +
      response.data +
      "\n\nThe link has been copied to clipboard.";
    prompt(promptMsg, response.data);
  }

  if (btn == "sub") {
    const sub = getString(response.sub, "|", 1, ".srt", 4);
    window.open(sub);
  }
}

function getString(string, start_value, start_pos, end_value, end_pos) {
  var ind = string.indexOf(start_value);
  var begin_ind = ind + start_pos;
  var str1 = string.substring(begin_ind);
  var ind2 = str1.indexOf(end_value);
  var end_ind = ind2 + end_pos;
  var str2 = str1.substring(0, end_ind);

  return str2;
}

async function nm_getToken() {
  var token_data = { type: "token" };
  const json = JSON.stringify(token_data);

  const tokenRequest = await chrome.runtime.sendMessage(json);
  const htmlDoc = parser.parseFromString(tokenRequest, "text/html");
  const token = htmlDoc.getElementById("recaptcha-token").value;

  return token;
}

function nm_getData(idUser, idfile) {
  var domain_ref = "https://m4uhd.tv";
  var plf = "Win32";
  var dataenc = String2Hex(
    caesarShift(
      mahoa_data(
        plf + "|" + idUser + "|" + idfile + "|" + domain_ref,
        CryptoJS.MD5("plhq@@@2022").toString()
      ),
      22
    )
  );

  var data = dataenc + "|" + CryptoJS.MD5(dataenc + "plhq@@@22").toString();
  return data;
}

function mahoa_data(input, key) {
  var a = CryptoJS.AES.encrypt(input, key).toString();
  var b = a.replace("U2FsdGVkX1", "");
  b = b.replace(/\//g, "|a");
  b = b.replace(/\+/g, "|b");
  b = b.replace(/\=/g, "|c");
  b = b.replace(/\|/g, "-z");
  return b;
}

function caesarShift(str, amount) {
  if (amount < 0) {
    return caesarShift(str, amount + 26);
  }
  var output = "";
  for (var i = 0; i < str.length; i++) {
    var c = str[i];
    if (c.match(/[a-z]/i)) {
      var code = str.charCodeAt(i);
      if (code >= 65 && code <= 90) {
        c = String.fromCharCode(((code - 65 + amount) % 26) + 65);
      } else if (code >= 97 && code <= 122) {
        c = String.fromCharCode(((code - 97 + amount) % 26) + 97);
      }
    }
    output += c;
  }
  return output;
}

function String2Hex(tmp) {
  var str = "";
  for (var i = 0; i < tmp.length; i++) {
    str += tmp[i].charCodeAt(0).toString(16);
  }
  return str;
}
