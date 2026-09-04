const { createApp } = require('../src/app');

function collectRoutes(stack, prefix = '') {
  return stack.flatMap((layer) => {
    if (layer.route) {
      return Object.keys(layer.route.methods).map((method) => ({ method: method.toUpperCase(), path: `${prefix}${layer.route.path}` }));
    }
    if (layer.name === 'router' && layer.handle.stack) {
      const mount = layer.regexp?.source
        ?.split('(?=')[0]
        .replace(/^\^/u, '')
        .replace(/\\\//gu, '/')
        .replace(/\/?$/u, '') || '';
      return collectRoutes(layer.handle.stack, `${prefix}${mount}`);
    }
    return [];
  });
}

function assertStaticRoutesFirst(stack) {
  const paths = stack.filter((layer) => layer.route).flatMap((layer) => Object.keys(layer.route.methods).map((method) => ({ method, path: layer.route.path })));
  for (const method of new Set(paths.map((route) => route.method))) {
    const ordered = paths.filter((route) => route.method === method).map((route) => route.path);
    const firstParameterized = ordered.findIndex((path) => path.split('/').some((segment) => segment.startsWith(':')));
    if (firstParameterized < 0) continue;
    expect(ordered.slice(firstParameterized + 1).some((path) => !path.split('/').some((segment) => segment.startsWith(':')))).toBe(false);
  }
  for (const layer of stack) {
    if (layer.name === 'router' && layer.handle.stack) assertStaticRoutesFirst(layer.handle.stack);
  }
}

describe('registre des routes HTTP', () => {
  test('ne contient pas deux routes identiques pour la même méthode', () => {
    const routes = collectRoutes(createApp()._router.stack);
    const keys = routes.map((route) => `${route.method} ${route.path}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('les routes statiques sont déclarées avant les paramètres dans chaque routeur', () => {
    assertStaticRoutesFirst(createApp()._router.stack);
  });
});