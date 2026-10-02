export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const path = await import("node:path");
    const { pathToFileURL } = await import("node:url");
    const absolute = path.join(process.cwd(), "src", `${specifier.slice(2)}.ts`);
    return nextResolve(pathToFileURL(absolute).href, context);
  }
  return nextResolve(specifier, context);
}
