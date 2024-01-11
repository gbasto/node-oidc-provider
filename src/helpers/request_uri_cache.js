import * as crypto from "node:crypto";
import { STATUS_CODES } from "node:http";

import { LRUCache } from "lru-cache";

import request from "./request.js";

class RequestUriCache {
  constructor(provider) {
    this.cache = new LRUCache({ max: 100 });
    this.provider = provider;
  }

  async resolve(requestUri) {
    const { cache } = this;
    const cacheKey = crypto.createHash("sha256").update(requestUri).digest("hex");
    const cached = cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const { statusCode, body } = await request.call(this.provider, {
      method: "GET",
      url: requestUri,
      headers: {
        Accept: "application/oauth-authz-req+jwt, application/jwt",
      },
    });

    if (statusCode !== 200) {
      throw new Error(
        `unexpected request_uri response status code, expected 200 OK, got ${statusCode} ${STATUS_CODES[statusCode]}`
      );
    }

    cache.set(cacheKey, body);

    return body;
  }
}

export default RequestUriCache;
