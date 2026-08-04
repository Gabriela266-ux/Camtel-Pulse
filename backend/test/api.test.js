const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { createApp } = require("../server");

function requestJson(server, path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: server.address().port,
        path,
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          let parsed;
          try {
            parsed = body ? JSON.parse(body) : null;
          } catch (error) {
            reject(error);
            return;
          }
          resolve({ statusCode: res.statusCode, body: parsed });
        });
      }
    );

    req.on("error", reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

test("auth login and me endpoints work", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const loginRes = await requestJson(server, "/api/auth/login", {
      method: "POST",
      body: { email: "admin@camtel.com", password: "admin123" },
    });

    assert.equal(loginRes.statusCode, 200);
    assert.ok(loginRes.body.token);

    const meRes = await requestJson(server, "/api/auth/me", {
      headers: { Authorization: `Bearer ${loginRes.body.token}` },
    });

    assert.equal(meRes.statusCode, 200);
    assert.equal(meRes.body.role, "admin");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("tree endpoint returns nested hierarchy and status", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const res = await requestJson(server, "/api/tree");

    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body[0].clients.length > 0);
    assert.ok(res.body[0].clients[0].dsms.length > 0);
    assert.ok(res.body[0].clients[0].dsms[0].pos.length > 0);
    assert.match(res.body[0].clients[0].status, /ok|alert/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("sales posting updates KPI metrics", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const posId = "pos-1";
    const saleRes = await requestJson(server, `/api/pos/${posId}/ventes`, {
      method: "POST",
      body: { date: "2026-08-01", montant: 2500 },
    });

    assert.equal(saleRes.statusCode, 200);
    assert.equal(saleRes.body.montant, 2500);

    const kpiRes = await requestJson(server, `/api/nodes/${posId}/kpi?from=2026-08-01&to=2026-08-01`);
    assert.equal(kpiRes.statusCode, 200);
    assert.equal(kpiRes.body.venteJour, 2500);
    assert.equal(kpiRes.body.cumul, 2500);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
