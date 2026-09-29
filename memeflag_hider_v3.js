// ==UserScript==
// @name         memeflag_hider_v3
// @description  Hides memeflag threads and replies on 4chan.org/pol/, including new replies dynamically. Forked and patched from original Memeflag Hider v2 found here: https://greasyfork.org/en/scripts/438016-memeflag-hider-v2
// @version      3.0
// @author       K0K0$HA with GPT-5
// @include      http*://*.4chan.org/pol/*
// @run-at       document-idle
// @grant        none
// @license      ayyylmao
// To use, simply copy this code into a new module for your Tampermonkey/Violentmonkey/Greasemonkey

// ==/UserScript==

(function () {
  "use strict";

  const HIDE_MEMEFLAG_THREADS = true;
  const HIDE_MEMEFLAG_REPLIES = true;
  const AUTO_REFRESH_ON_FIRST_OPEN = true;
  const AUTO_REFRESH_DELAY_MS = 500;

  /** --- Auto-refresh logic --- **/
  if (AUTO_REFRESH_ON_FIRST_OPEN && window.location.href.includes("/thread/")) {
    const threadID = window.location.pathname.match(/thread\/(\d+)/)?.[1];
    if (threadID) {
      const key = "memeflag_refreshed_" + threadID;
      // Only refresh once per session
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        console.log(`[MemeflagHider] First time opening thread ${threadID}, refreshing in ${AUTO_REFRESH_DELAY_MS} ms...`);
        setTimeout(() => {
          window.location.reload();
        }, AUTO_REFRESH_DELAY_MS);
      }
    }
  }

  /** --- Utility: check if a post has a memeflag --- **/
  function isMemeflag(post) {
    const hasMemeflag = post.getElementsByClassName("bfl").length > 0;
    const hasFlag = post.getElementsByClassName("flag").length > 0;
    return hasMemeflag || !hasFlag;
  }

  /** --- Hide a post safely --- **/
  function hidePost(post) {
    const id = post.id?.substring(2);
    if (!id) return;
    if (post.classList.contains("opContainer")) {
      ThreadHiding?.hide(id);
    } else if (post.classList.contains("replyContainer")) {
      ReplyHiding?.hide(id);
    }
  }

  /** --- Hide all memeflags currently on page --- **/
  function hideExisting() {
    let count = 0;

    if (
      HIDE_MEMEFLAG_THREADS &&
      window.location.href.includes("/pol/") &&
      !window.location.href.includes("/thread/")
    ) {
      const threads = document.getElementsByClassName("postContainer opContainer");
      for (const post of threads) {
        if (isMemeflag(post)) {
          hidePost(post);
          count++;
        }
      }
    }

    if (HIDE_MEMEFLAG_REPLIES) {
      const replies = document.getElementsByClassName("postContainer replyContainer");
      for (const post of replies) {
        if (isMemeflag(post)) {
          hidePost(post);
          count++;
        }
      }
    }

    displayCounter(count);
  }

  /** --- Display hidden count --- **/
  function displayCounter(count) {
    const counter = document.createElement("div");
    counter.className = "thread-stats";
    counter.textContent = ` ${count} memeflags hidden`;
    document.querySelector(".navLinks.desktop")?.appendChild(counter);
  }

  /** --- Observe new posts dynamically --- **/
  function observeNewPosts() {
    const thread = document.querySelector("#thread-container, #threads, body");
    if (!thread) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.classList?.contains("postContainer")) {
            if (isMemeflag(node)) hidePost(node);
          }
          const nested = node.querySelectorAll?.(".postContainer");
          nested?.forEach((post) => {
            if (isMemeflag(post)) hidePost(post);
          });
        }
      }
    });

    observer.observe(thread, { childList: true, subtree: true });
  }

  /** --- Handle catalog view --- **/
  function hideInCatalog() {
    if (!window.location.href.includes("/catalog")) return;

    const memeflaggotthreads = Object.keys(catalog.threads).filter(
      (key) => catalog.threads[key].country === undefined
    );

    memeflaggotthreads.forEach((t) => delete catalog.threads[t]);
    document.querySelector("#order-ctrl")?.dispatchEvent(new Event("change"));

    const msg = document.createElement("span");
    msg.textContent = ` [${memeflaggotthreads.length} memeflags hidden]`;
    document.querySelector(".navLinks")?.appendChild(msg);
  }

  /** --- Entry point --- **/
  if (window.location.href.includes("/catalog")) {
    hideInCatalog();
  } else {
    hideExisting();
    observeNewPosts(); // ← Dynamic memeflag hiding
  }
})();
