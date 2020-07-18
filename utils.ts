export function canonicalize(url: string): string {
  let canon: String = url;

  if (!canon.startsWith('/')) {
    canon = '/' + url;
  }

  if (canon.endsWith('/')) {
    canon = canon.substr(0, canon.length - 1);
  }

  return canon.valueOf();
}
