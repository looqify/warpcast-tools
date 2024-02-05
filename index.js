const fetch = require('node-fetch');
const prompt = require('prompt-sync')({ sigint: true });

class Warpcast {
  constructor(token) {
    this.token = token;
    this.headers = {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      authorization: 'Bearer ' + this.token,
      'content-type': 'application/json; charset=utf-8',
      'sec-ch-ua':
        '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      Referer: 'https://warpcast.com/',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
  }

  async usernameToId(username) {
    const res = await fetch(
      `https://client.warpcast.com/v2/user-by-username?username=${username}`,
      {
        headers: this.headers,
      }
    );

    const json = await res.json();
    return json?.result.user.fid;
  }

  async getFollowers(id, cursor = null) {
    const params = new URLSearchParams();

    if (cursor) {
      params.set('cursor', cursor);
    }

    params.set('fid', id);
    params.set('limit', 15);

    const res = await fetch(
      `https://client.warpcast.com/v2/followers?${params}`,
      {
        headers: this.headers,
      }
    );

    const json = await res.json();
    return json;
  }

  async getFollowing(id, cursor = null) {
    const params = new URLSearchParams();

    if (cursor) {
      params.set('cursor', cursor);
    }

    params.set('fid', id);
    params.set('limit', 15);

    const res = await fetch(
      `https://client.warpcast.com/v2/following?${params}`,
      {
        headers: this.headers,
      }
    );

    const json = await res.json();
    return json;
  }

  async follow(id) {
    const res = await fetch(`https://client.warpcast.com/v2/follows`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify({
        targetFid: parseInt(id),
      }),
    });

    const json = await res.json();
    return json;
  }

  async unfollow(id) {
    const res = await fetch(`https://client.warpcast.com/v2/follows`, {
      method: 'DELETE',
      headers: this.headers,
      body: JSON.stringify({
        targetFid: parseInt(id),
      }),
    });

    const json = await res.json();
    return json;
  }
}

const autoFollow = async () => {
  const token = prompt('Bearer    : ');
  const target = prompt('Target @  : ');
  console.log();
  const client = new Warpcast(token);

  const id = await client.usernameToId(target);
  let cursor = null;
  let hasNext = true;
  while (hasNext) {
    try {
      const { result, next } = await client.getFollowers(id, cursor); // result.users + next.cursorzs
      for (let user of result?.users) {
        try {
          const { fid, username, displayName, viewerContext } = user;
          if (viewerContext.following) {
            console.log(`[~] Follow : @${username} already followed!`);
            continue;
          }
          const follow = await client.follow(fid);
          console.log(`[~] Follow : @${username}`, follow);
        } catch (error) {
          console.log(`[!] Failed : Server meledak!`);
        }
        await new Promise((r) => setTimeout(r, 2323));
      }
      cursor = next.cursor;
      if (!cursor) hasNext = false;
      await new Promise((r) => setTimeout(r, 1337));
    } catch (e) {
      continue;
    }
  }
};

const unfollowNotFolback = async () => {
  const token = prompt('Bearer    : ');
  const target = prompt('Target @  : ');
  console.log();
  const client = new Warpcast(token);

  const id = await client.usernameToId(target);
  let cursor = null;
  let hasNext = true;
  while (hasNext) {
    try {
      const { result, next } = await client.getFollowing(id, cursor); // result.users + next.cursorzs
      for (let user of result?.users) {
        try {
          const { fid, username, displayName, viewerContext } = user;
          if (viewerContext.followedBy) {
            console.log(`[~] Unfollow : @${username} is following you!`);
            continue;
          }
          const follow = await client.unfollow(fid);
          console.log(`[~] Unfollow : @${username}`, follow);
        } catch (error) {
          console.log(`[!] Failed : Server meledak!`);
        }
        await new Promise((r) => setTimeout(r, 2323));
      }
      cursor = next.cursor;
      if (!cursor) hasNext = false;
      await new Promise((r) => setTimeout(r, 1337));
    } catch (e) {
      continue;
    }
  }
};

const exec = async () => {
  console.log();
  console.log('[1] Follow by username');
  console.log('[2] Unfollow not folback');
  const answer = prompt('>>> ');
  console.clear();
  if (parseInt(answer) === 1) {
    await autoFollow();
  } else {
    await unfollowNotFolback();
  }
};

exec();
