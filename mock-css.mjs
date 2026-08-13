export function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('.css')) {
    return {
      format: 'module',
      shortCircuit: true,
      url: new URL('data:text/javascript,export default {};').href,
    };
  }
  return nextResolve(specifier, context);
}
export function load(url, context, nextLoad) {
  if (url.startsWith('data:text/javascript')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: 'export default {};',
    };
  }
  return nextLoad(url, context);
}
