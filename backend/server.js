const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();

function createApp() {
  const app = express();
  const PORT = process.env.PORT || 5000;

  const state = createStore();

  app.use(helmet());
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());

  function getAuthUser(req) {
    const header = req.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return null;
    const user = state.users.find((entry) => entry.token === token);
    return user || null;
  }

  function parseDateRange(req) {
    const from = req.query.from || getDefaultRangeStart();
    const to = req.query.to || getDefaultRangeEnd();
    return { from, to };
  }

  function getDefaultRangeStart() {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return dateToString(date);
  }

  function getDefaultRangeEnd() {
    return dateToString(new Date());
  }

  function dateToString(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
  }

  function parseDate(value) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  function getDatesBetween(from, to) {
    const start = parseDate(from);
    const end = parseDate(to);
    const dates = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(dateToString(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  function getChildren(type, id) {
    if (type === "centre") {
      return state.clients.filter((client) => client.centre_id === id);
    }
    if (type === "client") {
      return state.dsms.filter((dsm) => dsm.client_id === id);
    }
    if (type === "dsm") {
      return state.pos.filter((item) => item.dsm_id === id);
    }
    return [];
  }

  function getNodeById(id) {
    const centre = state.centres.find((item) => item.id === id);
    if (centre) return { type: "centre", data: centre };
    const client = state.clients.find((item) => item.id === id);
    if (client) return { type: "client", data: client };
    const dsm = state.dsms.find((item) => item.id === id);
    if (dsm) return { type: "dsm", data: dsm };
    const pointOfSale = state.pos.find((item) => item.id === id);
    if (pointOfSale) return { type: "pos", data: pointOfSale };
    return null;
  }

  function getNodePath(nodeId) {
    const node = getNodeById(nodeId);
    if (!node) return [];

    if (node.type === "centre") {
      return [{ id: node.data.id, type: "centre", name: node.data.nom }];
    }

    if (node.type === "client") {
      const centre = state.centres.find((item) => item.id === node.data.centre_id);
      return [
        { id: centre.id, type: "centre", name: centre.nom },
        { id: node.data.id, type: "client", name: node.data.nom },
      ];
    }

    if (node.type === "dsm") {
      const client = state.clients.find((item) => item.id === node.data.client_id);
      const centre = state.centres.find((item) => item.id === client.centre_id);
      return [
        { id: centre.id, type: "centre", name: centre.nom },
        { id: client.id, type: "client", name: client.nom },
        { id: node.data.id, type: "dsm", name: node.data.nom },
      ];
    }

    const pos = state.pos.find((item) => item.id === nodeId);
    const dsm = state.dsms.find((item) => item.id === pos.dsm_id);
    const client = state.clients.find((item) => item.id === dsm.client_id);
    const centre = state.centres.find((item) => item.id === client.centre_id);
    return [
      { id: centre.id, type: "centre", name: centre.nom },
      { id: client.id, type: "client", name: client.nom },
      { id: dsm.id, type: "dsm", name: dsm.nom },
      { id: pos.id, type: "pos", name: pos.nom },
    ];
  }

  function recalculateSecurityStock() {
    state.clients.forEach((client) => {
      client.stock_securite = client.objectif_mensuel / 31 * 3;
    });

    state.dsms.forEach((dsm) => {
      const client = state.clients.find((item) => item.id === dsm.client_id);
      const clientDsmCount = state.dsms.filter((entry) => entry.client_id === client.id).length;
      dsm.stock_securite = client && clientDsmCount > 0 ? client.stock_securite / clientDsmCount : 0;
    });

    state.pos.forEach((point) => {
      const dsm = state.dsms.find((item) => item.id === point.dsm_id);
      const dsmPosCount = state.pos.filter((entry) => entry.dsm_id === dsm.id).length;
      point.stock_securite = dsm && dsmPosCount > 0 ? dsm.stock_securite / dsmPosCount : 0;
    });
  }

  function getDescendantPosIds(nodeType, nodeId) {
    if (nodeType === "pos") {
      return [nodeId];
    }

    if (nodeType === "dsm") {
      return state.pos.filter((item) => item.dsm_id === nodeId).map((item) => item.id);
    }

    if (nodeType === "client") {
      const dsmIds = state.dsms.filter((item) => item.client_id === nodeId).map((item) => item.id);
      return state.pos.filter((item) => dsmIds.includes(item.dsm_id)).map((item) => item.id);
    }

    if (nodeType === "centre") {
      const clientIds = state.clients.filter((item) => item.centre_id === nodeId).map((item) => item.id);
      const dsmIds = state.dsms.filter((item) => clientIds.includes(item.client_id)).map((item) => item.id);
      return state.pos.filter((item) => dsmIds.includes(item.dsm_id)).map((item) => item.id);
    }

    return [];
  }

  function getSalesForNode(nodeType, nodeId, from, to) {
    const posIds = getDescendantPosIds(nodeType, nodeId);
    return state.sales.filter((sale) => posIds.includes(sale.pos_id) && sale.date >= from && sale.date <= to);
  }

  function buildKpiPayload(nodeType, nodeId, from, to) {
    const sales = getSalesForNode(nodeType, nodeId, from, to);
    const dates = getDatesBetween(from, to);
    const byDay = Object.fromEntries(dates.map((date) => [date, 0]));
    sales.forEach((sale) => {
      if (byDay[sale.date] !== undefined) {
        byDay[sale.date] += sale.montant;
      }
    });

    let cumul = 0;
    const history = dates.map((date) => {
      const venteJour = byDay[date] || 0;
      cumul += venteJour;
      return {
        date,
        venteJour,
        cumul,
        ecartJour: venteJour - getStockSecurityForNode(nodeType, nodeId),
        ecartCumul: cumul - getStockSecurityForNode(nodeType, nodeId),
      };
    });

    const lastDay = history[history.length - 1] || { venteJour: 0, cumul: 0 };
    const venteJour = lastDay.venteJour;
    const cumulValue = lastDay.cumul;
    const stockSecurite = getStockSecurityForNode(nodeType, nodeId);

    return {
      venteJour,
      cumul: cumulValue,
      ecartJour: venteJour - stockSecurite,
      ecartCumul: cumulValue - stockSecurite,
      stockSecurite,
      history,
    };
  }

  function getStockSecurityForNode(nodeType, nodeId) {
    if (nodeType === "centre") {
      return 0;
    }

    if (nodeType === "client") {
      const node = state.clients.find((item) => item.id === nodeId);
      return node ? node.stock_securite : 0;
    }

    if (nodeType === "dsm") {
      const node = state.dsms.find((item) => item.id === nodeId);
      return node ? node.stock_securite : 0;
    }

    const node = state.pos.find((item) => item.id === nodeId);
    return node ? node.stock_securite : 0;
  }

  function getNodeStatus(nodeType, nodeId, from, to) {
    const { ecartCumul } = buildKpiPayload(nodeType, nodeId, from, to);
    return ecartCumul >= 0 ? "ok" : "alert";
  }

  function toNodePayload(nodeType, node) {
    if (nodeType === "centre") {
      return {
        id: node.id,
        nom: node.nom,
        region: node.region,
        nombrePartenaire: node.nombrePartenaire,
        type: "centre",
      };
    }

    if (nodeType === "client") {
      return {
        id: node.id,
        nom: node.nom,
        centre_id: node.centre_id,
        objectif_mensuel: node.objectif_mensuel,
        numero: node.numero,
        lieu: node.lieu,
        stock_securite: node.stock_securite,
        type: "client",
      };
    }

    if (nodeType === "dsm") {
      return {
        id: node.id,
        nom: node.nom,
        client_id: node.client_id,
        stock_securite: node.stock_securite,
        type: "dsm",
      };
    }

    return {
      id: node.id,
      nom: node.nom,
      dsm_id: node.dsm_id,
      lieu: node.lieu,
      stock_securite: node.stock_securite,
      type: "pos",
    };
  }

  app.get("/", (req, res) => {
    res.json({ message: "Camtel Pulse backend is running" });
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body || {};
    const user = state.users.find((entry) => entry.email === email && entry.password === password);
    if (!user) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const token = `${user.role}-${user.id}-${Date.now()}`;
    user.token = token;
    return res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  });

  app.get("/api/auth/me", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ message: "Non autorisé" });
    }

    return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  });

  app.get("/api/tree", (req, res) => {
    const { from, to } = parseDateRange(req);
    const tree = state.centres.map((centre) => {
      const clients = state.clients
        .filter((client) => client.centre_id === centre.id)
        .map((client) => {
          const dsms = state.dsms
            .filter((dsm) => dsm.client_id === client.id)
            .map((dsm) => {
              const pos = state.pos
                .filter((entry) => entry.dsm_id === dsm.id)
                .map((entry) => ({
                  ...toNodePayload("pos", entry),
                  status: getNodeStatus("pos", entry.id, from, to),
                }));
              return {
                ...toNodePayload("dsm", dsm),
                pos,
                status: getNodeStatus("dsm", dsm.id, from, to),
              };
            });
          return {
            ...toNodePayload("client", client),
            dsms,
            status: getNodeStatus("client", client.id, from, to),
          };
        });
      return {
        ...toNodePayload("centre", centre),
        clients,
        status: getNodeStatus("centre", centre.id, from, to),
      };
    });

    return res.json(tree);
  });

  app.get("/api/tree/:centreId", (req, res) => {
    const centre = state.centres.find((item) => item.id === req.params.centreId);
    if (!centre) {
      return res.status(404).json({ message: "Centre introuvable" });
    }

    const { from, to } = parseDateRange(req);
    const clients = state.clients
      .filter((client) => client.centre_id === centre.id)
      .map((client) => {
        const dsms = state.dsms
          .filter((dsm) => dsm.client_id === client.id)
          .map((dsm) => {
            const pos = state.pos
              .filter((entry) => entry.dsm_id === dsm.id)
              .map((entry) => ({ ...toNodePayload("pos", entry), status: getNodeStatus("pos", entry.id, from, to) }));
            return { ...toNodePayload("dsm", dsm), pos, status: getNodeStatus("dsm", dsm.id, from, to) };
          });
        return { ...toNodePayload("client", client), dsms, status: getNodeStatus("client", client.id, from, to) };
      });

    return res.json({ ...toNodePayload("centre", centre), clients, status: getNodeStatus("centre", centre.id, from, to) });
  });

  app.get("/api/nodes/:id", (req, res) => {
    const node = getNodeById(req.params.id);
    if (!node) {
      return res.status(404).json({ message: "Nœud introuvable" });
    }
    return res.json({ node: toNodePayload(node.type, node.data), path: getNodePath(req.params.id) });
  });

  app.get("/api/nodes/:id/kpi", (req, res) => {
    const node = getNodeById(req.params.id);
    if (!node) {
      return res.status(404).json({ message: "Nœud introuvable" });
    }

    const { from, to } = parseDateRange(req);
    const payload = buildKpiPayload(node.type, node.data.id, from, to);
    return res.json({
      node: toNodePayload(node.type, node.data),
      ...payload,
    });
  });

  app.get("/api/nodes/:id/history", (req, res) => {
    const node = getNodeById(req.params.id);
    if (!node) {
      return res.status(404).json({ message: "Nœud introuvable" });
    }

    const { from, to } = parseDateRange(req);
    const payload = buildKpiPayload(node.type, node.data.id, from, to);
    return res.json({
      node: toNodePayload(node.type, node.data),
      history: payload.history.map((item) => ({
        date: item.date,
        ventes_jour: item.venteJour,
        cumul: item.cumul,
        ecart_jour: item.ecartJour,
        ecart_cumul: item.ecartCumul,
        stock_securite: getStockSecurityForNode(node.type, node.data.id),
      })),
    });
  });

  app.get("/api/nodes/:id/chart", (req, res) => {
    const node = getNodeById(req.params.id);
    if (!node) {
      return res.status(404).json({ message: "Nœud introuvable" });
    }

    const days = Number(req.query.days || 7);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    const from = dateToString(start);
    const to = dateToString(end);
    const payload = buildKpiPayload(node.type, node.data.id, from, to);
    return res.json({
      labels: payload.history.map((item) => item.date),
      series: {
        ventes: payload.history.map((item) => item.venteJour),
        stockSecurite: payload.history.map(() => getStockSecurityForNode(node.type, node.data.id)),
      },
    });
  });

  app.get("/api/search", (req, res) => {
    const query = (req.query.q || "").toLowerCase().trim();
    if (!query) {
      return res.json([]);
    }

    const matches = [];
    state.clients.forEach((client) => {
      if (client.nom.toLowerCase().includes(query) || client.id.toLowerCase().includes(query)) {
        matches.push({
          id: client.id,
          type: "client",
          name: client.nom,
          path: getNodePath(client.id).map((entry) => entry.name).join(" > "),
        });
      }
    });
    state.dsms.forEach((dsm) => {
      if (dsm.nom.toLowerCase().includes(query) || dsm.id.toLowerCase().includes(query)) {
        matches.push({
          id: dsm.id,
          type: "dsm",
          name: dsm.nom,
          path: getNodePath(dsm.id).map((entry) => entry.name).join(" > "),
        });
      }
    });
    state.pos.forEach((item) => {
      if (item.nom.toLowerCase().includes(query) || item.id.toLowerCase().includes(query)) {
        matches.push({
          id: item.id,
          type: "pos",
          name: item.nom,
          path: getNodePath(item.id).map((entry) => entry.name).join(" > "),
        });
      }
    });

    return res.json(matches);
  });

  app.post("/api/pos/:id/ventes", (req, res) => {
    const pos = state.pos.find((item) => item.id === req.params.id);
    if (!pos) {
      return res.status(404).json({ message: "POS introuvable" });
    }

    const { date, montant } = req.body || {};
    if (!date || typeof montant !== "number") {
      return res.status(400).json({ message: "date et montant sont requis" });
    }

    const existingSale = state.sales.find((sale) => sale.pos_id === pos.id && sale.date === date);
    const now = new Date().toISOString();
    if (existingSale) {
      existingSale.montant = montant;
      existingSale.updated_at = now;
      persistState(state);
      return res.json(existingSale);
    }

    const newSale = {
      id: `sale-${Date.now()}`,
      pos_id: pos.id,
      date,
      montant,
      created_at: now,
      updated_at: now,
    };
    state.sales.push(newSale);
    persistState(state);
    return res.json(newSale);
  });

  app.put("/api/clients/:id", (req, res) => {
    const client = state.clients.find((item) => item.id === req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Client introuvable" });
    }

    const { objectif_mensuel } = req.body || {};
    if (typeof objectif_mensuel !== "number") {
      return res.status(400).json({ message: "objectif_mensuel est requis" });
    }

    client.objectif_mensuel = objectif_mensuel;
    recalculateSecurityStock();
    persistState(state);
    return res.json(toNodePayload("client", client));
  });

  app.post("/api/centres", (req, res) => {
    const { nom, region = "", nombrePartenaire = 0 } = req.body || {};
    if (!nom) {
      return res.status(400).json({ message: "nom est requis" });
    }
    const centre = { id: `centre-${Date.now()}`, nom, region, nombrePartenaire };
    state.centres.push(centre);
    persistState(state);
    return res.status(201).json(toNodePayload("centre", centre));
  });

  app.post("/api/clients", (req, res) => {
    const { nom, centre_id, objectif_mensuel = 0, numero = "", lieu = "" } = req.body || {};
    if (!nom || !centre_id) {
      return res.status(400).json({ message: "nom et centre_id sont requis" });
    }
    const client = {
      id: `client-${Date.now()}`,
      nom,
      centre_id,
      objectif_mensuel,
      numero,
      lieu,
      stock_securite: 0,
    };
    state.clients.push(client);
    recalculateSecurityStock();
    persistState(state);
    return res.status(201).json(toNodePayload("client", client));
  });

  app.post("/api/dsm", (req, res) => {
    const { nom, client_id } = req.body || {};
    if (!nom || !client_id) {
      return res.status(400).json({ message: "nom et client_id sont requis" });
    }
    const dsm = { id: `dsm-${Date.now()}`, nom, client_id, stock_securite: 0 };
    state.dsms.push(dsm);
    recalculateSecurityStock();
    persistState(state);
    return res.status(201).json(toNodePayload("dsm", dsm));
  });

  app.post("/api/pos", (req, res) => {
    const { nom, dsm_id, lieu = "" } = req.body || {};
    if (!nom || !dsm_id) {
      return res.status(400).json({ message: "nom et dsm_id sont requis" });
    }
    const point = { id: `pos-${Date.now()}`, nom, dsm_id, lieu, stock_securite: 0 };
    state.pos.push(point);
    recalculateSecurityStock();
    persistState(state);
    return res.status(201).json(toNodePayload("pos", point));
  });

  app.delete("/api/:type/:id", (req, res) => {
    const { type, id } = req.params;
    if (type === "centres") {
      const centre = state.centres.find((item) => item.id === id);
      if (!centre) {
        return res.status(404).json({ message: "Centre introuvable" });
      }
      const hasChildren = state.clients.some((client) => client.centre_id === id);
      if (hasChildren) {
        return res.status(409).json({ message: "Suppression impossible : des clients sont liés à ce centre" });
      }
      state.centres = state.centres.filter((item) => item.id !== id);
      persistState(state);
      return res.json({ success: true });
    }

    if (type === "clients") {
      const client = state.clients.find((item) => item.id === id);
      if (!client) {
        return res.status(404).json({ message: "Client introuvable" });
      }
      const hasChildren = state.dsms.some((dsm) => dsm.client_id === id);
      if (hasChildren) {
        return res.status(409).json({ message: "Suppression impossible : des DSM sont liés à ce client" });
      }
      state.clients = state.clients.filter((item) => item.id !== id);
      recalculateSecurityStock();
      persistState(state);
      return res.json({ success: true });
    }

    if (type === "dsm") {
      const dsm = state.dsms.find((item) => item.id === id);
      if (!dsm) {
        return res.status(404).json({ message: "DSM introuvable" });
      }
      const hasChildren = state.pos.some((item) => item.dsm_id === id);
      if (hasChildren) {
        return res.status(409).json({ message: "Suppression impossible : des POS sont liés à ce DSM" });
      }
      state.dsms = state.dsms.filter((item) => item.id !== id);
      recalculateSecurityStock();
      persistState(state);
      return res.json({ success: true });
    }

    if (type === "pos") {
      const point = state.pos.find((item) => item.id === id);
      if (!point) {
        return res.status(404).json({ message: "POS introuvable" });
      }
      state.pos = state.pos.filter((item) => item.id !== id);
      state.sales = state.sales.filter((sale) => sale.pos_id !== id);
      recalculateSecurityStock();
      persistState(state);
      return res.json({ success: true });
    }

    return res.status(400).json({ message: "Type invalide" });
  });

  return app;
}

function getStoreFilePath() {
  return process.env.CAMTEL_DATA_PATH || path.join(__dirname, "data", "store.json");
}

function ensureStoreFile() {
  const filePath = getStoreFilePath();
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) {
    const seed = createSeedState();
    fs.writeFileSync(filePath, JSON.stringify(seed, null, 2));
  }
  return filePath;
}

function createSeedState() {
  const users = [
    { id: "user-1", name: "Admin", email: "admin@camtel.com", password: "admin123", role: "admin" },
    { id: "user-2", name: "Agent Centre", email: "agent@camtel.com", password: "agent123", role: "agent_centre" },
  ];

  const centres = [
    { id: "centre-1", nom: "Centre 1 CDPSM", region: "Douala", nombrePartenaire: 3 },
  ];

  const clients = [
    { id: "client-1", nom: "Glotelho", centre_id: "centre-1", objectif_mensuel: 31000, numero: "001", lieu: "Douala", stock_securite: 0 },
    { id: "client-2", nom: "Master Color", centre_id: "centre-1", objectif_mensuel: 27000, numero: "002", lieu: "Yaoundé", stock_securite: 0 },
  ];

  const dsms = [
    { id: "dsm-1", nom: "DSM A", client_id: "client-1", stock_securite: 0 },
    { id: "dsm-2", nom: "DSM B", client_id: "client-2", stock_securite: 0 },
  ];

  const pos = [
    { id: "pos-1", nom: "POS 1", dsm_id: "dsm-1", lieu: "Bonabéri", stock_securite: 0 },
    { id: "pos-2", nom: "POS 2", dsm_id: "dsm-2", lieu: "Bastos", stock_securite: 0 },
  ];

  const sales = [];
  const state = { users, centres, clients, dsms, pos, sales, config: { repartitionMode: "equal" } };
  recalculateSecurityStock(state);
  return state;
}

function loadStore() {
  ensureStoreFile();
  const filePath = getStoreFilePath();
  const raw = fs.readFileSync(filePath, "utf8");
  const state = JSON.parse(raw);
  state.users = state.users || [];
  state.centres = state.centres || [];
  state.clients = state.clients || [];
  state.dsms = state.dsms || [];
  state.pos = state.pos || [];
  state.sales = state.sales || [];
  state.config = state.config || { repartitionMode: "equal" };
  recalculateSecurityStock(state);
  return state;
}

function persistState(state) {
  const filePath = getStoreFilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

function createStore() {
  return loadStore();
}

function recalculateSecurityStock(state) {
  state.clients.forEach((client) => {
    client.stock_securite = client.objectif_mensuel / 31 * 3;
  });

  state.dsms.forEach((dsm) => {
    const client = state.clients.find((item) => item.id === dsm.client_id);
    const clientDsmCount = state.dsms.filter((entry) => entry.client_id === client.id).length;
    dsm.stock_securite = client && clientDsmCount > 0 ? client.stock_securite / clientDsmCount : 0;
  });

  state.pos.forEach((point) => {
    const dsm = state.dsms.find((item) => item.id === point.dsm_id);
    const dsmPosCount = state.pos.filter((entry) => entry.dsm_id === dsm.id).length;
    point.stock_securite = dsm && dsmPosCount > 0 ? dsm.stock_securite / dsmPosCount : 0;
  });
}

function startServer() {
  const app = createApp();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, createStore, startServer };
