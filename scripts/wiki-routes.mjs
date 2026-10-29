// Every task has a verified path through the cached, real Wikipedia link graph.
export function buildWikiRoutes(articles) {
  const tasks = [];
  for (const start of Object.keys(articles).sort()) {
    const queue = [[start]],
      seen = new Set([start]);
    for (let index = 0; index < queue.length; index++) {
      const path = queue[index];
      if (path.length >= 3)
        tasks.push({
          id: `wiki-route-${encodeURIComponent(start)}-${encodeURIComponent(path.at(-1))}`,
          start,
          target: path.at(-1),
          path,
        });
      if (path.length >= 5) continue;
      for (const link of articles[path.at(-1)].links) {
        if (!articles[link] || seen.has(link)) continue;
        seen.add(link);
        queue.push([...path, link]);
      }
    }
  }
  if (tasks.length < 500)
    throw new Error(
      `Only ${tasks.length} reachable routes; at least 500 required.`,
    );
  return tasks;
}
